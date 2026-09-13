import re
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Commodity, Center, Booking, QueueEntry

router = APIRouter(prefix="/assistant", tags=["Voice Assistant & Farmer Chatbot"])

class AssistantQueryRequest(BaseModel):
    query: str
    language: Optional[str] = "hi"
    user_id: Optional[str] = None
    user_role: Optional[str] = "farmer"
    current_page: Optional[str] = None

class AssistantAction(BaseModel):
    label: str
    url: str
    type: str = "link"

class AssistantQueryResponse(BaseModel):
    success: bool
    response: str
    audio_text: str
    category: str
    quick_actions: List[AssistantAction] = []
    suggestions: List[str] = []

# Knowledge base for procurement calendars & schedules
PROCUREMENT_SCHEDULES = {
    "wheat": {
        "crop_hi": "गेहूं (Wheat)",
        "season": "रबी (Rabi 2026)",
        "start_date": "1 अप्रैल 2026",
        "end_date": "15 मई 2026",
        "msp": "₹2,275 / क्विंटल",
        "demo_rate": "₹2,425 / क्विंटल",
        "moisture": "12.0% अधिकतम",
        "status": "सक्रिय (खरीद जारी / पंजीकरण खुला)"
    },
    "mustard": {
        "crop_hi": "सरसों (Mustard)",
        "season": "रबी (Rabi 2026)",
        "start_date": "15 मार्च 2026",
        "end_date": "30 अप्रैल 2026",
        "msp": "₹5,650 / क्विंटल",
        "demo_rate": "₹5,650 / क्विंटल",
        "moisture": "9.0% अधिकतम",
        "status": "सक्रिय (खरीद आरंभ)"
    },
    "gram": {
        "crop_hi": "चना (Gram)",
        "season": "रबी (Rabi 2026)",
        "start_date": "1 अप्रैल 2026",
        "end_date": "15 मई 2026",
        "msp": "₹5,440 / क्विंटल",
        "demo_rate": "₹5,440 / क्विंटल",
        "moisture": "10.0% अधिकतम",
        "status": "आगामी / सक्रिय"
    },
    "barley": {
        "crop_hi": "जौ (Barley)",
        "season": "रबी (Rabi 2026)",
        "start_date": "1 अप्रैल 2026",
        "end_date": "15 मई 2026",
        "msp": "₹1,850 / क्विंटल",
        "demo_rate": "₹1,980 / क्विंटल",
        "moisture": "12.0% अधिकतम",
        "status": "आगामी / सक्रिय"
    },
    "paddy": {
        "crop_hi": "धान / चावल (Paddy)",
        "season": "खरीफ (Kharif 2026)",
        "start_date": "1 अक्टूबर 2026",
        "end_date": "15 नवंबर 2026",
        "msp": "₹2,183 / क्विंटल",
        "demo_rate": "₹2,320 / क्विंटल",
        "moisture": "17.0% अधिकतम",
        "status": "खरीफ सीजन शेड्यूल"
    },
    "bajra": {
        "crop_hi": "बाजरा (Bajra)",
        "season": "खरीफ (Kharif 2026)",
        "start_date": "1 अक्टूबर 2026",
        "end_date": "15 नवंबर 2026",
        "msp": "₹2,500 / क्विंटल",
        "demo_rate": "₹2,625 / क्विंटल",
        "moisture": "12.0% अधिकतम",
        "status": "खरीफ सीजन शेड्यूल"
    },
    "cotton": {
        "crop_hi": "कपास (Cotton)",
        "season": "खरीफ (Kharif 2026)",
        "start_date": "15 अक्टूबर 2026",
        "end_date": "31 दिसंबर 2026",
        "msp": "₹6,620 / क्विंटल",
        "demo_rate": "₹7,122 / क्विंटल",
        "moisture": "8.5% अधिकतम",
        "status": "खरीफ सीजन शेड्यूल"
    },
    "maize": {
        "crop_hi": "मक्का (Maize)",
        "season": "खरीफ (Kharif 2026)",
        "start_date": "1 अक्टूबर 2026",
        "end_date": "30 नवंबर 2026",
        "msp": "₹2,090 / क्विंटल",
        "demo_rate": "₹2,225 / क्विंटल",
        "moisture": "14.0% अधिकतम",
        "status": "खरीफ सीजन शेड्यूल"
    },
    "soybean": {
        "crop_hi": "सोयाबीन (Soybean)",
        "season": "खरीफ (Kharif 2026)",
        "start_date": "15 अक्टूबर 2026",
        "end_date": "30 नवंबर 2026",
        "msp": "₹4,892 / क्विंटल",
        "demo_rate": "₹4,892 / क्विंटल",
        "moisture": "12.0% अधिकतम",
        "status": "खरीफ सीजन शेड्यूल"
    }
}

def detect_crop_key(text: str) -> Optional[str]:
    t = text.lower()
    if any(w in t for w in ["गेहूं", "गेहु", "wheat", "gehu", "gehun"]):
        return "wheat"
    if any(w in t for w in ["सरसों", "सरसो", "mustard", "sarson", "sarsho"]):
        return "mustard"
    if any(w in t for w in ["चना", "gram", "chana"]):
        return "gram"
    if any(w in t for w in ["जौ", "barley", "jau"]):
        return "barley"
    if any(w in t for w in ["धान", "चावल", "paddy", "rice", "dhan", "chawal"]):
        return "paddy"
    if any(w in t for w in ["बाजरा", "bajra"]):
        return "bajra"
    if any(w in t for w in ["कपास", "cotton", "kapas"]):
        return "cotton"
    if any(w in t for w in ["मक्का", "maize", "makka"]):
        return "maize"
    if any(w in t for w in ["सोयाबीन", "soybean", "soya"]):
        return "soybean"
    return None

DISTRICT_TRANSLITERATIONS = {
    "करनाल": "karnal",
    "अंबाला": "ambala",
    "रोहतक": "rohtak",
    "झज्जर": "jhajjar",
    "सोनीपत": "sonipat",
    "पानीपत": "panipat",
    "हिसार": "hisar",
    "भिवानी": "bhiwani",
    "जींद": "jind",
    "रेवाड़ी": "rewari",
    "रेवाडी": "rewari",
    "सिरसा": "sirsa",
    "कैथल": "kaithal",
    "कुरुक्षेत्र": "kurukshetra",
    "फतेहाबाद": "fatehabad",
    "इंदौर": "indore",
    "भोपाल": "bhopal",
    "पटियाला": "patiala",
}

def detect_district_or_center(text: str, centers: List[Center]) -> Optional[Center]:
    t = text.lower()
    # Check Hindi transliterations
    for hi_name, en_name in DISTRICT_TRANSLITERATIONS.items():
        if hi_name in t or en_name in t:
            for c in centers:
                if c.district.lower() == en_name:
                    return c
    # Check direct substring
    for c in centers:
        if c.district.lower() in t or c.name.lower() in t:
            return c
    return None

@router.post("/query", response_model=AssistantQueryResponse)
def process_assistant_query(req: AssistantQueryRequest, db: Session = Depends(get_db)):
    q = req.query.strip()
    q_lower = q.lower()

    # Load db commodities and centers
    commodities = db.query(Commodity).all()
    centers = db.query(Center).all()

    # -------------------------------------------------------------
    # 1. GREETINGS & INTRO
    # -------------------------------------------------------------
    if re.search(r"^(नमस्ते|नमस्कार|hello|hi|hey|राम राम|प्रणाम|kisan vani|who are you|आप कौन हो)", q_lower):
        resp_text = (
            "**नमस्ते किसान भाई! 🙏 मैं 'किसान वाणी' (Kisan Vani) आपकी डिजिटल कृषि सहायिका हूँ।**\n\n"
            "मैं आपकी निम्न विषयों में मदद कर सकती हूँ:\n"
            "• 🌾 **फसलों के न्यूनतम समर्थन मूल्य (MSP) व मंडी भाव**\n"
            "• 📅 **सरकारी खरीद शुरू होने की तारीखें व समय-सारणी**\n"
            "• 📍 **नजदीकी खरीद केंद्र व वर्तमान भीड़ की स्थिति**\n"
            "• ⚡ **डिजिटल टोकन व स्लॉट बुकिंग सहायता**\n"
            "• 💳 **भुगतान (DBT) स्थिति व शिकायत निवारण**\n\n"
            "आप बोलकर या लिखकर अपना कोई भी सवाल पूछ सकते हैं!"
        )
        audio_text = "नमस्ते किसान भाई! मैं किसान वाणी हूँ। आप मुझसे फसलों के भाव, सरकारी खरीद की तारीखें, नजदीकी मंडी और स्लॉट बुकिंग के बारे में पूछ सकते हैं।"
        return AssistantQueryResponse(
            success=True,
            response=resp_text,
            audio_text=audio_text,
            category="general",
            quick_actions=[
                AssistantAction(label="🌾 फसलों का भाव (MSP)", url="farmer/centers.html"),
                AssistantAction(label="📅 खरीद तिथियां (Dates)", url="#dates"),
                AssistantAction(label="📍 नजदीकी खरीद केंद्र", url="farmer/centers.html"),
                AssistantAction(label="⚡ टोकन बुक करें", url="farmer/booking.html")
            ],
            suggestions=[
                "गेहूं का एमएसपी भाव क्या है?",
                "सरसों की खरीद कब शुरू होगी?",
                "करनाल मंडी में कितनी भीड़ है?",
                "टोकन कैसे बुक करें?"
            ]
        )

    # -------------------------------------------------------------
    # 2. PROCUREMENT STARTING DATES & SCHEDULES (खरीद तिथियां)
    # -------------------------------------------------------------
    date_keywords = ["तारीख", "तारीखें", "शुरू", "कब शुरू", "कब से", "दिनांक", "schedule", "date", "starting date", "start date", "kab hogi", "kab shuru", "shuru kab", "kab se shuru"]
    crop_found = detect_crop_key(q_lower)

    if any(k in q_lower for k in date_keywords) or (crop_found and any(w in q_lower for w in ["खरीद", "procurement", "mandi kab"])):
        if crop_found and crop_found in PROCUREMENT_SCHEDULES:
            sc = PROCUREMENT_SCHEDULES[crop_found]
            resp_text = (
                f"📅 **{sc['crop_hi']} की सरकारी खरीद समय-सारणी ({sc['season']})**:\n\n"
                f"• **खरीद शुरू होने की तारीख:** **{sc['start_date']}**\n"
                f"• **खरीद समाप्त होने की तारीख:** **{sc['end_date']}**\n"
                f"• **न्यूनतम समर्थन मूल्य (MSP):** **{sc['msp']}**\n"
                f"• **डेमो मंडी दर:** {sc['demo_rate']}\n"
                f"• **अधिकतम मान्य नमी (Moisture):** {sc['moisture']}\n"
                f"• **स्थिति:** {sc['status']}\n\n"
                f"💡 *सलाह: खरीद केंद्र पर जाने से पहले KisanSetu पोर्टल पर अपना समय स्लॉट और डिजिटल टोकन अवश्य बुक करें ताकि मंडी में लाइन में न लगना पड़े।*"
            )
            audio_text = f"{sc['crop_hi']} की सरकारी खरीद {sc['start_date']} से {sc['end_date']} तक चलेगी। इसका न्यूनतम समर्थन मूल्य {sc['msp']} है और अधिकतम नमी {sc['moisture']} स्वीकार्य है।"
            return AssistantQueryResponse(
                success=True,
                response=resp_text,
                audio_text=audio_text,
                category="procurement_dates",
                quick_actions=[
                    AssistantAction(label="⚡ इस फसल के लिए टोकन बुक करें", url=f"farmer/booking.html?crop={crop_found}"),
                    AssistantAction(label="📍 खरीद केंद्र देखें", url="farmer/centers.html")
                ],
                suggestions=[
                    "गेहूं का भाव क्या है?",
                    "सरसों खरीद कब शुरू होगी?",
                    "मंडी का समय क्या है?",
                    "दस्तावेज क्या लगेंगे?"
                ]
            )
        else:
            # Overall Procurement Calendar
            resp_text = (
                "📅 **सरकारी खरीद 2026 (खरीद शुरू होने की तिथियां व समय-सारणी)**:\n\n"
                "🌾 **रबी फसलें (Rabi Procurement):**\n"
                "• **सरसों (Mustard):** 15 मार्च 2026 से 30 अप्रैल 2026 (MSP: ₹5,650/Q)\n"
                "• **गेहूं (Wheat):** 1 अप्रैल 2026 से 15 मई 2026 (MSP: ₹2,275/Q)\n"
                "• **चना (Gram):** 1 अप्रैल 2026 से 15 मई 2026 (MSP: ₹5,440/Q)\n"
                "• **जौ (Barley):** 1 अप्रैल 2026 से 15 मई 2026 (MSP: ₹1,850/Q)\n\n"
                "🌾 **खरीफ फसलें (Kharif Procurement):**\n"
                "• **धान (Paddy):** 1 अक्टूबर 2026 से 15 नवंबर 2026 (MSP: ₹2,183/Q)\n"
                "• **बाजरा (Bajra):** 1 अक्टूबर 2026 से 15 नवंबर 2026 (MSP: ₹2,500/Q)\n"
                "• **कपास (Cotton):** 15 अक्टूबर 2026 से 31 दिसंबर 2026 (MSP: ₹6,620/Q)\n"
                "• **मक्का (Maize):** 1 अक्टूबर 2026 से 30 नवंबर 2026 (MSP: ₹2,090/Q)\n"
                "• **सोयाबीन (Soybean):** 15 अक्टूबर 2026 से 30 नवंबर 2026 (MSP: ₹4,892/Q)\n\n"
                "🕒 **मंडी का समय:** प्रातः 09:00 बजे से सायं 05:00/06:00 बजे तक (सोमवार से शनिवार)।"
            )
            audio_text = "रबी फसलों में सरसों की खरीद 15 मार्च से और गेहूं, चना और जौ की खरीद 1 अप्रैल 2026 से शुरू होगी। धान और बाजरे की खरीद 1 अक्टूबर से शुरू होगी।"
            return AssistantQueryResponse(
                success=True,
                response=resp_text,
                audio_text=audio_text,
                category="procurement_dates",
                quick_actions=[
                    AssistantAction(label="⚡ स्लॉट बुक करें (Book Slot)", url="farmer/booking.html"),
                    AssistantAction(label="📍 नजदीकी खरीद केंद्र (Centers)", url="farmer/centers.html")
                ],
                suggestions=[
                    "गेहूं की खरीद कब शुरू होगी?",
                    "सरसों का एमएसपी भाव कितना है?",
                    "मंडी जाने के लिए क्या दस्तावेज चाहिए?"
                ]
            )

    # -------------------------------------------------------------
    # 3. CROP PRICES & MSP RATES (फसलों के भाव व एमएसपी)
    # -------------------------------------------------------------
    price_keywords = ["भाव", "कीमत", "दाम", "रेट", "rate", "price", "msp", "एमएसपी", "kitna rate", "kya bhav", "bhav kya hai", "prati quintal"]
    if any(k in q_lower for k in price_keywords) or crop_found:
        if crop_found:
            matched_comm = next((c for c in commodities if crop_found in c.name.lower() or crop_found in (c.name_english or "").lower()), None)
            if matched_comm:
                c_name = matched_comm.hindi_name or matched_comm.name
                c_msp = matched_comm.msp_per_quintal
                c_demo = matched_comm.demo_rate
                c_moist = matched_comm.moisture_max_percent
                resp_text = (
                    f"🌾 **{c_name} का आधिकारिक मूल्य विवरण**:\n\n"
                    f"• **सरकारी न्यूनतम समर्थन मूल्य (MSP):** **₹{c_msp:,.2f} / क्विंटल**\n"
                    f"• **डेमो प्रचलित मंडी दर (Demo Rate):** ₹{c_demo:,.2f} / क्विंटल\n"
                    f"• **अधिकतम मान्य नमी (Max Moisture):** **{c_moist}%**\n"
                    f"• **फसल श्रेणी (Category):** {matched_comm.category}\n"
                    f"• **सीजन:** {matched_comm.season}\n\n"
                    f"ℹ️ *नमी मानक: यदि आपकी उपज में नमी {c_moist}% या उससे कम है, तो आपको पूरा समर्थन मूल्य बिना किसी कटौती के मिलेगा। भुगतान सीधा बैंक खाते में डीबीटी (DBT) द्वारा 48-72 घंटों में किया जाता है।*"
                )
                audio_text = f"{c_name} का सरकारी एमएसपी भाव ₹{int(c_msp)} प्रति क्विंटल है। इसमें अधिकतम स्वीकार्य नमी {c_moist} प्रतिशत है।"
                return AssistantQueryResponse(
                    success=True,
                    response=resp_text,
                    audio_text=audio_text,
                    category="prices",
                    quick_actions=[
                        AssistantAction(label="⚡ इस भाव पर स्लॉट बुक करें", url=f"farmer/booking.html?crop={crop_found}"),
                        AssistantAction(label="📍 नजदीकी मंडी में रेट देखें", url="farmer/centers.html")
                    ],
                    suggestions=[
                        f"{c_name} की खरीद कब शुरू होगी?",
                        "नमी ज्यादा होने पर क्या होगा?",
                        "पेमेंट कितने दिन में आएगा?",
                        "अन्य फसलों के भाव"
                    ]
                )

        # General Rates List
        lines = []
        for com in commodities[:6]:
            hname = com.hindi_name or com.name
            lines.append(f"• **{hname}:** MSP **₹{com.msp_per_quintal:,.0f}** / Q (नमी सीमा: {com.moisture_max_percent}%)")

        resp_text = (
            "🌾 **मुख्य फसलों के चालू न्यूनतम समर्थन मूल्य (MSP Rates 2026)**:\n\n"
            + "\n".join(lines)
            + "\n\n"
            "• **भुगतान प्रणाली:** डिजिटल वेईब्रिज रसीद के बाद 48-72 घंटे में सीधे आपके बैंक खाते में DBT अंतरण।\n"
            "• **कटौती नियम:** मानक नमी सीमा के अंदर लाने पर पूरा भाव मिलता है।"
        )
        audio_text = "वर्तमान में गेहूं का एमएसपी 2275 रुपये, सरसों का 5650 रुपये, धान का 2183 रुपये और बाजरा का 2500 रुपये प्रति क्विंटल है।"
        return AssistantQueryResponse(
            success=True,
            response=resp_text,
            audio_text=audio_text,
            category="prices",
            quick_actions=[
                AssistantAction(label="🌾 सभी फसलें व केंद्र देखें", url="farmer/centers.html"),
                AssistantAction(label="⚡ स्लॉट बुक करें", url="farmer/booking.html")
            ],
            suggestions=[
                "गेहूं का भाव क्या है?",
                "सरसों का भाव क्या है?",
                "चना का भाव क्या है?",
                "कपास का भाव क्या है?"
            ]
        )

    # -------------------------------------------------------------
    # 4. CENTERS & LIVE QUEUE / BHEED (खरीद केंद्र व कतार)
    # -------------------------------------------------------------
    center_keywords = ["मंडी", "केंद्र", "center", "mandi", "bheed", "भीड़", "wait", "waiting", "कतार", "लाइन", "wait time", "traffic", "kitni bheed"]
    if any(k in q_lower for k in center_keywords):
        matched_c = detect_district_or_center(q_lower, centers)
        if matched_c:
            load_hi = {"low": "कम भीड़ (ग्रीन)", "medium": "मध्यम भीड़ (ऑरेंज)", "high": "अधिक भीड़ (रेड)"}.get(matched_c.load_status, "सामान्य")
            resp_text = (
                f"📍 **{matched_c.name} ({matched_c.district}, {matched_c.state})**:\n\n"
                f"• **पता:** {matched_c.address}\n"
                f"• **ऑपरेटिंग समय:** {matched_c.operating_hours}\n"
                f"• **कतार की वर्तमान स्थिति:** **{load_hi}**\n"
                f"• **लाइन में वाहन:** {matched_c.current_queue_vehicles} वाहन\n"
                f"• **अनुमानित प्रतीक्षा समय (Wait Time):** लगभग **{matched_c.estimated_wait_minutes} मिनट**\n"
                f"• **दैनिक क्षमता:** {matched_c.daily_capacity_mt} MT\n"
                f"• **मुख्य फसल:** {matched_c.commodity}\n\n"
                f"⚡ *सुझाव: आप इस केंद्र पर अपनी फसल बेचने के लिए ऑनलाइन टोकन प्राप्त कर सकते हैं।*"
            )
            audio_text = f"{matched_c.name} में अभी {matched_c.current_queue_vehicles} वाहन कतार में हैं और अनुमानित प्रतीक्षा समय लगभग {matched_c.estimated_wait_minutes} मिनट है।"
            return AssistantQueryResponse(
                success=True,
                response=resp_text,
                audio_text=audio_text,
                category="centers",
                quick_actions=[
                    AssistantAction(label="⚡ इस केंद्र पर टोकन बुक करें", url=f"farmer/booking.html?centerId={matched_c.id}"),
                    AssistantAction(label="📊 लाइव कतार देखें", url=f"farmer/queue.html?centerId={matched_c.id}")
                ],
                suggestions=[
                    "स्लॉट कैसे बुक करें?",
                    "टोकन कैसे मिलेगा?",
                    "गेहूं का भाव क्या है?"
                ]
            )

        # Overview of active centers
        c_lines = []
        for c in centers[:4]:
            load_hi = "कम भीड़" if c.load_status == "low" else ("मध्यम" if c.load_status == "medium" else "भारी भीड़")
            c_lines.append(f"• **{c.name} ({c.district}):** {c.current_queue_vehicles} वाहन कतार में • प्रतीक्षा ~{c.estimated_wait_minutes} मिनट ({load_hi})")

        resp_text = (
            "📍 **प्रमुख खरीद केंद्र (Live Mandi Queue Overview)**:\n\n"
            + "\n".join(c_lines)
            + "\n\n"
            "💡 आप किसी भी जिले (जैसे 'करनाल', 'अंबाला', 'रोहतक', 'हिसार') का नाम लिखकर उस मंडी की लाइव स्थिति जान सकते हैं।"
        )
        audio_text = "हरियाणा के प्रमुख केंद्रों में करनाल, अंबाला, रोहतक और सोनीपत मंडियां सक्रिय हैं। आप किसी भी जिले का नाम बोलकर वहां की स्थिति जान सकते हैं।"
        return AssistantQueryResponse(
            success=True,
            response=resp_text,
            audio_text=audio_text,
            category="centers",
            quick_actions=[
                AssistantAction(label="📍 सभी 15+ खरीद केंद्र देखें", url="farmer/centers.html"),
                AssistantAction(label="⚡ लाइव कतार मॉनिटर", url="farmer/queue.html")
            ],
            suggestions=[
                "करनाल मंडी की स्थिति बताओ",
                "अंबाला मंडी में कितनी भीड़ है?",
                "रोहतक खरीद केंद्र"
            ]
        )

    # -------------------------------------------------------------
    # 5. HOW TO BOOK SLOT / TOKEN (स्लॉट बुकिंग व टोकन पर्ची)
    # -------------------------------------------------------------
    booking_keywords = ["बुकिंग", "स्लॉट", "booking", "slot", "token", "टोकन", "kaise book", "kaise kare", "book kaise", "number lagana", "parchi"]
    if any(k in q_lower for k in booking_keywords):
        resp_text = (
            "⚡ **KisanSetu पर डिजिटल टोकन व स्लॉट बुक करने के 5 आसान चरण**:\n\n"
            "1. **लॉगिन करें:** किसान पोर्टल में अपने मोबाइल नंबर से लॉगिन करें।\n"
            "2. **केंद्र चुनें:** 'खरीद केंद्र खोजें' पर जाकर अपने जिले की नजदीकी मंडी चुनें।\n"
            "3. **फसल व मात्रा भरें:** अपनी फसल (गेहूं, सरसों आदि) और अनुमानित वजन (क्विंटल) दर्ज करें।\n"
            "4. **समय स्लॉट चुनें:** अपनी सुविधानुसार तारीख और समय (जैसे 09:00 AM - 10:00 AM) चुनें।\n"
            "5. **डिजिटल टोकन प्राप्त करें:** पुष्टि करते ही आपको **टोकन आईडी (जैसे KS-TKN-1011)** और क्यूआर कोड मिल जाएगा!\n\n"
            "📱 *मंडी गेट पर केवल यह टोकन नंबर या क्यूआर कोड दिखाना होगा, जिससे सीधी वेईब्रिज एंट्री मिलेगी।*"
        )
        audio_text = "टोकन बुक करने के लिए पोर्टल पर खरीद केंद्र चुनें, अपनी फसल और तारीख का समय चुनें, और वाहन नंबर डालकर तुरंत डिजिटल टोकन प्राप्त करें।"
        return AssistantQueryResponse(
            success=True,
            response=resp_text,
            audio_text=audio_text,
            category="booking",
            quick_actions=[
                AssistantAction(label="⚡ अभी स्लॉट बुक करें (Book Now)", url="farmer/booking.html"),
                AssistantAction(label="📋 मेरी बुकिंग देखें (My Bookings)", url="farmer/bookings.html"),
                AssistantAction(label="🎫 मेरा डिजिटल टोकन (View Token)", url="farmer/token.html")
            ],
            suggestions=[
                "टोकन रद्द कैसे करें?",
                "गेट पर क्या दिखाना होगा?",
                "गेहूं का भाव क्या है?",
                "लाइव कतार कैसे देखें?"
            ]
        )

    # -------------------------------------------------------------
    # 6. MANDI ARRIVAL & WEIGHBRIDGE PROCESS (मंडी आगमन व प्रक्रिया)
    # -------------------------------------------------------------
    arrival_keywords = ["गेट", "प्रक्रिया", "पहुंचने पर", "वजन", "कांटा", "gate", "arrival", "weighbridge", "kaise hoga", "process"]
    if any(k in q_lower for k in arrival_keywords):
        resp_text = (
            "🚛 **मंडी पहुंचने पर खरीद प्रक्रिया (Mandi Arrival & Weighment Process)**:\n\n"
            "1. **गेट सुरक्षा चेक-इन:** मंडी प्रवेश द्वार पर ऑपरेटर को अपना डिजिटल टोकन नंबर या क्यूआर कोड दिखाएं।\n"
            "2. **ग्रॉस वेईब्रिज (Gross Weight):** वाहन सहित कुल वजन कंप्यूटर कांटे पर दर्ज होगा।\n"
            "3. **नमी परीक्षण (Moisture Lab):** गुणवत्ता जांच टीम फसल के नमूने की नमी मापेगी (गेहूं ≤12%, सरसों ≤9%)।\n"
            "4. **फसल अनलोडिंग (Unloading):** आवंटित शेड में उपज खाली की जाएगी।\n"
            "5. **टेयर वजन (Tare Weight):** खाली वाहन का वजन लिया जाएगा।\n"
            "6. **डिजिटल रसीद (J-Form / Receipt):** शुद्ध वजन और कुल राशि की एसएमएस/पोर्टल रसीद तुरंत मिल जाएगी!"
        )
        audio_text = "मंडी पहुंचने पर गेट पर टोकन दिखाएं, फिर कांटे पर भरा वाहन तुलवाएं, नमी जांच करवाएं, माल खाली करके खाली गाड़ी का वजन कराएं और डिजिटल रसीद प्राप्त करें।"
        return AssistantQueryResponse(
            success=True,
            response=resp_text,
            audio_text=audio_text,
            category="process",
            quick_actions=[
                AssistantAction(label="⚡ लाइव कतार स्थिति", url="farmer/queue.html"),
                AssistantAction(label="🧾 मेरी रसीदें देखें", url="farmer/sales-history.html")
            ],
            suggestions=[
                "नमी अधिक होने पर क्या होगा?",
                "पेमेंट कब तक खाते में आएगी?",
                "शिकायत कैसे दर्ज करें?"
            ]
        )

    # -------------------------------------------------------------
    # 7. PAYMENT, DBT & BANK TRANSFERS (भुगतान व डीबीटी)
    # -------------------------------------------------------------
    payment_keywords = ["भुगतान", "पैसा", "रुपया", "payment", "dbt", "bank", "khate me", "paisa kab aayega", "account", "dbt payment"]
    if any(k in q_lower for k in payment_keywords):
        resp_text = (
            "💳 **फसल भुगतान प्रक्रिया व समय-सीमा (Direct Benefit Transfer)**:\n\n"
            "• **समय-सीमा:** खरीद रसीद जारी होने के **48 से 72 घंटों के भीतर** राशि आपके पंजीकृत बैंक खाते में भेज दी जाती है।\n"
            "• **माध्यम:** आधार-लिंक्ड बैंक खाता (Direct Benefit Transfer - DBT)।\n"
            "• **बैंक सत्यापन:** कृपया सुनिश्चित करें कि आपका बैंक खाता आधार से लिंक और डीबीटी सक्षम (DBT Enabled) है।\n"
            "• **भुगतान स्थिति:** आप किसान पोर्टल पर 'विक्रय इतिहास (Sales History)' में जाकर हर रसीद का यूटीआर नंबर और भुगतान स्थिति देख सकते हैं।\n\n"
            "⚠️ *यदि 72 घंटे के बाद भी भुगतान न आए, तो आप सीधे पोर्टल से शिकायत दर्ज कर सकते हैं।*"
        )
        audio_text = "फसल बिक्री का भुगतान डिजिटल रसीद कटने के 48 से 72 घंटों के भीतर सीधे आपके आधार लिंक्ड बैंक खाते में डीबीटी द्वारा जमा हो जाता है।"
        return AssistantQueryResponse(
            success=True,
            response=resp_text,
            audio_text=audio_text,
            category="payment",
            quick_actions=[
                AssistantAction(label="🌾 विक्रय इतिहास व भुगतान देखें", url="farmer/sales-history.html"),
                AssistantAction(label="⚖️ भुगतान शिकायत दर्ज करें", url="farmer/complaints.html")
            ],
            suggestions=[
                "शिकायत कैसे दर्ज करें?",
                "बैंक खाता कैसे बदलें?",
                "गेहूं का भाव क्या है?"
            ]
        )

    # -------------------------------------------------------------
    # 8. REQUIRED DOCUMENTS (आवश्यक दस्तावेज)
    # -------------------------------------------------------------
    doc_keywords = ["दस्तावेज", "कागजात", "document", "kya chahiye", "documents", "aadhaar", "fard", "jamabandi"]
    if any(k in q_lower for k in doc_keywords):
        resp_text = (
            "📋 **मंडी खरीद हेतु आवश्यक दस्तावेज (Checklist)**:\n\n"
            "1. **आधार कार्ड (Aadhaar Card):** किसान पहचान सत्यापन हेतु।\n"
            "2. **भूमि रिकॉर्ड (जमाबंदी / फर्द / गिरदावरी):** फसल सत्यापन हेतु।\n"
            "3. **बैंक पासबुक प्रति:** जिसमें खाता संख्या और IFSC कोड स्पष्ट हो।\n"
            "4. **डिजिटल टोकन पर्ची:** मोबाइल में एसएमएस या स्क्रीनशॉट मान्य है।\n"
            "5. **वाहन आरसी / चालक विवरण:** वाहन का नंबर।"
        )
        audio_text = "मंडी में बिक्री के लिए आधार कार्ड, जमीन की फर्द या जमाबंदी, बैंक पासबुक और मोबाइल पर किसान सेतु का डिजिटल टोकन आवश्यक है।"
        return AssistantQueryResponse(
            success=True,
            response=resp_text,
            audio_text=audio_text,
            category="documents",
            quick_actions=[
                AssistantAction(label="⚡ टोकन बुक करें", url="farmer/booking.html"),
                AssistantAction(label="👤 किसान प्रोफाइल देखें", url="farmer/dashboard.html#profile-summary")
            ],
            suggestions=[
                "स्लॉट कैसे बुक करें?",
                "गेहूं का भाव क्या है?",
                "सरसों की खरीद कब शुरू होगी?"
            ]
        )

    # -------------------------------------------------------------
    # 9. COMPLAINTS & GRIEVANCE REDRESSAL (शिकायत निवारण)
    # -------------------------------------------------------------
    complaint_keywords = ["शिकायत", "समस्या", "complaint", "grivance", "help", "madad", "fraud", "dhandhli", "katoti", "operator problem"]
    if any(k in q_lower for k in complaint_keywords):
        resp_text = (
            "⚖️ **किसान सेतु शिकायत निवारण प्रणाली (Grievance Redressal)**:\n\n"
            "यदि आपको खरीद केंद्र पर किसी भी प्रकार की परेशानी है (जैसे: भुगतान में देरी, अनुचित नमी कटौती, कांटे में गड़बड़ी, या ऑपरेटर का दुर्व्यवहार), तो आप तुरंत शिकायत दर्ज कर सकते हैं:\n\n"
            "• **स्तरीय निवारण:** आपकी शिकायत पहले मंडी ऑपरेटर, फिर जिला कृषि अधिकारी (District Admin), और आवश्यकता पड़ने पर स्टेट सुपर एडमिन तक स्वचालित एस्केलेट होती है।\n"
            "• **समाधान अवधि:** सामान्य शिकायतों का समाधान 24 से 48 घंटे में अनिवार्य है।\n"
            "• **ट्रैकिंग:** आपको एक यूनिक शिकायत आईडी (जैसे CMP-2026-001) मिलती है जिससे आप लाइव स्टेटस देख सकते हैं।"
        )
        audio_text = "किसी भी समस्या जैसे भुगतान में देरी या वजन में गड़बड़ी के लिए आप किसान सेतु शिकायत पोर्टल पर सीधे शिकायत दर्ज कर सकते हैं। 24 से 48 घंटे में समाधान किया जाता है।"
        return AssistantQueryResponse(
            success=True,
            response=resp_text,
            audio_text=audio_text,
            category="complaints",
            quick_actions=[
                AssistantAction(label="⚖️ नई शिकायत दर्ज करें (File Complaint)", url="farmer/complaints.html"),
                AssistantAction(label="🔍 दर्ज शिकायत की स्थिति देखें", url="farmer/complaints.html")
            ],
            suggestions=[
                "भुगतान नहीं मिला तो क्या करें?",
                "नमी कटौती के नियम क्या हैं?",
                "हेल्पलाइन नंबर क्या है?"
            ]
        )

    # -------------------------------------------------------------
    # 10. MOISTURE DEDUCTION RULES (नमी कटौती नियम)
    # -------------------------------------------------------------
    moisture_keywords = ["नमी", "moisture", "nami", "geela", "sukha", "katoti"]
    if any(k in q_lower for k in moisture_keywords):
        resp_text = (
            "💧 **नमी मापदंड व मूल्य नियम (Moisture Guidelines)**:\n\n"
            "• **गेहूं (Wheat):** अधिकतम **12%** नमी स्वीकार्य है। 12% से कम होने पर पूरा एमएसपी (₹2,275) मिलता है।\n"
            "• **सरसों (Mustard):** अधिकतम **9%** नमी। तेल की मात्रा की भी जांच होती है।\n"
            "• **धान (Paddy):** अधिकतम **17%** नमी।\n"
            "• **बाजरा (Bajra):** अधिकतम **12%** नमी।\n"
            "• **कपास (Cotton):** अधिकतम **8.5%** नमी।\n\n"
            "💡 *सलाह: फसल को मंडी लाने से पहले 1-2 दिन धूप में अच्छी तरह सुखा लें। यदि नमी सीमा से 1-2% अधिक हो, तो मामूली मूल्य कटौती (Discount) हो सकती है; अत्यधिक नमी होने पर फसल रिजेक्ट हो सकती है।*"
        )
        audio_text = "गेहूं में 12 प्रतिशत, सरसों में 9 प्रतिशत और धान में 17 प्रतिशत तक नमी स्वीकार्य है। मंडी लाने से पहले फसल को अच्छी तरह सुखा लें ताकि पूरा समर्थन मूल्य मिले।"
        return AssistantQueryResponse(
            success=True,
            response=resp_text,
            audio_text=audio_text,
            category="moisture",
            quick_actions=[
                AssistantAction(label="🌾 सभी फसलों के मानक देखें", url="farmer/centers.html"),
                AssistantAction(label="⚡ स्लॉट बुक करें", url="farmer/booking.html")
            ],
            suggestions=[
                "गेहूं का भाव क्या है?",
                "सरसों की खरीद कब शुरू होगी?",
                "मंडी में कांटे की जांच कैसे होती है?"
            ]
        )

    # -------------------------------------------------------------
    # 11. DEFAULT INTELLIGENT FALLBACK
    # -------------------------------------------------------------
    fallback_resp = (
        f"🌾 **किसान वाणी सहायता (Kisan Vani Assistant)**\n\n"
        f"आपके सवाल **'{q}'** के संदर्भ में:\n"
        f"• **फसलों के भाव:** गेहूं ₹2,275/Q, सरसों ₹5,650/Q, चना ₹5,440/Q, धान ₹2,183/Q, बाजरा ₹2,500/Q।\n"
        f"• **खरीद तिथियां:** सरसों खरीद 15 मार्च से, गेहूं व चना खरीद 1 अप्रैल 2026 से जारी है।\n"
        f"• **समय स्लॉट:** मंडी में लाइन से बचने के लिए किसान पोर्टल से पहले टोकन बुक करें।\n\n"
        f"आप नीचे दिए गए विकल्पों में से चुन सकते हैं या दोबारा अधिक स्पष्ट सवाल पूछ सकते हैं।"
    )
    fallback_audio = "किसान भाई, आप फसलों के भाव, खरीद की तारीखें, नजदीकी मंडी और टोकन बुकिंग के बारे में पूछ सकते हैं।"

    return AssistantQueryResponse(
        success=True,
        response=fallback_resp,
        audio_text=fallback_audio,
        category="general",
        quick_actions=[
            AssistantAction(label="🌾 फसलों के भाव (MSP)", url="farmer/centers.html"),
            AssistantAction(label="📅 खरीद की तारीखें", url="#dates"),
            AssistantAction(label="📍 नजदीकी खरीद केंद्र", url="farmer/centers.html"),
            AssistantAction(label="⚡ टोकन बुक करें", url="farmer/booking.html"),
            AssistantAction(label="⚖️ शिकायत दर्ज करें", url="farmer/complaints.html")
        ],
        suggestions=[
            "गेहूं का एमएसपी भाव क्या है?",
            "सरसों की खरीद कब शुरू होगी?",
            "करनाल मंडी में कितनी भीड़ है?",
            "टोकन कैसे बुक करें?",
            "पेमेंट कितने दिन में आएगा?"
        ]
    )

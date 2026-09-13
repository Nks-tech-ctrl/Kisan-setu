import json
import datetime
from sqlalchemy.orm import Session
from backend.database import SessionLocal, init_db
from backend.models import User, Center, Commodity, Booking, QueueEntry, ProcurementRecord, Complaint, SoilTestRecord

DEFAULT_CENTERS = [
    {
        "id": "CTR-HR-01",
        "name": "Karnal Central Procurement Center",
        "district": "Karnal",
        "state": "Haryana",
        "address": "Near New Anaj Mandi, GT Road, Karnal, Haryana - 132001",
        "operating_hours": "09:00 AM – 05:00 PM (सोमवार से शनिवार)",
        "commodity": "Wheat (Grade A)",
        "accepted_crops": json.dumps(["Wheat (Grade A)", "Paddy (Common)", "Mustard"]),
        "facilities": json.dumps(["डिजिटल टोकन", "इलेक्ट्रॉनिक वेईब्रिज", "किसान प्रतीक्षालय", "नमी मापक लैब", "ऑपरेटर सहायता"]),
        "daily_capacity_mt": 500,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 12,
        "estimated_wait_minutes": 45,
        "load_status": "low"
    },
    {
        "id": "CTR-HR-02",
        "name": "Ambala Grain Market Center",
        "district": "Ambala",
        "state": "Haryana",
        "address": "Kalka Chowk Mandi Complex, Ambala City, Haryana - 134003",
        "operating_hours": "08:30 AM – 05:30 PM (सोमवार से शनिवार)",
        "commodity": "Paddy (Common)",
        "accepted_crops": json.dumps(["Paddy (Common)", "Wheat (Grade A)", "Maize"]),
        "facilities": json.dumps(["डिजिटल टोकन", "वेईब्रिज लेन 1 & 2", "किसान शेड", "ऑपरेटर डेस्क"]),
        "daily_capacity_mt": 600,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 28,
        "estimated_wait_minutes": 80,
        "load_status": "medium"
    },
    {
        "id": "CTR-HR-03",
        "name": "Rohtak Central Procurement Center",
        "district": "Rohtak",
        "state": "Haryana",
        "address": "Jhajjar Road Anaj Mandi Yard, Rohtak, Haryana - 124001",
        "operating_hours": "09:00 AM – 05:30 PM (सोमवार से शनिवार)",
        "commodity": "Wheat (Grade A)",
        "accepted_crops": json.dumps(["Wheat (Grade A)", "Mustard", "Bajra"]),
        "facilities": json.dumps(["डिजिटल टोकन", "ऑटोमेटेड वेईब्रिज लेन 1-3", "किसान विश्राम गृह", "सॉइल व मॉइस्चर टेस्टिंग"]),
        "daily_capacity_mt": 700,
        "slot_duration": "45 मिनट",
        "current_queue_vehicles": 8,
        "estimated_wait_minutes": 25,
        "load_status": "low"
    },
    {
        "id": "CTR-HR-04",
        "name": "Jhajjar Anaj Mandi Center",
        "district": "Jhajjar",
        "state": "Haryana",
        "address": "Rewari-Rohtak Bypass, Mandi Complex, Jhajjar, Haryana - 124103",
        "operating_hours": "09:00 AM – 05:00 PM (सोमवार से शनिवार)",
        "commodity": "Mustard",
        "accepted_crops": json.dumps(["Mustard", "Wheat (Grade A)", "Bajra"]),
        "facilities": json.dumps(["डिजिटल टोकन", "इलेक्ट्रॉनिक कांटा", "किसान प्रतीक्षालय", "नमी परीक्षण"]),
        "daily_capacity_mt": 550,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 15,
        "estimated_wait_minutes": 40,
        "load_status": "low"
    },
    {
        "id": "CTR-HR-05",
        "name": "Sonipat Grain Yard Center",
        "district": "Sonipat",
        "state": "Haryana",
        "address": "Old DC Road Mandi, Sonipat, Haryana - 131001",
        "operating_hours": "08:30 AM – 05:30 PM (सोमवार से शनिवार)",
        "commodity": "Wheat (Grade A)",
        "accepted_crops": json.dumps(["Wheat (Grade A)", "Paddy (Common)", "Mustard"]),
        "facilities": json.dumps(["डिजिटल टोकन", "डबल वेईब्रिज", "किसान शेड", "सीसीटीवी सुरक्षा"]),
        "daily_capacity_mt": 650,
        "slot_duration": "45 मिनट",
        "current_queue_vehicles": 34,
        "estimated_wait_minutes": 95,
        "load_status": "high"
    },
    {
        "id": "CTR-HR-06",
        "name": "Panipat Agro Intake Terminal",
        "district": "Panipat",
        "state": "Haryana",
        "address": "Barsat Road New Mandi, Panipat, Haryana - 132103",
        "operating_hours": "08:00 AM – 06:00 PM (सोमवार से शनिवार)",
        "commodity": "Paddy (Common)",
        "accepted_crops": json.dumps(["Paddy (Common)", "Wheat (Grade A)", "Barley"]),
        "facilities": json.dumps(["डिजिटल टोकन", "इलेक्ट्रॉनिक वेईब्रिज लेन 1-4", "लैब टेस्टिंग", "कैंटीन"]),
        "daily_capacity_mt": 800,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 24,
        "estimated_wait_minutes": 65,
        "load_status": "medium"
    },
    {
        "id": "CTR-HR-07",
        "name": "Hisar Mandi Hub",
        "district": "Hisar",
        "state": "Haryana",
        "address": "Sirsa Road Anaj Mandi, Hisar, Haryana - 125001",
        "operating_hours": "09:00 AM – 06:00 PM (सोमवार से शनिवार)",
        "commodity": "Cotton",
        "accepted_crops": json.dumps(["Cotton", "Wheat (Grade A)", "Mustard", "Gram"]),
        "facilities": json.dumps(["डिजिटल टोकन", "कपास ग्रेडिंग लैब", "हैवी वेईब्रिज", "विश्राम गृह"]),
        "daily_capacity_mt": 900,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 18,
        "estimated_wait_minutes": 50,
        "load_status": "medium"
    },
    {
        "id": "CTR-HR-08",
        "name": "Bhiwani Procurement Center",
        "district": "Bhiwani",
        "state": "Haryana",
        "address": "Tosham Road Mandi Yard, Bhiwani, Haryana - 127021",
        "operating_hours": "09:00 AM – 05:00 PM (सोमवार से शनिवार)",
        "commodity": "Bajra",
        "accepted_crops": json.dumps(["Bajra", "Mustard", "Gram", "Wheat (Grade A)"]),
        "facilities": json.dumps(["डिजिटल टोकन", "इलेक्ट्रॉनिक कांटा", "किसान सहायता केंद्र"]),
        "daily_capacity_mt": 500,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 9,
        "estimated_wait_minutes": 30,
        "load_status": "low"
    },
    {
        "id": "CTR-HR-09",
        "name": "Jind Grain Depot",
        "district": "Jind",
        "state": "Haryana",
        "address": "Safidon Road Grain Market, Jind, Haryana - 126102",
        "operating_hours": "08:30 AM – 05:30 PM (सोमवार से शनिवार)",
        "commodity": "Wheat (Grade A)",
        "accepted_crops": json.dumps(["Wheat (Grade A)", "Paddy (Common)", "Mustard"]),
        "facilities": json.dumps(["डिजिटल टोकन", "वेईब्रिज", "किसान प्रतीक्षालय", "नमी मापक उपकरण"]),
        "daily_capacity_mt": 600,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 20,
        "estimated_wait_minutes": 60,
        "load_status": "medium"
    },
    {
        "id": "CTR-HR-10",
        "name": "Rewari Krishi Mandi Center",
        "district": "Rewari",
        "state": "Haryana",
        "address": "Bawal Road Anaj Mandi, Rewari, Haryana - 123401",
        "operating_hours": "09:00 AM – 05:00 PM (सोमवार से शनिवार)",
        "commodity": "Mustard",
        "accepted_crops": json.dumps(["Mustard", "Bajra", "Wheat (Grade A)"]),
        "facilities": json.dumps(["डिजिटल टोकन", "सरसों ऑयल कंटेंट टेस्टिंग", "वेईब्रिज", "किसान शेड"]),
        "daily_capacity_mt": 520,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 7,
        "estimated_wait_minutes": 20,
        "load_status": "low"
    },
    {
        "id": "CTR-HR-11",
        "name": "Sirsa Agro Yard",
        "district": "Sirsa",
        "state": "Haryana",
        "address": "Barnala Road New Anaj Mandi, Sirsa, Haryana - 125055",
        "operating_hours": "08:30 AM – 06:00 PM (सोमवार से शनिवार)",
        "commodity": "Cotton",
        "accepted_crops": json.dumps(["Cotton", "Wheat (Grade A)", "Paddy (Common)", "Gram"]),
        "facilities": json.dumps(["डिजिटल टोकन", "मल्टी-लेन वेईब्रिज", "कपास परीक्षण प्रयोगशाला", "किसान लॉज"]),
        "daily_capacity_mt": 850,
        "slot_duration": "45 मिनट",
        "current_queue_vehicles": 30,
        "estimated_wait_minutes": 85,
        "load_status": "medium"
    },
    {
        "id": "CTR-HR-12",
        "name": "Kaithal Grain Market",
        "district": "Kaithal",
        "state": "Haryana",
        "address": "Dhand Road Mandi Complex, Kaithal, Haryana - 136027",
        "operating_hours": "09:00 AM – 05:30 PM (सोमवार से शनिवार)",
        "commodity": "Paddy (Common)",
        "accepted_crops": json.dumps(["Paddy (Common)", "Wheat (Grade A)"]),
        "facilities": json.dumps(["डिजिटल टोकन", "इलेक्ट्रॉनिक वेईब्रिज", "धान गुणवत्ता लैब"]),
        "daily_capacity_mt": 750,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 16,
        "estimated_wait_minutes": 45,
        "load_status": "low"
    },
    {
        "id": "CTR-HR-13",
        "name": "Kurukshetra Procurement Center",
        "district": "Kurukshetra",
        "state": "Haryana",
        "address": "Pipli Road Grain Market, Kurukshetra, Haryana - 136118",
        "operating_hours": "09:00 AM – 05:00 PM (सोमवार से शनिवार)",
        "commodity": "Wheat (Grade A)",
        "accepted_crops": json.dumps(["Wheat (Grade A)", "Paddy (Common)", "Maize"]),
        "facilities": json.dumps(["डिजिटल टोकन", "वेईब्रिज", "किसान विश्राम गृह", "हेल्पडेस्क"]),
        "daily_capacity_mt": 620,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 11,
        "estimated_wait_minutes": 35,
        "load_status": "low"
    },
    {
        "id": "CTR-HR-14",
        "name": "Fatehabad Mandi Depot",
        "district": "Fatehabad",
        "state": "Haryana",
        "address": "GT Road Mandi Yard, Fatehabad, Haryana - 125050",
        "operating_hours": "09:00 AM – 05:30 PM (सोमवार से शनिवार)",
        "commodity": "Wheat (Grade A)",
        "accepted_crops": json.dumps(["Wheat (Grade A)", "Cotton", "Paddy (Common)"]),
        "facilities": json.dumps(["डिजिटल टोकन", "इलेक्ट्रॉनिक कांटा", "ऑपरेटर डेस्क", "पेयजल सुविधा"]),
        "daily_capacity_mt": 580,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 14,
        "estimated_wait_minutes": 40,
        "load_status": "low"
    },
    {
        "id": "CTR-MP-04",
        "name": "Indore Regional Procurement Center",
        "district": "Indore",
        "state": "Madhya Pradesh",
        "address": "Laxmibai Nagar Mandi Yard, Indore, Madhya Pradesh - 452006",
        "operating_hours": "09:00 AM – 06:00 PM (सोमवार से शनिवार)",
        "commodity": "Soybean",
        "accepted_crops": json.dumps(["Soybean", "Wheat (Grade A)", "Gram"]),
        "facilities": json.dumps(["डिजिटल टोकन", "ऑटोमेटेड वेईब्रिज", "किसान विश्राम गृह", "सॉइल व मॉइस्चर टेस्टिंग"]),
        "daily_capacity_mt": 800,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 48,
        "estimated_wait_minutes": 140,
        "load_status": "high"
    },
    {
        "id": "CTR-PB-01",
        "name": "Patiala Focal Point Depot",
        "district": "Patiala",
        "state": "Punjab",
        "address": "Sirhind Road Focal Point, Patiala, Punjab - 147004",
        "operating_hours": "08:00 AM – 06:00 PM (सोमवार से शनिवार)",
        "commodity": "Paddy (Common)",
        "accepted_crops": json.dumps(["Paddy (Common)", "Wheat (Grade A)"]),
        "facilities": json.dumps(["डिजिटल टोकन", "डबल वेईब्रिज", "विश्राम केंद्र", "हेल्पडेस्क"]),
        "daily_capacity_mt": 900,
        "slot_duration": "60 मिनट",
        "current_queue_vehicles": 35,
        "estimated_wait_minutes": 95,
        "load_status": "medium"
    }
]

DEFAULT_COMMODITIES = [
    {
        "id": "COMM-WHEAT-A",
        "name": "Wheat (Grade A)",
        "name_english": "Wheat",
        "hindi_name": "गेहूं (ग्रेड ए)",
        "category": "Cereal (रबी अनाज)",
        "season": "Rabi (रबी)",
        "unit": "QTL",
        "demo_rate": 2425.0,
        "msp_per_quintal": 2275.0,
        "moisture_max_percent": 12.0
    },
    {
        "id": "COMM-PADDY-COMM",
        "name": "Paddy (Common)",
        "name_english": "Paddy",
        "hindi_name": "धान (सामान्य)",
        "category": "Cereal (खरीफ अनाज)",
        "season": "Kharif (खरीफ)",
        "unit": "QTL",
        "demo_rate": 2320.0,
        "msp_per_quintal": 2183.0,
        "moisture_max_percent": 17.0
    },
    {
        "id": "COMM-MUSTARD",
        "name": "Mustard",
        "name_english": "Mustard",
        "hindi_name": "सरसों",
        "category": "Oilseed (तिलहन)",
        "season": "Rabi (रबी)",
        "unit": "QTL",
        "demo_rate": 5650.0,
        "msp_per_quintal": 5650.0,
        "moisture_max_percent": 9.0
    },
    {
        "id": "COMM-BAJRA",
        "name": "Bajra",
        "name_english": "Bajra",
        "hindi_name": "बाजरा",
        "category": "Coarse Grain (मोटा अनाज)",
        "season": "Kharif (खरीफ)",
        "unit": "QTL",
        "demo_rate": 2625.0,
        "msp_per_quintal": 2500.0,
        "moisture_max_percent": 12.0
    },
    {
        "id": "COMM-COTTON",
        "name": "Cotton",
        "name_english": "Cotton",
        "hindi_name": "कपास",
        "category": "Fiber (नकदी फसल)",
        "season": "Kharif (खरीफ)",
        "unit": "QTL",
        "demo_rate": 7122.0,
        "msp_per_quintal": 6620.0,
        "moisture_max_percent": 8.5
    },
    {
        "id": "COMM-MAIZE",
        "name": "Maize",
        "name_english": "Maize",
        "hindi_name": "मक्का",
        "category": "Cereal (मोटा अनाज)",
        "season": "Kharif (खरीफ)",
        "unit": "QTL",
        "demo_rate": 2225.0,
        "msp_per_quintal": 2090.0,
        "moisture_max_percent": 14.0
    },
    {
        "id": "COMM-BARLEY",
        "name": "Barley",
        "name_english": "Barley",
        "hindi_name": "जौ",
        "category": "Cereal (रबी अनाज)",
        "season": "Rabi (रबी)",
        "unit": "QTL",
        "demo_rate": 1980.0,
        "msp_per_quintal": 1850.0,
        "moisture_max_percent": 12.0
    },
    {
        "id": "COMM-GRAM",
        "name": "Gram",
        "name_english": "Gram",
        "hindi_name": "चना",
        "category": "Pulse (दलहन)",
        "season": "Rabi (रबी)",
        "unit": "QTL",
        "demo_rate": 5440.0,
        "msp_per_quintal": 5440.0,
        "moisture_max_percent": 10.0
    },
    {
        "id": "COMM-SOYBEAN",
        "name": "Soybean",
        "name_english": "Soybean",
        "hindi_name": "सोयाबीन",
        "category": "Oilseed (तिलहन)",
        "season": "Kharif (खरीफ)",
        "unit": "QTL",
        "demo_rate": 4892.0,
        "msp_per_quintal": 4892.0,
        "moisture_max_percent": 12.0
    }
]

DEFAULT_USERS = [
    {
        "id": "USR-FARMER-01",
        "name": "Demo Farmer",
        "email": "farmer@demo.com",
        "password": "Farmer@123",
        "role": "farmer",
        "phone": "+91 98765 43210",
        "state": "Haryana",
        "district": "Karnal",
        "village": "Kachhwa",
        "land_area": 5.5,
        "crop": "Wheat (Grade A)",
        "bank_name": "State Bank of India",
        "account_number": "XXXXXX4512",
        "ifsc": "SBIN0001234"
    },
    {
        "id": "USR-OPERATOR-01",
        "name": "Karnal Desk Operator",
        "email": "operator@demo.com",
        "password": "Operator@123",
        "role": "operator",
        "phone": "+91 98120 11223",
        "center_id": "CTR-HR-01",
        "center_name": "Karnal Central Procurement Center",
        "district": "Karnal",
        "state": "Haryana"
    },
    {
        "id": "USR-OPERATOR-02",
        "name": "Ambala Desk Operator",
        "email": "operator.ambala@demo.com",
        "password": "Operator@123",
        "role": "operator",
        "phone": "+91 98120 22334",
        "center_id": "CTR-HR-02",
        "center_name": "Ambala Grain Market Center",
        "district": "Ambala",
        "state": "Haryana"
    },
    {
        "id": "USR-OPERATOR-03",
        "name": "Rohtak Desk Operator",
        "email": "operator.rohtak@demo.com",
        "password": "Operator@123",
        "role": "operator",
        "phone": "+91 98120 33445",
        "center_id": "CTR-HR-03",
        "center_name": "Rohtak Central Procurement Center",
        "district": "Rohtak",
        "state": "Haryana"
    },
    {
        "id": "USR-OPERATOR-04",
        "name": "Jhajjar Desk Operator",
        "email": "operator.jhajjar@demo.com",
        "password": "Operator@123",
        "role": "operator",
        "phone": "+91 98120 44556",
        "center_id": "CTR-HR-04",
        "center_name": "Jhajjar Anaj Mandi Center",
        "district": "Jhajjar",
        "state": "Haryana"
    },
    {
        "id": "USR-OPERATOR-05",
        "name": "Sonipat Desk Operator",
        "email": "operator.sonipat@demo.com",
        "password": "Operator@123",
        "role": "operator",
        "phone": "+91 98120 55667",
        "center_id": "CTR-HR-05",
        "center_name": "Sonipat Grain Yard Center",
        "district": "Sonipat",
        "state": "Haryana"
    },
    {
        "id": "USR-OPERATOR-06",
        "name": "Panipat Desk Operator",
        "email": "operator.panipat@demo.com",
        "password": "Operator@123",
        "role": "operator",
        "phone": "+91 98120 66778",
        "center_id": "CTR-HR-06",
        "center_name": "Panipat Agro Intake Terminal",
        "district": "Panipat",
        "state": "Haryana"
    },
    {
        "id": "USR-OPERATOR-07",
        "name": "Hisar Desk Operator",
        "email": "operator.hisar@demo.com",
        "password": "Operator@123",
        "role": "operator",
        "phone": "+91 98120 77889",
        "center_id": "CTR-HR-07",
        "center_name": "Hisar Mandi Hub",
        "district": "Hisar",
        "state": "Haryana"
    },
    {
        "id": "USR-ADMIN-01",
        "name": "Karnal District Admin",
        "email": "admin@demo.com",
        "password": "Admin@123",
        "role": "district_admin",
        "phone": "+91 98130 99887",
        "district": "Karnal",
        "state": "Haryana"
    },
    {
        "id": "USR-ADMIN-02",
        "name": "Ambala District Admin",
        "email": "admin.ambala@demo.com",
        "password": "Admin@123",
        "role": "district_admin",
        "phone": "+91 98130 11223",
        "district": "Ambala",
        "state": "Haryana"
    },
    {
        "id": "USR-ADMIN-03",
        "name": "Rohtak District Admin",
        "email": "admin.rohtak@demo.com",
        "password": "Admin@123",
        "role": "district_admin",
        "phone": "+91 98130 22334",
        "district": "Rohtak",
        "state": "Haryana"
    },
    {
        "id": "USR-ADMIN-04",
        "name": "Jhajjar District Admin",
        "email": "admin.jhajjar@demo.com",
        "password": "Admin@123",
        "role": "district_admin",
        "phone": "+91 98130 33445",
        "district": "Jhajjar",
        "state": "Haryana"
    },
    {
        "id": "USR-ADMIN-05",
        "name": "Sonipat District Admin",
        "email": "admin.sonipat@demo.com",
        "password": "Admin@123",
        "role": "district_admin",
        "phone": "+91 98130 44556",
        "district": "Sonipat",
        "state": "Haryana"
    },
    {
        "id": "USR-ADMIN-06",
        "name": "Panipat District Admin",
        "email": "admin.panipat@demo.com",
        "password": "Admin@123",
        "role": "district_admin",
        "phone": "+91 98130 55667",
        "district": "Panipat",
        "state": "Haryana"
    },
    {
        "id": "USR-ADMIN-07",
        "name": "Hisar District Admin",
        "email": "admin.hisar@demo.com",
        "password": "Admin@123",
        "role": "district_admin",
        "phone": "+91 98130 66778",
        "district": "Hisar",
        "state": "Haryana"
    },
    {
        "id": "USR-SUPERADMIN-01",
        "name": "Demo Super Admin",
        "email": "superadmin@demo.com",
        "password": "Super@123",
        "role": "super_admin",
        "phone": "+91 99999 00000",
        "district": "State Oversight",
        "state": "National"
    }
]

DEFAULT_QUEUE_ENTRIES = [
    {
        "booking_id": "KS-BOOK-1011",
        "token_id": "KS-TKN-1011",
        "center_id": "CTR-HR-01",
        "farmer_name": "Ramesh Kumar",
        "phone": "98120 45678",
        "commodity": "Wheat (Grade A)",
        "time_slot": "09:00 AM – 10:00 AM",
        "queue_position": 3,
        "total_vehicles_ahead": 2,
        "estimated_wait_minutes": 15,
        "arrival_status": "checked_in",
        "status": "कतार में प्रतीक्षा (Waiting in Queue)"
    },
    {
        "booking_id": "KS-BOOK-1022",
        "token_id": "KS-TKN-1022",
        "center_id": "CTR-HR-01",
        "farmer_name": "Gurpreet Singh",
        "phone": "98721 88990",
        "commodity": "Paddy (Common)",
        "time_slot": "09:00 AM – 10:00 AM",
        "queue_position": 1,
        "total_vehicles_ahead": 0,
        "estimated_wait_minutes": 5,
        "arrival_status": "checked_in",
        "status": "आपकी बारी जल्द है (Your Turn Is Next)"
    },
    {
        "booking_id": "KS-BOOK-1033",
        "token_id": "KS-TKN-1033",
        "center_id": "CTR-HR-01",
        "farmer_name": "Sukhwinder Kaur",
        "phone": "94160 33445",
        "commodity": "Wheat (Grade A)",
        "time_slot": "10:00 AM – 11:00 AM",
        "queue_position": 7,
        "total_vehicles_ahead": 6,
        "estimated_wait_minutes": 30,
        "arrival_status": "arrived",
        "status": "केंद्र पर पहुंच गए (Arrived at Center)"
    },
    {
        "booking_id": "KS-BOOK-1005",
        "token_id": "KS-TKN-1005",
        "center_id": "CTR-HR-01",
        "farmer_name": "Baldev Raj",
        "phone": "98960 11223",
        "commodity": "Wheat (Grade A)",
        "time_slot": "08:00 AM – 09:00 AM",
        "queue_position": 0,
        "total_vehicles_ahead": 0,
        "estimated_wait_minutes": 0,
        "arrival_status": "checked_in",
        "status": "खरीद पूर्ण (Procurement Completed)"
    }
]

DEFAULT_BOOKINGS = [
    {
        "id": "KS-BOOK-1011",
        "token_id": "KS-TKN-1011",
        "farmer_id": "USR-FARMER-01",
        "farmer_name": "Ramesh Kumar",
        "farmer_phone": "98120 45678",
        "center_id": "CTR-HR-01",
        "center_name": "Karnal Central Procurement Center",
        "district": "Karnal",
        "commodity": "Wheat (Grade A)",
        "booking_date": "Today (आज)",
        "time_slot": "09:00 AM – 10:00 AM",
        "quantity_qtl": 45.0,
        "vehicle_number": "HR-05-AB-1011",
        "status": "CHECKED_IN",
        "arrival_status": "checked_in",
        "queue_position": 3
    },
    {
        "id": "KS-BOOK-1022",
        "token_id": "KS-TKN-1022",
        "farmer_id": "USR-FARMER-01",
        "farmer_name": "Gurpreet Singh",
        "farmer_phone": "98721 88990",
        "center_id": "CTR-HR-01",
        "center_name": "Karnal Central Procurement Center",
        "district": "Karnal",
        "commodity": "Paddy (Common)",
        "booking_date": "Today (आज)",
        "time_slot": "09:00 AM – 10:00 AM",
        "quantity_qtl": 50.0,
        "vehicle_number": "HR-05-BC-1022",
        "status": "CHECKED_IN",
        "arrival_status": "checked_in",
        "queue_position": 1
    },
    {
        "id": "KS-BOOK-1005",
        "token_id": "KS-TKN-1005",
        "farmer_id": "USR-FARMER-01",
        "farmer_name": "Baldev Raj",
        "farmer_phone": "98960 11223",
        "center_id": "CTR-HR-01",
        "center_name": "Karnal Central Procurement Center",
        "district": "Karnal",
        "commodity": "Wheat (Grade A)",
        "booking_date": "Today (आज)",
        "time_slot": "08:00 AM – 09:00 AM",
        "quantity_qtl": 58.20,
        "vehicle_number": "HR-05-CD-1005",
        "status": "COMPLETED",
        "arrival_status": "checked_in",
        "queue_position": 0
    }
]

DEFAULT_RECEIPTS = [
    {
        "id": "KSP-RCP-1005",
        "booking_id": "KS-BOOK-1005",
        "token_id": "KS-TKN-1005",
        "farmer_name": "Baldev Raj",
        "farmer_phone": "98960 11223",
        "center_id": "CTR-HR-01",
        "center_name": "Karnal Central Procurement Center",
        "district": "Karnal",
        "commodity": "Wheat (Grade A)",
        "date": "Today (आज)",
        "gross_weight": 63.90,
        "tare_weight": 5.70,
        "net_weight": 58.20,
        "moisture_percent": 10.4,
        "rate_per_qtl": 2425.0,
        "total_amount": 141135.0,
        "payment_status": "PAID"
    }
]

DEFAULT_COMPLAINTS = [
    {
        "id": "CMP-2026-001",
        "complainant_name": "Jagjit Singh",
        "complainant_phone": "98120 77665",
        "category": "WEIGHMENT_ISSUE",
        "subject": "वेईब्रिज तौल में असंगति",
        "description": "कांटा नंबर 2 पर तौल में पिछले बैच से लगभग 2 क्विंटल का अंतर आ रहा है। कृपया पुनः कैलिब्रेट करें।",
        "center_id": "CTR-HR-01",
        "center_name": "Karnal Central Procurement Center",
        "booking_id": "KS-BOOK-1005",
        "level": "OPERATOR",
        "priority": "HIGH",
        "status": "IN_PROGRESS",
        "resolution_notes": "ऑपरेटर द्वारा इलेक्ट्रॉनिक कांटे की जांच की जा रही है।"
    },
    {
        "id": "CMP-2026-002",
        "complainant_name": "Sukhwinder Kaur",
        "complainant_phone": "94160 33445",
        "category": "QUEUE_ISSUE",
        "subject": "प्रतीक्षा समय लंबा",
        "description": "गेट सत्यापन के बाद भी यार्ड में वाहनों की गति धीमी है। अतिरिक्त लेन चालू करने का अनुरोध।",
        "center_id": "CTR-HR-01",
        "center_name": "Karnal Central Procurement Center",
        "booking_id": "KS-BOOK-1033",
        "level": "DISTRICT_ADMIN",
        "priority": "MEDIUM",
        "status": "OPEN",
        "resolution_notes": ""
    }
]

DEFAULT_SOIL_TESTS = [
    {
        "id": "ST-2026-1001",
        "sample_id": "SMP-HR-7821",
        "farmer_id": "USR-FARMER-01",
        "farmer_name": "Demo Farmer",
        "farmer_phone": "9876543210",
        "district": "Karnal",
        "state": "Haryana",
        "village": "Kachhwa",
        "center_id": "CTR-HR-01",
        "center_name": "Karnal Central Procurement Center",
        "booking_date": "2026-03-10",
        "time_slot": "10:00 AM – 11:00 AM",
        "crop_planned": "Wheat (Grade A)",
        "land_area_acres": 5.5,
        "soil_type": "Alluvial Loam (दोमट मिट्टी)",
        "status": "COMPLETED",
        "ph_level": 7.2,
        "ec_level": 0.42,
        "organic_carbon_percent": 0.54,
        "nitrogen_kg_ha": 245.0,
        "phosphorus_kg_ha": 17.2,
        "potassium_kg_ha": 215.0,
        "zinc_ppm": 0.54,
        "sulphur_ppm": 8.5,
        "health_status": "MODERATE",
        "advisory_notes": "मृदा स्वास्थ्य मध्यम है। फास्फोरस व पोटाश पर्याप्त है। जिंक और नाइट्रोजन की अनुशंसित खुराक अवश्य डालें।",
        "created_at": datetime.datetime.utcnow(),
        "tested_at": datetime.datetime.utcnow()
    },
    {
        "id": "ST-2026-1002",
        "sample_id": "SMP-HR-7822",
        "farmer_id": "USR-FARMER-02",
        "farmer_name": "Ramesh Kumar",
        "farmer_phone": "9812045678",
        "district": "Karnal",
        "state": "Haryana",
        "village": "Taraori",
        "center_id": "CTR-HR-01",
        "center_name": "Karnal Central Procurement Center",
        "booking_date": "2026-03-12",
        "time_slot": "11:00 AM – 12:00 PM",
        "crop_planned": "Mustard",
        "land_area_acres": 4.0,
        "soil_type": "Sandy Loam (बलुई दोमट)",
        "status": "IN_TESTING",
        "ph_level": 7.4,
        "ec_level": 0.38,
        "organic_carbon_percent": 0.48,
        "nitrogen_kg_ha": 220.0,
        "phosphorus_kg_ha": 14.0,
        "potassium_kg_ha": 190.0,
        "zinc_ppm": 0.48,
        "sulphur_ppm": 6.8,
        "health_status": "TESTING_IN_LAB",
        "advisory_notes": "नमूना जांच प्रयोगशाला में प्रक्रियाधीन है।",
        "created_at": datetime.datetime.utcnow(),
        "tested_at": datetime.datetime.utcnow()
    }
]

def seed_all():
    init_db()
    db: Session = SessionLocal()
    try:
        # Seed Centers if empty
        if db.query(Center).count() == 0:
            for c in DEFAULT_CENTERS:
                db.add(Center(**c))
            print(f"[Seed] Added {len(DEFAULT_CENTERS)} procurement centers.")

        # Seed Commodities if empty
        if db.query(Commodity).count() == 0:
            for com in DEFAULT_COMMODITIES:
                db.add(Commodity(**com))
            print(f"[Seed] Added {len(DEFAULT_COMMODITIES)} commodities.")

        # Seed or sync Users
        existing_user_ids = {u.id for u in db.query(User.id).all()}
        existing_emails = {u.email.lower() for u in db.query(User.email).all()}
        added_users = 0
        for u in DEFAULT_USERS:
            if u["id"] not in existing_user_ids and u["email"].lower() not in existing_emails:
                db.add(User(**u))
                existing_user_ids.add(u["id"])
                existing_emails.add(u["email"].lower())
                added_users += 1
        if added_users > 0:
            print(f"[Seed] Added {added_users} new demo users.")

        # Seed Queue Entries if empty
        if db.query(QueueEntry).count() == 0:
            for q in DEFAULT_QUEUE_ENTRIES:
                db.add(QueueEntry(**q))
            print(f"[Seed] Added {len(DEFAULT_QUEUE_ENTRIES)} queue entries.")

        # Seed Bookings if empty
        if db.query(Booking).count() == 0:
            for b in DEFAULT_BOOKINGS:
                db.add(Booking(**b))
            print(f"[Seed] Added {len(DEFAULT_BOOKINGS)} bookings.")

        # Seed Receipts if empty
        if db.query(ProcurementRecord).count() == 0:
            for r in DEFAULT_RECEIPTS:
                db.add(ProcurementRecord(**r))
            print(f"[Seed] Added {len(DEFAULT_RECEIPTS)} procurement receipts.")

        # Seed Complaints if empty
        if db.query(Complaint).count() == 0:
            for cmp in DEFAULT_COMPLAINTS:
                db.add(Complaint(**cmp))
            print(f"[Seed] Added {len(DEFAULT_COMPLAINTS)} complaints.")

        # Seed Soil Test Records if empty
        if db.query(SoilTestRecord).count() == 0:
            for st in DEFAULT_SOIL_TESTS:
                db.add(SoilTestRecord(**st))
            print(f"[Seed] Added {len(DEFAULT_SOIL_TESTS)} soil test records.")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Seed Error]: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()

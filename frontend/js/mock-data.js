/**
 * KisanSetu — Minimal Mock Data Structure
 * Provides realistic structural blueprints for development before FastAPI integration.
 */

const MOCK_CENTERS = [
  {
    id: "CTR-HR-01",
    name: "Karnal Central Procurement Center",
    district: "Karnal",
    state: "Haryana",
    address: "Near New Anaj Mandi, GT Road, Karnal, Haryana - 132001",
    operatingHours: "09:00 AM – 05:00 PM (सोमवार से शनिवार)",
    commodity: "Wheat (Grade A)",
    commodities: ["Wheat (Grade A)", "Paddy (Common)", "Mustard"],
    facilities: ["डिजिटल टोकन", "इलेक्ट्रॉनिक वेईब्रिज", "किसान प्रतीक्षालय", "नमी मापक लैब", "ऑपरेटर सहायता"],
    dailyCapacityMT: 500,
    dailyCapacity: "500 MT / दिन",
    slotDuration: "60 मिनट",
    currentQueueVehicles: 12,
    estimatedWaitMinutes: 45,
    loadStatus: "low" // 'low' | 'medium' | 'high'
  },
  {
    id: "CTR-HR-02",
    name: "Ambala Grain Market Center",
    district: "Ambala",
    state: "Haryana",
    address: "Kalka Chowk Mandi Complex, Ambala City, Haryana - 134003",
    operatingHours: "08:30 AM – 05:30 PM (सोमवार से शनिवार)",
    commodity: "Paddy (Common)",
    commodities: ["Paddy (Common)", "Wheat (Grade A)"],
    facilities: ["डिजिटल टोकन", "वेईब्रिज लेन 1 & 2", "किसान शेड", "ऑपरेटर डेस्क"],
    dailyCapacityMT: 600,
    dailyCapacity: "600 MT / दिन",
    slotDuration: "60 मिनट",
    currentQueueVehicles: 28,
    estimatedWaitMinutes: 80,
    loadStatus: "medium"
  },
  {
    id: "CTR-MP-04",
    name: "Indore Regional Procurement Center",
    district: "Indore",
    state: "Madhya Pradesh",
    address: "Laxmibai Nagar Mandi Yard, Indore, Madhya Pradesh - 452006",
    operatingHours: "09:00 AM – 06:00 PM (सोमवार से शनिवार)",
    commodity: "Soybean",
    commodities: ["Soybean", "Wheat (Grade A)", "Gram (Chana)"],
    facilities: ["डिजिटल टोकन", "ऑटोमेटेड वेईब्रिज", "किसान विश्राम गृह", "सॉइल व मॉइस्चर टेस्टिंग"],
    dailyCapacityMT: 800,
    dailyCapacity: "800 MT / दिन",
    slotDuration: "60 मिनट",
    currentQueueVehicles: 48,
    estimatedWaitMinutes: 140,
    loadStatus: "high"
  },
  {
    id: "CTR-MP-02",
    name: "Bhopal Krishi Mandi Hub",
    district: "Bhopal",
    state: "Madhya Pradesh",
    address: "Karond Mandi By-Pass, Bhopal, Madhya Pradesh - 462038",
    operatingHours: "09:00 AM – 05:00 PM (सोमवार से शनिवार)",
    commodity: "Wheat (Grade A)",
    commodities: ["Wheat (Grade A)", "Soybean", "Maize"],
    facilities: ["डिजिटल टोकन", "इलेक्ट्रॉनिक कांटा", "ऑपरेटर काउंटर", "किसान सहायता केंद्र"],
    dailyCapacityMT: 750,
    dailyCapacity: "750 MT / दिन",
    slotDuration: "60 मिनट",
    currentQueueVehicles: 16,
    estimatedWaitMinutes: 50,
    loadStatus: "low"
  },
  {
    id: "CTR-PB-01",
    name: "Patiala Focal Point Depot",
    district: "Patiala",
    state: "Punjab",
    address: "Sirhind Road Focal Point, Patiala, Punjab - 147004",
    operatingHours: "08:00 AM – 06:00 PM (सोमवार से शनिवार)",
    commodity: "Paddy (Common)",
    commodities: ["Paddy (Common)", "Wheat (Grade A)"],
    facilities: ["डिजिटल टोकन", "डबल वेईब्रिज", "विश्राम केंद्र", "हेल्पडेस्क"],
    dailyCapacityMT: 900,
    dailyCapacity: "900 MT / दिन",
    slotDuration: "60 मिनट",
    currentQueueVehicles: 35,
    estimatedWaitMinutes: 95,
    loadStatus: "medium"
  }
];

const MOCK_COMMODITIES = [
  {
    id: "COMM-WHEAT-A",
    name: "Wheat (Grade A)",
    hindiName: "गेहूं (ग्रेड ए)",
    mspPerQuintal: 2275, // in INR (₹)
    moistureMaxPercent: 12.0
  },
  {
    id: "COMM-PADDY-COMM",
    name: "Paddy (Common)",
    hindiName: "धान (सामान्य)",
    mspPerQuintal: 2183,
    moistureMaxPercent: 17.0
  },
  {
    id: "COMM-SOYBEAN",
    name: "Soybean",
    hindiName: "सोयाबीन",
    mspPerQuintal: 4892,
    moistureMaxPercent: 12.0
  }
];

const MOCK_SAMPLE_TOKEN = {
  tokenId: "KS-2026-HR01-0842",
  farmerName: "Rameshwar Singh",
  farmerPhone: "XXXXXX4512",
  centerId: "CTR-HR-01",
  commodityId: "COMM-WHEAT-A",
  scheduledDate: "2026-09-05",
  timeSlot: "10:00 AM - 11:30 AM",
  approximateWeightQuintals: 40,
  vehicleNumber: "HR-05-AB-1234",
  status: "CONFIRMED" // 'CONFIRMED' | 'IN_QUEUE' | 'WEIGHED' | 'COMPLETED' | 'CANCELLED'
};

// Export to window for vanilla JS browser usage
if (typeof window !== "undefined") {
  window.MOCK_CENTERS = MOCK_CENTERS;
  window.MOCK_COMMODITIES = MOCK_COMMODITIES;
  window.MOCK_SAMPLE_TOKEN = MOCK_SAMPLE_TOKEN;
  window.KisanMockData = {
    MOCK_CENTERS,
    MOCK_COMMODITIES,
    MOCK_SAMPLE_TOKEN
  };
}


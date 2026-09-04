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
    commodity: "Wheat (Gehun)",
    dailyCapacityMT: 500,
    currentQueueVehicles: 12,
    estimatedWaitMinutes: 45,
    loadStatus: "low" // 'low' | 'medium' | 'high'
  },
  {
    id: "CTR-MP-04",
    name: "Indore Regional Procurement Center",
    district: "Indore",
    state: "Madhya Pradesh",
    commodity: "Soybean",
    dailyCapacityMT: 800,
    currentQueueVehicles: 48,
    estimatedWaitMinutes: 140,
    loadStatus: "high"
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
  window.KisanMockData = {
    MOCK_CENTERS,
    MOCK_COMMODITIES,
    MOCK_SAMPLE_TOKEN
  };
}


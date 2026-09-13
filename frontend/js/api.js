/**
 * KisanSetu — Client-Side API Client
 * Seamlessly interfaces with the FastAPI REST backend (/api/v1)
 * with graceful fallback to client-side data structures.
 */

const API_CONFIG = {
  BASE_URL: "/api/v1",
  TIMEOUT_MS: 5000
};

async function _fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP Error ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

const KisanAPI = {
  /**
   * Fetch list of procurement centers from FastAPI
   */
  async getProcurementCenters(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.district) queryParams.append("district", filters.district);
      if (filters.commodity) queryParams.append("commodity", filters.commodity);
      if (filters.loadStatus) queryParams.append("load_status", filters.loadStatus);
      if (filters.q) queryParams.append("q", filters.q);

      const url = `${API_CONFIG.BASE_URL}/centers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const res = await _fetchWithTimeout(url);
      return res;
    } catch (err) {
      console.warn("KisanAPI: getProcurementCenters fallback to mock:", err.message);
      const mockData = window.KisanMockData ? window.KisanMockData.MOCK_CENTERS : (window.MOCK_CENTERS || []);
      return { success: true, data: mockData };
    }
  },

  /**
   * Fetch center details by ID
   */
  async getCenterDetails(centerId) {
    try {
      return await _fetchWithTimeout(`${API_CONFIG.BASE_URL}/centers/${encodeURIComponent(centerId)}`);
    } catch (err) {
      console.warn("KisanAPI: getCenterDetails fallback:", err.message);
      const centers = window.MOCK_CENTERS || [];
      const found = centers.find(c => c.id === centerId || c.centerId === centerId);
      return { success: !!found, data: found };
    }
  },

  /**
   * Fetch list of active MSP commodities
   */
  async getCommodities() {
    try {
      return await _fetchWithTimeout(`${API_CONFIG.BASE_URL}/commodities`);
    } catch (err) {
      console.warn("KisanAPI: getCommodities fallback to mock:", err.message);
      const mockData = window.KisanMockData ? window.KisanMockData.MOCK_COMMODITIES : (window.MOCK_COMMODITIES || []);
      return { success: true, data: mockData };
    }
  },

  /**
   * Retrieve live status and queue information for a specific farmer token
   */
  async getTokenStatus(tokenId) {
    try {
      return await _fetchWithTimeout(`${API_CONFIG.BASE_URL}/tokens/${encodeURIComponent(tokenId)}`);
    } catch (err) {
      console.warn("KisanAPI: getTokenStatus fallback to mock:", err.message);
      const sample = window.KisanMockData ? window.KisanMockData.MOCK_SAMPLE_TOKEN : (window.MOCK_SAMPLE_TOKEN || null);
      return { success: true, data: sample };
    }
  },

  /**
   * Book a procurement slot and create a Digital Token
   */
  async createBooking(bookingData) {
    try {
      return await _fetchWithTimeout(`${API_CONFIG.BASE_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      });
    } catch (err) {
      console.warn("KisanAPI: createBooking error:", err.message);
      throw err;
    }
  },

  /**
   * Retrieve live queue entries for a center
   */
  async getQueue(centerId) {
    try {
      return await _fetchWithTimeout(`${API_CONFIG.BASE_URL}/queue/${encodeURIComponent(centerId)}`);
    } catch (err) {
      console.warn("KisanAPI: getQueue error:", err.message);
      return { success: false, data: [] };
    }
  },

  /**
   * Operator gate verification check-in
   */
  async verifyGate(bookingId) {
    return await _fetchWithTimeout(`${API_CONFIG.BASE_URL}/queue/gate-checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId })
    });
  },

  /**
   * Advance vehicle queue sequence
   */
  async advanceQueue(bookingId) {
    return await _fetchWithTimeout(`${API_CONFIG.BASE_URL}/queue/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId })
    });
  },

  /**
   * Finalize weighment and generate receipt
   */
  async completeProcurement(data) {
    return await _fetchWithTimeout(`${API_CONFIG.BASE_URL}/queue/complete-procurement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  },

  /**
   * Retrieve completed procurement receipts
   */
  async getProcurementRecords(params = {}) {
    try {
      const q = new URLSearchParams(params).toString();
      return await _fetchWithTimeout(`${API_CONFIG.BASE_URL}/procurement/records${q ? '?' + q : ''}`);
    } catch (err) {
      console.warn("KisanAPI: getProcurementRecords error:", err.message);
      return { success: false, data: [] };
    }
  },

  /**
   * Fetch district intelligence overview
   */
  async getAnalyticsOverview() {
    try {
      return await _fetchWithTimeout(`${API_CONFIG.BASE_URL}/analytics/overview`);
    } catch (err) {
      console.warn("KisanAPI: getAnalyticsOverview error:", err.message);
      return { success: false, metrics: {} };
    }
  }
};

// Export to window for browser vanilla JS usage
if (typeof window !== "undefined") {
  window.KisanAPI = KisanAPI;
}

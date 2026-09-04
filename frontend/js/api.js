/**
 * KisanSetu — API Abstraction Layer (Placeholder)
 * 
 * ARCHITECTURAL NOTE:
 * This client provides a unified Promise-based API contract for frontend views.
 * Currently, methods resolve lightweight mock data from `mock-data.js`.
 * In Phase 2 (Backend Integration), the `USE_MOCK` flag will be toggled,
 * and these methods will route directly to FastAPI REST endpoints (/api/v1/...).
 */

const API_CONFIG = {
  // FastAPI backend base URL (to be activated during backend integration phase)
  BASE_URL: "http://127.0.0.1:8000/api/v1",
  USE_MOCK: true
};

const KisanAPI = {
  /**
   * Fetch list of procurement centers.
   * Future FastAPI Route: GET /api/v1/centers
   */
  async getProcurementCenters() {
    if (API_CONFIG.USE_MOCK) {
      const mockData = window.KisanMockData ? window.KisanMockData.MOCK_CENTERS : [];
      return Promise.resolve({ success: true, data: mockData });
    }

    // Future FastAPI implementation:
    // const response = await fetch(`${API_CONFIG.BASE_URL}/centers`);
    // return await response.json();
  },

  /**
   * Fetch list of active MSP commodities and rates.
   * Future FastAPI Route: GET /api/v1/commodities
   */
  async getCommodities() {
    if (API_CONFIG.USE_MOCK) {
      const mockData = window.KisanMockData ? window.KisanMockData.MOCK_COMMODITIES : [];
      return Promise.resolve({ success: true, data: mockData });
    }

    // Future FastAPI implementation:
    // const response = await fetch(`${API_CONFIG.BASE_URL}/commodities`);
    // return await response.json();
  },

  /**
   * Retrieve live status and queue information for a specific farmer token.
   * Future FastAPI Route: GET /api/v1/tokens/{tokenId}
   */
  async getTokenStatus(tokenId) {
    if (API_CONFIG.USE_MOCK) {
      const sample = window.KisanMockData ? window.KisanMockData.MOCK_SAMPLE_TOKEN : null;
      return Promise.resolve({
        success: true,
        data: sample && sample.tokenId === tokenId ? sample : sample
      });
    }

    // Future FastAPI implementation:
    // const response = await fetch(`${API_CONFIG.BASE_URL}/tokens/${encodeURIComponent(tokenId)}`);
    // return await response.json();
  }
};

// Export to window for vanilla JS browser usage
if (typeof window !== "undefined") {
  window.KisanAPI = KisanAPI;
}


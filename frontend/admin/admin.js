/**
 * KisanSetu — District Admin Shared Oversight & Management Engine
 * Version: 2.0.0 (Phase E.2: Advanced District Admin Features)
 *
 * ARCHITECTURAL NOTICE:
 * This module strictly isolates administrative configurations and alert states
 * from canonical farmer and operator operational state:
 * - Canonical operational state (NEVER modified by Admin):
 *     kisansetu_active_booking
 *     kisansetu_bookings
 *     kisansetu_queue_status
 * - Administrative configuration state:
 *     kisansetu_center_config
 * - Administrative alerts state:
 *     kisansetu_admin_alerts
 * - Operational audit state (read-only in Admin):
 *     kisansetu_operator_activity
 */

(function () {
  const ACTIVE_BOOKING_KEY = "kisansetu_active_booking";
  const BOOKINGS_HISTORY_KEY = "kisansetu_bookings";
  const QUEUE_STATUS_KEY = "kisansetu_queue_status";

  // Administrative & Audit Storage Keys
  const CENTER_CONFIG_KEY = "kisansetu_center_config";
  const ADMIN_ALERTS_KEY = "kisansetu_admin_alerts";
  const OPERATOR_ACTIVITY_KEY = "kisansetu_operator_activity";

  // Fixed yard demo entries representing yard vehicles across centers (same baseline as operator desk)
  const YARD_DEMO_ENTRIES = [
    {
      bookingId: "KS-BOOK-1011",
      tokenId: "KS-TKN-1011",
      farmerName: "Ramesh Kumar",
      phone: "98120 45678",
      centerId: "CTR-HR-01",
      centerName: "Karnal Central Procurement Center",
      commodity: "Wheat (Grade A)",
      bookingDate: "Today (आज)",
      timeSlot: "09:00 AM – 10:00 AM",
      queuePosition: 3,
      totalVehiclesAhead: 2,
      estimatedWaitMinutes: 15,
      arrivalStatus: "checked_in",
      status: "कतार में प्रतीक्षा (Waiting in Queue)",
      grossWeight: "Demo (Pending)",
      tareWeight: "Demo (Pending)",
      netQuantity: "Demo (Pending)",
      moisture: "11.5% (Demo)",
      isDemoStatic: true
    },
    {
      bookingId: "KS-BOOK-1022",
      tokenId: "KS-TKN-1022",
      farmerName: "Gurpreet Singh",
      phone: "98721 88990",
      centerId: "CTR-HR-01",
      centerName: "Karnal Central Procurement Center",
      commodity: "Paddy (Common)",
      bookingDate: "Today (आज)",
      timeSlot: "09:00 AM – 10:00 AM",
      queuePosition: 1,
      totalVehiclesAhead: 0,
      estimatedWaitMinutes: 5,
      arrivalStatus: "checked_in",
      status: "आपकी बारी जल्द है (Your Turn Is Next)",
      grossWeight: "Demo (Pending)",
      tareWeight: "Demo (Pending)",
      netQuantity: "Demo (Pending)",
      moisture: "11.9% (Demo)",
      isDemoStatic: true
    },
    {
      bookingId: "KS-BOOK-1033",
      tokenId: "KS-TKN-1033",
      farmerName: "Sukhwinder Kaur",
      phone: "94160 33445",
      centerId: "CTR-HR-01",
      centerName: "Karnal Central Procurement Center",
      commodity: "Wheat (Grade A)",
      bookingDate: "Today (आज)",
      timeSlot: "10:00 AM – 11:00 AM",
      queuePosition: 7,
      totalVehiclesAhead: 6,
      estimatedWaitMinutes: 30,
      arrivalStatus: "arrived",
      status: "केंद्र पर पहुंच गए (Arrived at Center)",
      grossWeight: "N/A",
      tareWeight: "N/A",
      netQuantity: "N/A",
      moisture: "Pending Intake",
      isDemoStatic: true
    },
    {
      bookingId: "KS-BOOK-1005",
      tokenId: "KS-TKN-1005",
      farmerName: "Baldev Raj",
      phone: "98960 11223",
      centerId: "CTR-HR-01",
      centerName: "Karnal Central Procurement Center",
      commodity: "Wheat (Grade A)",
      bookingDate: "Today (आज)",
      timeSlot: "08:00 AM – 09:00 AM",
      queuePosition: 0,
      totalVehiclesAhead: 0,
      estimatedWaitMinutes: 0,
      arrivalStatus: "checked_in",
      status: "खरीद पूर्ण (Procurement Completed)",
      grossWeight: "6,800 kg",
      tareWeight: "2,200 kg",
      netQuantity: "46.00 Qtl",
      moisture: "11.8%",
      isDemoStatic: true
    },
    {
      bookingId: "KS-BOOK-1044",
      tokenId: "KS-TKN-1044",
      farmerName: "Harpreet Cheema",
      phone: "97290 88221",
      centerId: "CTR-HR-02",
      centerName: "Ambala Grain Market Center",
      commodity: "Paddy (Common)",
      bookingDate: "Today (आज)",
      timeSlot: "09:30 AM – 10:30 AM",
      queuePosition: 4,
      totalVehiclesAhead: 3,
      estimatedWaitMinutes: 25,
      arrivalStatus: "checked_in",
      status: "कतार में प्रतीक्षा (Waiting in Queue)",
      grossWeight: "Demo (Pending)",
      tareWeight: "Demo (Pending)",
      netQuantity: "Demo (Pending)",
      moisture: "12.0% (Demo)",
      isDemoStatic: true
    },
    {
      bookingId: "KS-BOOK-1040",
      tokenId: "KS-TKN-1040",
      farmerName: "Jaswant Gill",
      phone: "98140 77334",
      centerId: "CTR-HR-02",
      centerName: "Ambala Grain Market Center",
      commodity: "Paddy (Common)",
      bookingDate: "Today (आज)",
      timeSlot: "08:30 AM – 09:30 AM",
      queuePosition: 0,
      totalVehiclesAhead: 0,
      estimatedWaitMinutes: 0,
      arrivalStatus: "checked_in",
      status: "खरीद पूर्ण (Procurement Completed)",
      grossWeight: "7,150 kg",
      tareWeight: "2,350 kg",
      netQuantity: "48.00 Qtl",
      moisture: "11.4%",
      isDemoStatic: true
    }
  ];

  // Baseline operator activity entries for initial historical context
  const BASELINE_OPERATOR_ACTIVITIES = [
    {
      id: "ACT-HIST-001",
      action: "procurement_completed",
      bookingId: "KS-BOOK-1005",
      tokenId: "KS-TKN-1005",
      farmerName: "Baldev Raj",
      centerId: "CTR-HR-01",
      centerName: "Karnal Central Procurement Center",
      timestamp: "Today, 09:15 AM (Demo)",
      role: "operator"
    },
    {
      id: "ACT-HIST-002",
      action: "gate_verified",
      bookingId: "KS-BOOK-1011",
      tokenId: "KS-TKN-1011",
      farmerName: "Ramesh Kumar",
      centerId: "CTR-HR-01",
      centerName: "Karnal Central Procurement Center",
      timestamp: "Today, 09:30 AM (Demo)",
      role: "operator"
    },
    {
      id: "ACT-HIST-003",
      action: "queue_advanced",
      bookingId: "KS-BOOK-1022",
      tokenId: "KS-TKN-1022",
      farmerName: "Gurpreet Singh",
      centerId: "CTR-HR-01",
      centerName: "Karnal Central Procurement Center",
      timestamp: "Today, 09:45 AM (Demo)",
      role: "operator"
    },
    {
      id: "ACT-HIST-004",
      action: "procurement_completed",
      bookingId: "KS-BOOK-1040",
      tokenId: "KS-TKN-1040",
      farmerName: "Jaswant Gill",
      centerId: "CTR-HR-02",
      centerName: "Ambala Grain Market Center",
      timestamp: "Today, 09:50 AM (Demo)",
      role: "operator"
    }
  ];

  // Baseline operational alerts for initial administrative oversight
  const BASELINE_DEMO_ALERTS = [
    {
      id: "ALT-BASE-001",
      centerId: "CTR-HR-01",
      centerName: "Karnal Central Procurement Center",
      title: "Weighbridge Calibration Scheduled",
      description: "Semi-weekly inspection and calibration for gross weighbridge scale #2 is scheduled for 14:00 hrs.",
      type: "MAINTENANCE_DUE",
      severity: "LOW",
      recommendation: "Coordinate with on-site technician before peak afternoon intake shift.",
      timestamp: "Today, 08:00 AM (Demo)"
    },
    {
      id: "ALT-BASE-002",
      centerId: "CTR-HR-02",
      centerName: "Ambala Grain Market Center",
      title: "Grain Moisture Quality Variance",
      description: "Sample batch #204 measured 12.8% moisture content exceeding standard FAQ 12.0% specification.",
      type: "QUALITY_EXCEPTION",
      severity: "HIGH",
      recommendation: "Re-test sample from second trolley quadrant prior to issuing digital weighment slip.",
      timestamp: "Today, 09:10 AM (Demo)"
    },
    {
      id: "ALT-BASE-003",
      centerId: "CTR-HR-04",
      centerName: "Panipat Grain Market Yard",
      title: "Yard Staging Capacity Alert",
      description: "Over 82% of designated parking berths currently occupied by arriving tractor-trolleys.",
      type: "HIGH_LOAD",
      severity: "MEDIUM",
      recommendation: "Advise traffic marshals to stage overflow vehicles along approach service lane.",
      timestamp: "Today, 09:35 AM (Demo)"
    }
  ];

  const KisanAdmin = {
    ACTIVE_BOOKING_KEY,
    BOOKINGS_HISTORY_KEY,
    QUEUE_STATUS_KEY,
    CENTER_CONFIG_KEY,
    ADMIN_ALERTS_KEY,
    OPERATOR_ACTIVITY_KEY,

    // =========================================================
    // 1. Core Center Queries
    // =========================================================

    /**
     * Retrieve all available procurement centers from mock-data
     */
    getCenters() {
      return (
        window.MOCK_CENTERS ||
        (window.KisanMockData && window.KisanMockData.MOCK_CENTERS) ||
        []
      );
    },

    /**
     * Case-insensitive lookup of a center by ID
     * Returns null cleanly if not found
     */
    getCenterById(centerId) {
      if (!centerId) return null;
      const cleanId = String(centerId).trim().toLowerCase();
      const centers = this.getCenters();
      return centers.find(c => String(c.id).trim().toLowerCase() === cleanId) || null;
    },

    // =========================================================
    // 2. Center Configuration Management (kisansetu_center_config)
    // =========================================================

    /**
     * Defensive read of all administrative center configurations
     */
    getAllCenterConfigs() {
      try {
        const raw = localStorage.getItem(CENTER_CONFIG_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
      } catch (e) {
        console.warn("KisanAdmin: Invalid JSON in center config storage.", e);
        return {};
      }
    },

    /**
     * Retrieve configuration for a specific center with safe defaults
     */
    getCenterConfig(centerId) {
      if (!centerId) return null;
      const cleanId = String(centerId).trim().toUpperCase();
      const centerObj = this.getCenterById(centerId);
      const allConfigs = this.getAllCenterConfigs();
      const custom = allConfigs[cleanId] || {};

      const defaultCapacity = centerObj ? (centerObj.dailyCapacityMT || 500) : 500;

      return {
        centerId: cleanId,
        operationalStatus: custom.operationalStatus || "ACTIVE", // ACTIVE | PAUSED | MAINTENANCE | CLOSED
        acceptingBookings: typeof custom.acceptingBookings === 'boolean' ? custom.acceptingBookings : true,
        capacity: typeof custom.capacity === 'number' && custom.capacity > 0 ? custom.capacity : defaultCapacity,
        loadThreshold: typeof custom.loadThreshold === 'number' ? custom.loadThreshold : 80,
        lastUpdated: custom.lastUpdated || null
      };
    },

    /**
     * Update center configuration safely with property validation
     */
    updateCenterConfig(centerId, newConfig = {}) {
      if (!centerId) return { success: false, error: "Missing center ID" };
      const cleanId = String(centerId).trim().toUpperCase();
      const centerObj = this.getCenterById(centerId);
      if (!centerObj) return { success: false, error: "Center not found in directory" };

      const allConfigs = this.getAllCenterConfigs();
      const existing = this.getCenterConfig(cleanId);

      const validStatuses = ["ACTIVE", "PAUSED", "MAINTENANCE", "CLOSED"];
      let status = (newConfig.operationalStatus || existing.operationalStatus || "ACTIVE").toUpperCase();
      if (!validStatuses.includes(status)) status = "ACTIVE";

      let acceptingBookings = typeof newConfig.acceptingBookings === 'boolean'
        ? newConfig.acceptingBookings
        : existing.acceptingBookings;

      // If center is CLOSED, MAINTENANCE, or PAUSED, automatically force acceptingBookings to false
      if (status === "CLOSED" || status === "MAINTENANCE" || status === "PAUSED") {
        acceptingBookings = false;
      }

      let capacity = typeof newConfig.capacity === 'number' && newConfig.capacity > 0
        ? newConfig.capacity
        : (parseInt(newConfig.capacity, 10) > 0 ? parseInt(newConfig.capacity, 10) : existing.capacity);

      let loadThreshold = typeof newConfig.loadThreshold === 'number' && newConfig.loadThreshold > 0
        ? newConfig.loadThreshold
        : existing.loadThreshold;

      const updated = {
        centerId: cleanId,
        operationalStatus: status,
        acceptingBookings: acceptingBookings,
        capacity: capacity,
        loadThreshold: loadThreshold,
        lastUpdated: new Date().toISOString()
      };

      allConfigs[cleanId] = updated;

      try {
        localStorage.setItem(CENTER_CONFIG_KEY, JSON.stringify(allConfigs));
        return { success: true, config: updated };
      } catch (e) {
        console.error("KisanAdmin: Failed to save center configuration.", e);
        return { success: false, error: "Storage error" };
      }
    },

    /**
     * Check center availability using shared KisanUtils logic
     */
    isCenterAcceptingBookings(centerId) {
      if (window.KisanUtils && typeof window.KisanUtils.isCenterAcceptingBookings === "function") {
        return window.KisanUtils.isCenterAcceptingBookings(centerId);
      }
      return true;
    },

    /**
     * Get center availability UI mapping using shared KisanUtils logic
     */
    getCenterAvailability(centerId) {
      if (window.KisanUtils && typeof window.KisanUtils.getCenterAvailability === "function") {
        return window.KisanUtils.getCenterAvailability(centerId);
      }
      return {
        isAvailable: true,
        status: "active",
        acceptingBookings: true,
        reason: "",
        labelHindi: "बुकिंग उपलब्ध",
        labelEnglish: "Booking Available",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200"
      };
    },

    /**
     * Reset a center configuration to standard factory defaults
     */
    resetCenterConfig(centerId) {
      if (!centerId) return false;
      const cleanId = String(centerId).trim().toUpperCase();
      const allConfigs = this.getAllCenterConfigs();
      delete allConfigs[cleanId];
      try {
        localStorage.setItem(CENTER_CONFIG_KEY, JSON.stringify(allConfigs));
        return true;
      } catch (e) {
        return false;
      }
    },

    // =========================================================
    // 3. Read-Only Canonical Storage Queries
    // =========================================================

    getActiveBooking() {
      try {
        const raw = localStorage.getItem(ACTIVE_BOOKING_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return (parsed && parsed.bookingId) ? parsed : null;
      } catch (e) {
        return null;
      }
    },

    getBookings() {
      try {
        const raw = localStorage.getItem(BOOKINGS_HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    },

    getQueueStatus() {
      try {
        const raw = localStorage.getItem(QUEUE_STATUS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return (parsed && parsed.bookingId) ? parsed : null;
      } catch (e) {
        return null;
      }
    },

    getQueueOverview() {
      const activeBooking = this.getActiveBooking();
      const liveQueue = this.getQueueStatus();

      const queueList = [];

      // Live farmer booking if present
      if (activeBooking && activeBooking.bookingId) {
        const isLiveQueueMatched = liveQueue && liveQueue.bookingId === activeBooking.bookingId;

        const queuePos = isLiveQueueMatched && typeof liveQueue.queuePosition === 'number'
          ? liveQueue.queuePosition
          : 12;
        const totalAhead = isLiveQueueMatched && typeof liveQueue.totalVehiclesAhead === 'number'
          ? liveQueue.totalVehiclesAhead
          : Math.max(0, queuePos - 1);
        const estWait = isLiveQueueMatched && typeof liveQueue.estimatedWaitMinutes === 'number'
          ? liveQueue.estimatedWaitMinutes
          : queuePos * 5;
        const arrivalStatus = (isLiveQueueMatched && liveQueue.arrivalStatus)
          ? liveQueue.arrivalStatus
          : "not_arrived";
        const status = (isLiveQueueMatched && liveQueue.status)
          ? liveQueue.status
          : "बुकिंग की पुष्टि (Booking Confirmed)";

        queueList.push({
          bookingId: activeBooking.bookingId,
          tokenId: (isLiveQueueMatched && liveQueue.tokenId) || activeBooking.tokenId || `KS-TKN-${activeBooking.bookingId.replace(/^KS-BOOK-/, '')}`,
          farmerName: activeBooking.farmerName || "Demo Farmer",
          phone: activeBooking.farmerPhone || "98765 43210",
          centerId: activeBooking.centerId || "CTR-HR-01",
          centerName: activeBooking.centerName || "Karnal Central Procurement Center",
          commodity: activeBooking.commodity || "Wheat (Grade A)",
          bookingDate: activeBooking.bookingDate || "Today (आज)",
          timeSlot: activeBooking.timeSlot || "10:00 AM – 11:00 AM",
          queuePosition: queuePos,
          totalVehiclesAhead: totalAhead,
          estimatedWaitMinutes: estWait,
          arrivalStatus: arrivalStatus,
          status: status,
          isLiveFarmer: true
        });
      }

      // Background demo entries
      YARD_DEMO_ENTRIES.forEach(entry => {
        if (!queueList.some(q => q.bookingId === entry.bookingId)) {
          queueList.push({ ...entry });
        }
      });

      // Sort: Completed at bottom, active by position ascending
      queueList.sort((a, b) => {
        const aCompleted = (a.status || "").includes("खरीद पूर्ण");
        const bCompleted = (b.status || "").includes("खरीद पूर्ण");
        if (aCompleted && !bCompleted) return 1;
        if (!aCompleted && bCompleted) return -1;
        return (a.queuePosition || 99) - (b.queuePosition || 99);
      });

      return queueList;
    },

    getProcurementOverview() {
      const queueList = this.getQueueOverview();
      const records = [];

      queueList.forEach(item => {
        const isCompleted = (item.status || "").includes("खरीद पूर्ण");
        const isInProgress = (item.status || "").includes("खरीद प्रक्रिया में") || (item.queuePosition === 0 && item.arrivalStatus === "checked_in");

        if (isCompleted || isInProgress) {
          records.push({
            centerId: item.centerId || "CTR-HR-01",
            centerName: item.centerName || "Karnal Central Procurement Center",
            tokenId: item.tokenId || item.bookingId,
            bookingId: item.bookingId,
            farmerName: item.farmerName || "Demo Farmer",
            commodity: item.commodity || "Wheat (Grade A)",
            grossWeight: item.grossWeight || (isCompleted ? "6,450 kg" : "6,450 kg (Weighing)"),
            tareWeight: item.tareWeight || (isCompleted ? "2,150 kg" : "Pending Tare"),
            netQuantity: item.netQuantity || (isCompleted ? "43.00 Qtl" : "Calculating"),
            moisture: item.moisture || "11.6%",
            status: isCompleted ? "खरीद पूर्ण (Procurement Completed)" : "खरीद प्रक्रिया में (Procurement in Progress)",
            dateTime: item.bookingDate || "Today (Demo)",
            isLiveFarmer: !!item.isLiveFarmer
          });
        }
      });

      return records;
    },

    getCenterMetrics(centerId) {
      const cleanId = String(centerId || "").trim().toLowerCase();
      const allQueue = this.getQueueOverview();
      const centerQueue = allQueue.filter(q => String(q.centerId).trim().toLowerCase() === cleanId);

      const centerObj = this.getCenterById(centerId);
      const config = this.getCenterConfig(centerId);
      const baseQueue = centerObj ? (centerObj.currentQueueVehicles || 0) : 0;

      let todayBookings = centerQueue.length;
      let arrivedFarmers = 0;
      let currentQueue = 0;
      let inProgress = 0;
      let completed = 0;

      centerQueue.forEach(item => {
        const isCompleted = (item.status || "").includes("खरीद पूर्ण");
        const isInProgress = (item.status || "").includes("खरीद प्रक्रिया में") || (item.queuePosition === 0 && !isCompleted && item.arrivalStatus === "checked_in");

        if (isCompleted) {
          completed++;
        } else if (isInProgress) {
          inProgress++;
        } else if (item.arrivalStatus === "checked_in") {
          currentQueue++;
          arrivedFarmers++;
        } else if (item.arrivalStatus === "arrived") {
          arrivedFarmers++;
        }
      });

      if (todayBookings === 0 && centerObj) {
        currentQueue = baseQueue;
        todayBookings = Math.round(baseQueue * 1.5);
        arrivedFarmers = baseQueue;
      }

      // Utilization calculation based on daily capacity
      const capacityMT = config ? config.capacity : (centerObj ? centerObj.dailyCapacityMT : 500);
      // Rough tonnage estimate (approx 4.5 MT per tractor-trolley)
      const estimatedTonnage = (todayBookings * 4.5);
      const utilizationPercent = Math.min(100, Math.round((estimatedTonnage / (capacityMT || 500)) * 100));

      return {
        centerId,
        todayBookings,
        arrivedFarmers,
        currentQueue,
        inProgress,
        completed,
        capacity: capacityMT,
        utilizationPercent,
        operationalStatus: config ? config.operationalStatus : "ACTIVE",
        acceptingBookings: config ? config.acceptingBookings : true,
        loadStatus: centerObj ? centerObj.loadStatus : "medium"
      };
    },

    getDashboardMetrics() {
      const centers = this.getCenters();
      const queueList = this.getQueueOverview();

      const totalCenters = centers.length;
      let todayBookings = queueList.length;
      let arrivedFarmers = 0;
      let activeQueue = 0;
      let inProgress = 0;
      let completed = 0;

      queueList.forEach(item => {
        const isCompleted = (item.status || "").includes("खरीद पूर्ण");
        const isInProgress = (item.status || "").includes("खरीद प्रक्रिया में") || (item.queuePosition === 0 && !isCompleted && item.arrivalStatus === "checked_in");

        if (isCompleted) {
          completed++;
        } else if (isInProgress) {
          inProgress++;
        } else if (item.arrivalStatus === "checked_in" && item.queuePosition > 0) {
          activeQueue++;
          arrivedFarmers++;
        } else if (item.arrivalStatus === "arrived") {
          arrivedFarmers++;
        }
      });

      return {
        totalCenters,
        todayBookings,
        arrivedFarmers,
        activeQueue,
        inProgress,
        completed
      };
    },

    // =========================================================
    // 4. Operational Alerts Engine (kisansetu_admin_alerts)
    // =========================================================

    /**
     * Read administrative alert acknowledgment state defensively
     */
    getAlertState() {
      try {
        const raw = localStorage.getItem(ADMIN_ALERTS_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    },

    /**
     * Generate dynamic operational alerts based on real-time state & configs
     */
    getAlerts() {
      const centers = this.getCenters();
      const alertState = this.getAlertState();
      const alerts = [];
      const seenIds = new Set();

      centers.forEach(c => {
        const metrics = this.getCenterMetrics(c.id);
        const config = this.getCenterConfig(c.id);

        // 1. High Queue Alert
        if (metrics.currentQueue >= 15) {
          const alertId = `ALT-HQ-${c.id}`;
          seenIds.add(alertId);
          alerts.push({
            id: alertId,
            centerId: c.id,
            centerName: c.name,
            title: `High Queue Congestion (${metrics.currentQueue} Vehicles)`,
            description: `${c.name} is experiencing heavy yard queue delays with ${metrics.currentQueue} tractor-trolleys waiting.`,
            type: "HIGH_QUEUE",
            severity: metrics.currentQueue >= 25 ? "CRITICAL" : "HIGH",
            recommendation: "Activate auxiliary weighbridge lane or divert pending slots to adjacent centers.",
            timestamp: "Live Alert (लाइव)",
            status: alertState[alertId]?.status || "active",
            acknowledged: !!alertState[alertId]?.acknowledged,
            acknowledgedBy: alertState[alertId]?.acknowledgedBy || null,
            acknowledgedAt: alertState[alertId]?.acknowledgedAt || alertState[alertId]?.timestamp || null,
            reviewedBy: alertState[alertId]?.reviewedBy || null,
            reviewedAt: alertState[alertId]?.reviewedAt || null
          });
        }

        // 2. High Capacity Utilization Alert
        if (metrics.utilizationPercent >= (config.loadThreshold || 80)) {
          const alertId = `ALT-UTIL-${c.id}`;
          seenIds.add(alertId);
          alerts.push({
            id: alertId,
            centerId: c.id,
            centerName: c.name,
            title: `Capacity Limit Reached (${metrics.utilizationPercent}% Utilized)`,
            description: `${c.name} has exceeded the operational workload threshold of ${config.loadThreshold}%.`,
            type: "HIGH_LOAD",
            severity: metrics.utilizationPercent >= 95 ? "CRITICAL" : "HIGH",
            recommendation: "Review remaining daily intake capacity and consider capping slot reservations.",
            timestamp: "Live Alert (लाइव)",
            status: alertState[alertId]?.status || "active",
            acknowledged: !!alertState[alertId]?.acknowledged,
            acknowledgedBy: alertState[alertId]?.acknowledgedBy || null,
            acknowledgedAt: alertState[alertId]?.acknowledgedAt || alertState[alertId]?.timestamp || null,
            reviewedBy: alertState[alertId]?.reviewedBy || null,
            reviewedAt: alertState[alertId]?.reviewedAt || null
          });
        }

        // 3. Center Status Paused / Maintenance Alert
        if (config.operationalStatus === "PAUSED" || config.operationalStatus === "MAINTENANCE") {
          const alertId = `ALT-STATUS-${c.id}`;
          seenIds.add(alertId);
          alerts.push({
            id: alertId,
            centerId: c.id,
            centerName: c.name,
            title: `Center Marked ${config.operationalStatus}`,
            description: `${c.name} operational availability has been set to ${config.operationalStatus} by district administration.`,
            type: "CENTER_UNAVAILABLE",
            severity: "MEDIUM",
            recommendation: "Verify maintenance completion and re-enable active operations.",
            timestamp: config.lastUpdated ? new Date(config.lastUpdated).toLocaleTimeString() : "Recent",
            status: alertState[alertId]?.status || "active",
            acknowledged: !!alertState[alertId]?.acknowledged,
            acknowledgedBy: alertState[alertId]?.acknowledgedBy || null,
            acknowledgedAt: alertState[alertId]?.acknowledgedAt || alertState[alertId]?.timestamp || null,
            reviewedBy: alertState[alertId]?.reviewedBy || null,
            reviewedAt: alertState[alertId]?.reviewedAt || null
          });
        }

        // 4. Booking Paused Alert
        if (!config.acceptingBookings && config.operationalStatus === "ACTIVE") {
          const alertId = `ALT-BK-PAUSED-${c.id}`;
          seenIds.add(alertId);
          alerts.push({
            id: alertId,
            centerId: c.id,
            centerName: c.name,
            title: "New Slot Bookings Paused",
            description: `${c.name} is currently not accepting new farmer slot appointments.`,
            type: "BOOKING_PAUSED",
            severity: "LOW",
            recommendation: "Resume slot bookings once yard backlog clears.",
            timestamp: config.lastUpdated ? new Date(config.lastUpdated).toLocaleTimeString() : "Recent",
            status: alertState[alertId]?.status || "active",
            acknowledged: !!alertState[alertId]?.acknowledged,
            acknowledgedBy: alertState[alertId]?.acknowledgedBy || null,
            acknowledgedAt: alertState[alertId]?.acknowledgedAt || alertState[alertId]?.timestamp || null,
            reviewedBy: alertState[alertId]?.reviewedBy || null,
            reviewedAt: alertState[alertId]?.reviewedAt || null
          });
        }
      });

      // Include baseline operational alerts
      BASELINE_DEMO_ALERTS.forEach(base => {
        if (!seenIds.has(base.id)) {
          alerts.push({
            ...base,
            status: alertState[base.id]?.status || "active",
            acknowledged: !!alertState[base.id]?.acknowledged,
            acknowledgedBy: alertState[base.id]?.acknowledgedBy || null,
            acknowledgedAt: alertState[base.id]?.acknowledgedAt || alertState[base.id]?.timestamp || null,
            reviewedBy: alertState[base.id]?.reviewedBy || null,
            reviewedAt: alertState[base.id]?.reviewedAt || null
          });
        }
      });

      // Sort by severity: CRITICAL -> HIGH -> MEDIUM -> LOW
      const severityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
      alerts.sort((a, b) => (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5));

      return alerts;
    },

    /**
     * Acknowledge an operational alert
     */
    acknowledgeAlert(alertId, reviewer = "District Admin") {
      if (!alertId) return false;
      const alertState = this.getAlertState();
      alertState[alertId] = {
        acknowledged: true,
        status: "acknowledged",
        acknowledgedBy: reviewer,
        acknowledgedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
      try {
        localStorage.setItem(ADMIN_ALERTS_KEY, JSON.stringify(alertState));
        return true;
      } catch (e) {
        return false;
      }
    },

    /**
     * Mark an alert as reviewed / dismissed
     */
    markAlertReviewed(alertId, reviewer = "District Admin") {
      if (!alertId) return false;
      const alertState = this.getAlertState();
      alertState[alertId] = {
        acknowledged: true,
        status: "reviewed",
        reviewedBy: reviewer,
        reviewedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
      try {
        localStorage.setItem(ADMIN_ALERTS_KEY, JSON.stringify(alertState));
        return true;
      } catch (e) {
        return false;
      }
    },

    // =========================================================
    // 5. District Analytics & Center Comparisons
    // =========================================================

    /**
     * Compile comprehensive district-wide analytics
     */
    getDistrictAnalytics() {
      const metrics = this.getDashboardMetrics();
      const centers = this.getCenters();
      const queueList = this.getQueueOverview();
      const records = this.getProcurementOverview();

      // Estimated average wait
      let totalWait = 0;
      let waitingCount = 0;
      queueList.forEach(q => {
        if (q.estimatedWaitMinutes > 0) {
          totalWait += q.estimatedWaitMinutes;
          waitingCount++;
        }
      });
      const avgWaitMinutes = waitingCount > 0 ? Math.round(totalWait / waitingCount) : 15;

      // Highest queue center & highest utilization center & totals
      let highestQueue = -1;
      let highestQueueCenter = "None";
      let highestUtil = -1;
      let highestUtilCenter = "None";
      let totalCapacityMT = 0;
      let utilizedCapacityMT = 0;
      let activeCenters = 0;

      centers.forEach(c => {
        const cm = this.getCenterMetrics(c.id);
        const config = this.getCenterConfig(c.id);
        const cap = config ? config.capacity : (c.dailyCapacityMT || 500);
        totalCapacityMT += cap;
        const estTonnage = Math.round((cm.todayBookings || 0) * 4.5);
        utilizedCapacityMT += Math.min(cap, estTonnage);

        if (config && config.operationalStatus === "ACTIVE") {
          activeCenters++;
        }

        if (cm.currentQueue > highestQueue) {
          highestQueue = cm.currentQueue;
          highestQueueCenter = c.name;
        }
        if (cm.utilizationPercent > highestUtil) {
          highestUtil = cm.utilizationPercent;
          highestUtilCenter = c.name;
        }
      });

      const overallUtilizationPct = totalCapacityMT > 0 ? Math.min(100, Math.round((utilizedCapacityMT / totalCapacityMT) * 100)) : 0;

      // Procurement totals
      let totalProcuredQtl = 0;
      let moistureSum = 0;
      let moistureCount = 0;
      records.forEach(r => {
        const qtlMatch = (r.netQuantity || "").match(/([\d.]+)/);
        if (qtlMatch) totalProcuredQtl += parseFloat(qtlMatch[1]);
        const moistMatch = (r.moisture || "").match(/([\d.]+)/);
        if (moistMatch) {
          moistureSum += parseFloat(moistMatch[1]);
          moistureCount++;
        }
      });
      const avgMoisturePct = moistureCount > 0 ? parseFloat((moistureSum / moistureCount).toFixed(1)) : 11.6;

      // Completion rate
      const totalAttempted = metrics.inProgress + metrics.completed;
      const completionRatePercent = totalAttempted > 0 ? Math.round((metrics.completed / totalAttempted) * 100) : 100;

      return {
        // District Facility Totals
        totalCenters: centers.length,
        activeCenters: activeCenters,
        totalCapacityMT: totalCapacityMT,
        utilizedCapacityMT: utilizedCapacityMT,
        overallUtilizationPct: overallUtilizationPct,

        // Bookings
        totalBookings: metrics.todayBookings,
        confirmedBookings: metrics.todayBookings,
        arrivedCount: metrics.arrivedFarmers,
        totalArrivals: metrics.arrivedFarmers,
        pendingArrival: Math.max(0, metrics.todayBookings - metrics.arrivedFarmers),

        // Queue
        activeQueue: metrics.activeQueue,
        avgWaitMinutes: avgWaitMinutes,
        highestQueueCenter: highestQueueCenter,
        highestQueueCount: highestQueue,

        // Procurement
        inProgress: metrics.inProgress,
        completed: metrics.completed,
        completionRatePercent: completionRatePercent,
        totalProcurementRecords: records.length,
        totalProcuredQtl: Math.round(totalProcuredQtl * 100) / 100,
        avgMoisturePct: avgMoisturePct,

        // Capacity
        highestUtilCenter: highestUtilCenter,
        highestUtilPercent: highestUtil
      };
    },

    /**
     * Retrieve comparative center performance rows with sorting
     * @param {string} sortBy 'queue' | 'utilization' | 'bookings' | 'completed' | 'name'
     */
    getCenterPerformanceComparison(sortBy = "queue") {
      const centers = this.getCenters();
      const rows = centers.map(c => {
        const m = this.getCenterMetrics(c.id);
        return {
          centerId: c.id,
          name: c.name,
          district: c.district,
          bookings: m.todayBookings,
          arrivals: m.arrivedFarmers,
          queue: m.currentQueue,
          inProgress: m.inProgress,
          completed: m.completed,
          capacity: m.capacity,
          utilization: m.utilizationPercent,
          status: m.operationalStatus,
          acceptingBookings: m.acceptingBookings
        };
      });

      if (sortBy === "queue") {
        rows.sort((a, b) => b.queue - a.queue);
      } else if (sortBy === "utilization") {
        rows.sort((a, b) => b.utilization - a.utilization);
      } else if (sortBy === "bookings") {
        rows.sort((a, b) => b.bookings - a.bookings);
      } else if (sortBy === "completed") {
        rows.sort((a, b) => b.completed - a.completed);
      } else if (sortBy === "name") {
        rows.sort((a, b) => a.name.localeCompare(b.name));
      }

      return rows;
    },

    // =========================================================
    // 6. Operator Activity Audit (kisansetu_operator_activity)
    // =========================================================

    /**
     * Retrieve operational activity audit logs (combining baseline demo + live logs)
     */
    getOperatorActivities() {
      let liveList = [];
      try {
        const raw = localStorage.getItem(OPERATOR_ACTIVITY_KEY);
        liveList = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(liveList)) liveList = [];
      } catch (e) {
        liveList = [];
      }

      // Merge live activities with baseline historical records
      const merged = [...liveList, ...BASELINE_OPERATOR_ACTIVITIES];
      return merged;
    },

    // =========================================================
    // 7. District Reports & Client-Side CSV Export
    // =========================================================

    /**
     * Generate Daily Operations Report rows
     */
    getDailyOperationsReport() {
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const m = this.getDashboardMetrics();
      const analytics = this.getDistrictAnalytics();

      return [
        { metric: "Report Date", value: `${dateStr} (Demo Shift)`, category: "Shift Overview" },
        { metric: "Total Configured Centers", value: m.totalCenters, category: "District Infrastructure" },
        { metric: "Active Operational Centers", value: analytics.activeCenters, category: "District Infrastructure" },
        { metric: "Total District Capacity", value: `${analytics.totalCapacityMT} MT`, category: "Capacity & Intake" },
        { metric: "Total Bookings Scheduled", value: m.todayBookings, category: "Farmer Scheduling" },
        { metric: "Farmers Arrived at Yard", value: m.arrivedFarmers, category: "Yard Attendance" },
        { metric: "Active Vehicles in Queue", value: m.activeQueue, category: "Queue Management" },
        { metric: "Procurement In Progress", value: m.inProgress, category: "Weighbridge Operations" },
        { metric: "Completed Purchases", value: m.completed, category: "Weighbridge Operations" },
        { metric: "Average Estimated Wait", value: `${analytics.avgWaitMinutes} Minutes`, category: "Throughput" },
        { metric: "Capacity Peak Center", value: `${analytics.highestUtilCenter} (${analytics.highestUtilPercent}%)`, category: "Bottleneck Analysis" }
      ];
    },

    /**
     * Generate Center Performance Report rows
     */
    getCenterPerformanceReport() {
      return this.getCenterPerformanceComparison("name");
    },

    /**
     * Generate Procurement Summary Report rows
     */
    getProcurementSummaryReport() {
      return this.getProcurementOverview();
    },

    /**
     * Generate CSV content string for a given report type
     * @param {'operations' | 'centers' | 'procurement'} type
     */
    generateCSV(type) {
      const timestamp = new Date().toISOString();
      const headerComments = `# KisanSetu Demo Report — District Oversight Console\n# Generated: ${timestamp}\n# Disclaimer: Prototype Demo Data for Evaluation Only\n\n`;

      if (type === 'operations') {
        const rows = this.getDailyOperationsReport();
        let csv = headerComments + "Metric,Value\n";
        rows.forEach(r => {
          csv += `"${r.metric}","${r.value}"\n`;
        });
        return csv;
      }

      if (type === 'centers') {
        const rows = this.getCenterPerformanceReport();
        let csv = headerComments + "Center ID,Center Name,District,Operational Status,Bookings,Arrivals,Current Queue,In Progress,Completed,Capacity (MT),Utilization (%)\n";
        rows.forEach(r => {
          csv += `"${r.centerId}","${r.name}","${r.district}","${r.status}",${r.bookings},${r.arrivals},${r.queue},${r.inProgress},${r.completed},${r.capacity},${r.utilization}%\n`;
        });
        return csv;
      }

      if (type === 'procurement') {
        const rows = this.getProcurementSummaryReport();
        let csv = headerComments + "Center ID,Center Name,Token ID,Booking ID,Farmer Name,Crop,Gross Wt,Tare Wt,Net Qtl,Moisture,Status,Date Time\n";
        rows.forEach(r => {
          csv += `"${r.centerId}","${r.centerName}","${r.tokenId}","${r.bookingId}","${r.farmerName}","${r.commodity}","${r.grossWeight}","${r.tareWeight}","${r.netQuantity}","${r.moisture}","${r.status}","${r.dateTime}"\n`;
        });
        return csv;
      }

      return headerComments + "No data\n";
    },

    /**
     * Injects an interactive district switcher next to the district badge in the admin portal header.
     * Allows district administrators to switch jurisdictions smoothly without logging out.
     */
    initHeaderDistrictSwitcher() {
      const badge = document.getElementById('district-badge') || document.getElementById('header-district-badge');
      if (!badge || document.getElementById('district-switcher-container')) return;

      const currentUser = (typeof window !== 'undefined' && window.KisanAuth) ? window.KisanAuth.getCurrentUser() : null;
      if (!currentUser) return;

      const availableAdmins = (window.KisanAuth && window.KisanAuth.getAvailableDistrictAdmins) ? window.KisanAuth.getAvailableDistrictAdmins() : [];
      if (availableAdmins.length <= 1) return;

      const currentDistrict = (currentUser.district || "Karnal").toLowerCase();

      const container = document.createElement('div');
      container.className = 'relative inline-block text-left ml-2';
      container.id = 'district-switcher-container';

      const optionsHtml = availableAdmins.map(adm => {
        const isCurrent = (adm.district || "").toLowerCase() === currentDistrict;
        return `
          <button type="button" class="district-switch-item w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center justify-between transition-colors ${isCurrent ? 'bg-amber-50/70 font-bold text-amber-800' : 'text-slate-700'}" data-district="${adm.district}">
            <div>
              <div class="font-medium">${adm.name}</div>
              <div class="text-[10px] text-slate-400 font-mono">${adm.district} District • Haryana</div>
            </div>
            ${isCurrent ? '<span class="text-xs text-amber-800 font-bold">✓ Active</span>' : '<span class="text-[10px] text-amber-700 font-medium">Switch &rarr;</span>'}
          </button>
        `;
      }).join('');

      container.innerHTML = `
        <button type="button" id="district-switcher-btn" class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors cursor-pointer" title="Switch District Administration">
          <span>⇄ Switch District</span>
          <span class="text-[8px]">▼</span>
        </button>
        <div id="district-switcher-menu" class="hidden absolute left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 divide-y divide-slate-100">
          <div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 rounded-t-xl flex justify-between items-center">
            <span>Select Jurisdiction</span>
            <span class="text-amber-700 font-semibold">${availableAdmins.length} Available</span>
          </div>
          <div class="max-h-60 overflow-y-auto">
            ${optionsHtml}
          </div>
        </div>
      `;

      const parent = badge.parentNode;
      if (parent) {
        badge.classList.add('inline-block');
        parent.style.display = 'flex';
        parent.style.alignItems = 'center';
        parent.style.flexWrap = 'wrap';
        parent.appendChild(container);
      }

      const btn = container.querySelector('#district-switcher-btn');
      const menu = container.querySelector('#district-switcher-menu');

      if (btn && menu) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          menu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
          if (!container.contains(e.target)) {
            menu.classList.add('hidden');
          }
        });

        container.querySelectorAll('.district-switch-item').forEach(item => {
          item.addEventListener('click', () => {
            const targetDistrict = item.getAttribute('data-district');
            if (targetDistrict && targetDistrict.toLowerCase() !== currentDistrict) {
              window.KisanAuth.switchAdminDistrict(targetDistrict);
            } else {
              menu.classList.add('hidden');
            }
          });
        });
      }
    }
  };

  // Auto-initialize header district switcher when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        KisanAdmin.initHeaderDistrictSwitcher();
      });
    } else {
      setTimeout(() => KisanAdmin.initHeaderDistrictSwitcher(), 50);
    }
  }

  // Export to global scope
  window.KisanAdmin = KisanAdmin;
})();

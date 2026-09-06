/**
 * KisanSetu — Operator Operations Shared Engine
 * Version: 1.0.0 (Phase D: Operator Operations Portal)
 *
 * Provides real-time synchronization between the facility operator terminal
 * and farmer queue states using shared canonical localStorage keys:
 * - kisansetu_active_booking
 * - kisansetu_bookings
 * - kisansetu_queue_status
 */

(function () {
  const ACTIVE_BOOKING_KEY = "kisansetu_active_booking";
  const BOOKINGS_HISTORY_KEY = "kisansetu_bookings";
  const QUEUE_STATUS_KEY = "kisansetu_queue_status";
  const OPERATOR_ACTIVITY_KEY = "kisansetu_operator_activity";

  // Fixed supplementary demo queue entries representing yard vehicles at Karnal / Center
  const DEFAULT_DEMO_QUEUE_ENTRIES = [
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
      isDemoStatic: true
    }
  ];

  const KisanOperator = {
    ACTIVE_BOOKING_KEY,
    BOOKINGS_HISTORY_KEY,
    QUEUE_STATUS_KEY,
    OPERATOR_ACTIVITY_KEY,

    /**
     * Minimal non-breaking operational audit logger for District Admin tracking
     */
    logActivity(action, bookingIdOrDetails, details = {}) {
      try {
        const raw = localStorage.getItem(OPERATOR_ACTIVITY_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const isObj = typeof bookingIdOrDetails === 'object' && bookingIdOrDetails !== null;
        const bookingId = isObj ? (bookingIdOrDetails.bookingId || "") : bookingIdOrDetails;
        const info = isObj ? bookingIdOrDetails : details;

        const entry = {
          id: "ACT-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
          action: action,
          bookingId: bookingId,
          tokenId: info.tokenId || info.token || "",
          farmerName: info.farmerName || "Demo Farmer",
          centerId: info.centerId || "CTR-HR-01",
          centerName: info.centerName || "Karnal Central Procurement Center",
          timestamp: new Date().toISOString(),
          role: "operator"
        };
        list.unshift(entry);
        if (list.length > 50) list.length = 50;
        localStorage.setItem(OPERATOR_ACTIVITY_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn("KisanOperator: Unable to persist activity log.", e);
      }
    },

    /**
     * Safely read active booking from localStorage
     */
    getActiveBooking() {
      try {
        const raw = localStorage.getItem(ACTIVE_BOOKING_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return (parsed && parsed.bookingId) ? parsed : null;
      } catch (e) {
        console.warn("KisanOperator: Invalid JSON in active booking.", e);
        return null;
      }
    },

    /**
     * Safely read current queue status from localStorage
     */
    getLiveQueueStatus() {
      try {
        const raw = localStorage.getItem(QUEUE_STATUS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return (parsed && parsed.bookingId) ? parsed : null;
      } catch (e) {
        console.warn("KisanOperator: Invalid JSON in queue status.", e);
        return null;
      }
    },

    /**
     * Save queue status to localStorage with ISO timestamp
     */
    saveQueueStatus(queueData) {
      try {
        if (!queueData) return false;
        queueData.lastUpdated = new Date().toISOString();
        localStorage.setItem(QUEUE_STATUS_KEY, JSON.stringify(queueData));
        return true;
      } catch (e) {
        console.error("KisanOperator: Error persisting queue status.", e);
        return false;
      }
    },

    /**
     * Retrieve all queue entries for the operator facility.
     * Integrates the live active farmer booking with yard demo entries.
     */
    getOperatorQueue() {
      const activeBooking = this.getActiveBooking();
      let liveQueue = this.getLiveQueueStatus();

      const queueList = [];

      // Include active farmer booking as live entry
      if (activeBooking && activeBooking.bookingId) {
        if (!liveQueue || liveQueue.bookingId !== activeBooking.bookingId) {
          liveQueue = {
            bookingId: activeBooking.bookingId,
            tokenId: activeBooking.tokenId || `KS-TKN-${activeBooking.bookingId.replace(/^KS-BOOK-/, '')}`,
            centerId: activeBooking.centerId || "CTR-HR-01",
            centerName: activeBooking.centerName || "Karnal Central Procurement Center",
            farmerName: activeBooking.farmerName || "Demo Farmer",
            commodity: activeBooking.commodity || "Wheat (Grade A)",
            bookingDate: activeBooking.bookingDate || "Today (आज)",
            timeSlot: activeBooking.timeSlot || "10:00 AM – 11:00 AM",
            queuePosition: 12,
            totalVehiclesAhead: 11,
            estimatedWaitMinutes: 45,
            arrivalStatus: "not_arrived",
            status: "बुकिंग की पुष्टि (Booking Confirmed)",
            lastUpdated: new Date().toISOString()
          };
          this.saveQueueStatus(liveQueue);
        }

        queueList.push({
          bookingId: activeBooking.bookingId,
          tokenId: liveQueue.tokenId || activeBooking.tokenId,
          farmerName: activeBooking.farmerName || "Demo Farmer",
          phone: activeBooking.farmerPhone || "98765 43210",
          centerId: activeBooking.centerId,
          centerName: activeBooking.centerName,
          commodity: activeBooking.commodity,
          bookingDate: activeBooking.bookingDate,
          timeSlot: activeBooking.timeSlot,
          queuePosition: liveQueue.queuePosition,
          totalVehiclesAhead: liveQueue.totalVehiclesAhead,
          estimatedWaitMinutes: liveQueue.estimatedWaitMinutes,
          arrivalStatus: liveQueue.arrivalStatus,
          status: liveQueue.status,
          isLiveFarmer: true
        });
      }

      // Append background yard demo entries (avoiding duplicate bookingIds)
      DEFAULT_DEMO_QUEUE_ENTRIES.forEach(entry => {
        if (!queueList.some(q => q.bookingId === entry.bookingId)) {
          queueList.push({ ...entry });
        }
      });

      // Sort: Completed at bottom, active by queue position ascending
      queueList.sort((a, b) => {
        const aCompleted = (a.status || "").includes("खरीद पूर्ण");
        const bCompleted = (b.status || "").includes("खरीद पूर्ण");
        if (aCompleted && !bCompleted) return 1;
        if (!aCompleted && bCompleted) return -1;
        return (a.queuePosition || 99) - (b.queuePosition || 99);
      });

      return queueList;
    },

    /**
     * Compute real-time operational dashboard metrics
     */
    getDashboardMetrics() {
      const queueList = this.getOperatorQueue();

      let todayBookings = queueList.length;
      let arrivedFarmers = 0;
      let pendingGateVerification = 0;
      let waitingInQueue = 0;
      let inProgress = 0;
      let completed = 0;

      queueList.forEach(item => {
        const isCompleted = (item.status || "").includes("खरीद पूर्ण");
        const isInProgress = (item.status || "").includes("खरीद प्रक्रिया में") || (item.queuePosition === 0 && !isCompleted && item.arrivalStatus === "checked_in");

        if (isCompleted) {
          completed++;
        } else if (isInProgress) {
          inProgress++;
        } else if (item.arrivalStatus === "checked_in") {
          waitingInQueue++;
          arrivedFarmers++;
        } else if (item.arrivalStatus === "arrived") {
          pendingGateVerification++;
          arrivedFarmers++;
        }
      });

      return {
        todayBookings,
        arrivedFarmers,
        pendingGateVerification,
        waitingInQueue,
        inProgress,
        completed
      };
    },

    /**
     * Process Gate Verification / Check-in for an arrived farmer
     */
    verifyGate(bookingId) {
      const activeBooking = this.getActiveBooking();
      let liveQueue = this.getLiveQueueStatus();

      // Check if target is the live active booking
      if (activeBooking && activeBooking.bookingId === bookingId) {
        if (!liveQueue) {
          liveQueue = {
            bookingId: activeBooking.bookingId,
            tokenId: activeBooking.tokenId,
            centerId: activeBooking.centerId,
            centerName: activeBooking.centerName
          };
        }

        // Prevent duplicate verification
        if (liveQueue.arrivalStatus === "checked_in") {
          return { success: true, message: "Already verified", queue: liveQueue };
        }

        liveQueue.arrivalStatus = "checked_in";
        liveQueue.status = "गेट सत्यापन पूर्ण (Gate Verification Complete)";
        liveQueue.queuePosition = 5;
        liveQueue.totalVehiclesAhead = 4;
        liveQueue.estimatedWaitMinutes = 20;

        this.saveQueueStatus(liveQueue);
        this.logActivity("gate_verified", bookingId, { tokenId: liveQueue.tokenId, farmerName: liveQueue.farmerName || activeBooking.farmerName, centerId: liveQueue.centerId });
        return { success: true, message: "Gate verified successfully", queue: liveQueue };
      }

      // Check supplementary demo entry
      const demoItem = DEFAULT_DEMO_QUEUE_ENTRIES.find(d => d.bookingId === bookingId);
      if (demoItem) {
        demoItem.arrivalStatus = "checked_in";
        demoItem.status = "गेट सत्यापन पूर्ण (Gate Verification Complete)";
        demoItem.queuePosition = Math.min(demoItem.queuePosition, 5);
        this.logActivity("gate_verified", bookingId, { tokenId: demoItem.tokenId, farmerName: demoItem.farmerName, centerId: demoItem.centerId });
        return { success: true, message: "Gate verified successfully", queue: demoItem };
      }

      return { success: false, message: "Booking record not found" };
    },

    /**
     * Advance Queue position for a checked-in farmer
     */
    advanceQueue(bookingId) {
      const activeBooking = this.getActiveBooking();
      let liveQueue = this.getLiveQueueStatus();

      if (activeBooking && activeBooking.bookingId === bookingId && liveQueue) {
        let pos = typeof liveQueue.queuePosition === 'number' ? liveQueue.queuePosition : 12;

        if (pos > 8) {
          liveQueue.queuePosition = 8;
          liveQueue.totalVehiclesAhead = 7;
          liveQueue.estimatedWaitMinutes = 30;
          liveQueue.status = "कतार में प्रतीक्षा (Waiting in Queue)";
        } else if (pos > 5) {
          liveQueue.queuePosition = 5;
          liveQueue.totalVehiclesAhead = 4;
          liveQueue.estimatedWaitMinutes = 20;
          liveQueue.status = "कतार में प्रतीक्षा (Waiting in Queue)";
        } else if (pos > 2) {
          liveQueue.queuePosition = 2;
          liveQueue.totalVehiclesAhead = 1;
          liveQueue.estimatedWaitMinutes = 10;
          liveQueue.status = "कतार में प्रतीक्षा (Waiting in Queue)";
        } else if (pos === 2) {
          liveQueue.queuePosition = 1;
          liveQueue.totalVehiclesAhead = 0;
          liveQueue.estimatedWaitMinutes = 5;
          liveQueue.status = "आपकी बारी जल्द है (Your Turn Is Next)";
        } else if (pos === 1) {
          liveQueue.queuePosition = 0;
          liveQueue.totalVehiclesAhead = 0;
          liveQueue.estimatedWaitMinutes = 0;
          liveQueue.status = "खरीद प्रक्रिया में (Procurement in Progress)";
        } else {
          liveQueue.queuePosition = 0;
          liveQueue.totalVehiclesAhead = 0;
          liveQueue.estimatedWaitMinutes = 0;
          if (liveQueue.status !== "खरीद पूर्ण (Procurement Completed)") {
            liveQueue.status = "खरीद प्रक्रिया में (Procurement in Progress)";
          }
        }

        // Safety bounds
        liveQueue.queuePosition = Math.max(0, liveQueue.queuePosition);
        liveQueue.totalVehiclesAhead = Math.max(0, liveQueue.totalVehiclesAhead);
        liveQueue.estimatedWaitMinutes = Math.max(0, liveQueue.estimatedWaitMinutes);

        this.saveQueueStatus(liveQueue);
        this.logActivity("queue_advanced", bookingId, { tokenId: liveQueue.tokenId, farmerName: liveQueue.farmerName || activeBooking.farmerName, centerId: liveQueue.centerId });
        return { success: true, queue: liveQueue };
      }

      // Supplementary demo entry advance
      const demoItem = DEFAULT_DEMO_QUEUE_ENTRIES.find(d => d.bookingId === bookingId);
      if (demoItem) {
        demoItem.queuePosition = Math.max(0, demoItem.queuePosition - 1);
        demoItem.totalVehiclesAhead = Math.max(0, demoItem.queuePosition - 1);
        demoItem.estimatedWaitMinutes = demoItem.queuePosition * 5;
        if (demoItem.queuePosition === 1) {
          demoItem.status = "आपकी बारी जल्द है (Your Turn Is Next)";
        } else if (demoItem.queuePosition === 0) {
          demoItem.status = "खरीद प्रक्रिया में (Procurement in Progress)";
        }
        this.logActivity("queue_advanced", bookingId, { tokenId: demoItem.tokenId, farmerName: demoItem.farmerName, centerId: demoItem.centerId });
        return { success: true, queue: demoItem };
      }

      return { success: false, message: "Booking record not found" };
    },

    /**
     * Start procurement intake process at weighbridge
     */
    startProcurement(bookingId) {
      const activeBooking = this.getActiveBooking();
      let liveQueue = this.getLiveQueueStatus();

      if (activeBooking && activeBooking.bookingId === bookingId) {
        if (!liveQueue) {
          liveQueue = {
            bookingId: activeBooking.bookingId,
            tokenId: activeBooking.tokenId,
            centerId: activeBooking.centerId,
            centerName: activeBooking.centerName
          };
        }

        liveQueue.queuePosition = 0;
        liveQueue.totalVehiclesAhead = 0;
        liveQueue.estimatedWaitMinutes = 0;
        liveQueue.status = "खरीद प्रक्रिया में (Procurement in Progress)";

        this.saveQueueStatus(liveQueue);
        this.logActivity("procurement_started", bookingId, { tokenId: liveQueue.tokenId, farmerName: liveQueue.farmerName || activeBooking.farmerName, centerId: liveQueue.centerId });
        return { success: true, queue: liveQueue };
      }

      const demoItem = DEFAULT_DEMO_QUEUE_ENTRIES.find(d => d.bookingId === bookingId);
      if (demoItem) {
        demoItem.queuePosition = 0;
        demoItem.status = "खरीद प्रक्रिया में (Procurement in Progress)";
        this.logActivity("procurement_started", bookingId, { tokenId: demoItem.tokenId, farmerName: demoItem.farmerName, centerId: demoItem.centerId });
        return { success: true, queue: demoItem };
      }

      return { success: false, message: "Booking record not found" };
    },

    /**
     * Complete procurement and finalize electronic weighment receipt
     */
    completeProcurement(bookingId) {
      const activeBooking = this.getActiveBooking();
      let liveQueue = this.getLiveQueueStatus();

      if (activeBooking && activeBooking.bookingId === bookingId) {
        if (!liveQueue) {
          liveQueue = {
            bookingId: activeBooking.bookingId,
            tokenId: activeBooking.tokenId,
            centerId: activeBooking.centerId,
            centerName: activeBooking.centerName
          };
        }

        // Prevent duplicate completion
        if (liveQueue.status === "खरीद पूर्ण (Procurement Completed)") {
          return { success: true, message: "Procurement already completed", queue: liveQueue };
        }

        liveQueue.queuePosition = 0;
        liveQueue.totalVehiclesAhead = 0;
        liveQueue.estimatedWaitMinutes = 0;
        liveQueue.status = "खरीद पूर्ण (Procurement Completed)";

        this.saveQueueStatus(liveQueue);
        this.logActivity("procurement_completed", bookingId, { tokenId: liveQueue.tokenId, farmerName: liveQueue.farmerName || activeBooking.farmerName, centerId: liveQueue.centerId });
        return { success: true, message: "Procurement completed successfully", queue: liveQueue };
      }

      const demoItem = DEFAULT_DEMO_QUEUE_ENTRIES.find(d => d.bookingId === bookingId);
      if (demoItem) {
        if (demoItem.status === "खरीद पूर्ण (Procurement Completed)") {
          return { success: true, message: "Procurement already completed", queue: demoItem };
        }
        demoItem.queuePosition = 0;
        demoItem.status = "खरीद पूर्ण (Procurement Completed)";
        this.logActivity("procurement_completed", bookingId, { tokenId: demoItem.tokenId, farmerName: demoItem.farmerName, centerId: demoItem.centerId });
        return { success: true, message: "Procurement completed successfully", queue: demoItem };
      }

      return { success: false, message: "Booking record not found" };
    }
  };

  // Export to global scope
  window.KisanOperator = KisanOperator;
})();


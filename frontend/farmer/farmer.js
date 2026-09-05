/**
 * KisanSetu — Farmer Portal Shared Utilities & UI Engine
 * Version: 2.0.0 (Phase B: Center Details, Slot Booking & Digital Token)
 * 
 * ARCHITECTURAL NOTICE:
 * Client-side localStorage persistence used here is for prototype simulation and
 * UX evaluation during SIH. In production, slot reservations and token generation
 * will be transactional, concurrency-locked APIs served by FastAPI + MySQL.
 */

(function () {
  const ACTIVE_BOOKING_KEY = "kisansetu_active_booking";
  const BOOKINGS_HISTORY_KEY = "kisansetu_bookings";
  const QUEUE_STATUS_KEY = "kisansetu_queue_status";

  const FarmerPortal = {
    ACTIVE_BOOKING_KEY,
    BOOKINGS_HISTORY_KEY,
    QUEUE_STATUS_KEY,

    /**
     * Retrieve all procurement centers from mock data
     */
    getCenters() {
      return (
        window.MOCK_CENTERS ||
        (window.KisanMockData && window.KisanMockData.MOCK_CENTERS) ||
        []
      );
    },

    /**
     * Find center by ID (case-insensitive)
     */
    getCenterById(centerId) {
      if (!centerId) return null;
      const cleanId = String(centerId).trim().toLowerCase();
      const centers = this.getCenters();
      return centers.find(c => String(c.id).trim().toLowerCase() === cleanId) || null;
    },

    /**
     * Retrieve the current active booking from localStorage with defensive parsing
     */
    getActiveBooking() {
      try {
        const raw = localStorage.getItem(ACTIVE_BOOKING_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return (parsed && parsed.bookingId) ? parsed : null;
      } catch (e) {
        console.warn("KisanSetu: Invalid JSON in active booking, falling back cleanly.", e);
        return null;
      }
    },

    /**
     * Retrieve all historical bookings from localStorage
     */
    getBookings() {
      try {
        const raw = localStorage.getItem(BOOKINGS_HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn("KisanSetu: Invalid JSON in bookings history.", e);
        return [];
      }
    },

    /**
     * Save a confirmed booking to active state and booking history
     */
    saveBooking(bookingData) {
      try {
        // 1. Ensure token number is deterministically assigned
        if (!bookingData.tokenId) {
          bookingData.tokenId = this.generateTokenNumber(bookingData);
        }

        // 2. Set active booking
        localStorage.setItem(ACTIVE_BOOKING_KEY, JSON.stringify(bookingData));

        // 3. Append to history without duplicating identical bookingId
        const history = this.getBookings().filter(b => b.bookingId !== bookingData.bookingId);
        history.unshift(bookingData);
        localStorage.setItem(BOOKINGS_HISTORY_KEY, JSON.stringify(history));

        return true;
      } catch (e) {
        console.error("KisanSetu: Error saving booking to localStorage.", e);
        return false;
      }
    },

    /**
     * Retrieve the current live queue status from localStorage with defensive parsing
     */
    getQueueStatus() {
      try {
        const raw = localStorage.getItem(QUEUE_STATUS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return (parsed && parsed.bookingId) ? parsed : null;
      } catch (e) {
        console.warn("KisanSetu: Invalid JSON in queue status, falling back cleanly.", e);
        return null;
      }
    },

    /**
     * Save queue status to localStorage with timestamp
     */
    saveQueueStatus(queueData) {
      try {
        if (!queueData) return false;
        queueData.lastUpdated = new Date().toISOString();
        localStorage.setItem(QUEUE_STATUS_KEY, JSON.stringify(queueData));
        return true;
      } catch (e) {
        console.error("KisanSetu: Error saving queue status to localStorage.", e);
        return false;
      }
    },

    /**
     * Initialize demo queue status for a confirmed booking if not already present.
     * Ensures consistent values across browser reloads.
     */
    initializeQueueForBooking(booking) {
      if (!booking || !booking.bookingId) return null;

      // Maintain reload stability: if a queue object already exists for this booking, return it
      const existing = this.getQueueStatus();
      if (existing && existing.bookingId === booking.bookingId) {
        return existing;
      }

      const initialQueue = {
        bookingId: booking.bookingId,
        tokenId: booking.tokenId || this.generateTokenNumber(booking),
        centerId: booking.centerId,
        centerName: booking.centerName,
        queuePosition: 12,
        totalVehiclesAhead: 11,
        estimatedWaitMinutes: 45,
        status: "बुकिंग की पुष्टि (Booking Confirmed)",
        arrivalStatus: "not_arrived",
        lastUpdated: new Date().toISOString()
      };

      this.saveQueueStatus(initialQueue);
      return initialQueue;
    },

    /**
     * Simulate arrival at procurement center: "मैं केंद्र पर पहुंच गया हूँ"
     */
    simulateArrival() {
      let queue = this.getQueueStatus();
      if (!queue) {
        const booking = this.getActiveBooking();
        if (!booking) return null;
        queue = this.initializeQueueForBooking(booking);
      }
      queue.arrivalStatus = "arrived";
      queue.status = "केंद्र पर पहुंच गए (Arrived at Center)";
      this.saveQueueStatus(queue);
      return queue;
    },

    /**
     * Simulate gate verification: "गेट पर चेक-इन करें"
     */
    simulateGateCheckIn() {
      let queue = this.getQueueStatus();
      if (!queue) {
        const booking = this.getActiveBooking();
        if (!booking) return null;
        queue = this.initializeQueueForBooking(booking);
      }
      queue.arrivalStatus = "checked_in";
      queue.status = "गेट सत्यापन पूर्ण (Gate Verification Complete)";
      queue.queuePosition = 5;
      queue.totalVehiclesAhead = 4;
      queue.estimatedWaitMinutes = 20;
      this.saveQueueStatus(queue);
      return queue;
    },

    /**
     * Simulate queue progress manually via UI trigger
     * Progression: 12 -> 8 -> 5 -> 2 -> 1 -> 0
     * Never allows negative queue positions
     */
    updateMockQueueProgress() {
      let queue = this.getQueueStatus();
      if (!queue) {
        const booking = this.getActiveBooking();
        if (!booking) return null;
        queue = this.initializeQueueForBooking(booking);
      }

      let pos = typeof queue.queuePosition === 'number' ? queue.queuePosition : 12;

      if (pos > 8) {
        queue.queuePosition = 8;
        queue.totalVehiclesAhead = 7;
        queue.estimatedWaitMinutes = 30;
        queue.status = "कतार में प्रतीक्षा (Waiting in Queue)";
      } else if (pos > 5) {
        queue.queuePosition = 5;
        queue.totalVehiclesAhead = 4;
        queue.estimatedWaitMinutes = 20;
        queue.status = "कतार में प्रतीक्षा (Waiting in Queue)";
      } else if (pos > 2) {
        queue.queuePosition = 2;
        queue.totalVehiclesAhead = 1;
        queue.estimatedWaitMinutes = 10;
        queue.status = "कतार में प्रतीक्षा (Waiting in Queue)";
      } else if (pos === 2) {
        queue.queuePosition = 1;
        queue.totalVehiclesAhead = 0;
        queue.estimatedWaitMinutes = 5;
        queue.status = "आपकी बारी जल्द है (Your Turn Is Next)";
      } else if (pos === 1) {
        queue.queuePosition = 0;
        queue.totalVehiclesAhead = 0;
        queue.estimatedWaitMinutes = 0;
        queue.status = "खरीद प्रक्रिया में (Procurement in Progress)";
      } else {
        queue.queuePosition = 0;
        queue.totalVehiclesAhead = 0;
        queue.estimatedWaitMinutes = 0;
        if (queue.status !== "खरीद पूर्ण (Procurement Completed)") {
          queue.status = "खरीद प्रक्रिया में (Procurement in Progress)";
        }
      }

      // Safety bounds check
      queue.queuePosition = Math.max(0, queue.queuePosition);
      queue.totalVehiclesAhead = Math.max(0, queue.totalVehiclesAhead);
      queue.estimatedWaitMinutes = Math.max(0, queue.estimatedWaitMinutes);

      this.saveQueueStatus(queue);
      return queue;
    },

    /**
     * Mark procurement as fully completed
     */
    completeProcurement() {
      let queue = this.getQueueStatus();
      if (!queue) {
        const booking = this.getActiveBooking();
        if (!booking) return null;
        queue = this.initializeQueueForBooking(booking);
      }
      queue.queuePosition = 0;
      queue.totalVehiclesAhead = 0;
      queue.estimatedWaitMinutes = 0;
      queue.status = "खरीद पूर्ण (Procurement Completed)";
      this.saveQueueStatus(queue);
      return queue;
    },

    /**
     * Derive procurement lifecycle status and stages
     */
    getProcurementStatus() {
      const booking = this.getActiveBooking();
      if (!booking) return null;

      let queue = this.getQueueStatus();
      if (!queue) {
        queue = this.initializeQueueForBooking(booking);
      }

      const stages = [
        {
          index: 1,
          id: "booking_confirmed",
          nameHindi: "स्लॉट बुकिंग",
          nameEnglish: "Booking Confirmed",
          description: "खरीद केंद्र पर समय स्लॉट की पुष्टि हो चुकी है।"
        },
        {
          index: 2,
          id: "arrived_center",
          nameHindi: "केंद्र पर आगमन",
          nameEnglish: "Arrival at Center",
          description: "किसान खरीद केंद्र पर पहुंच चुके हैं।"
        },
        {
          index: 3,
          id: "gate_verification",
          nameHindi: "गेट सत्यापन",
          nameEnglish: "Gate Verification",
          description: "गेट पर डिजिटल टोकन और दस्तावेज़ सत्यापन पूर्ण।"
        },
        {
          index: 4,
          id: "waiting_queue",
          nameHindi: "कतार में प्रतीक्षा",
          nameEnglish: "Waiting in Queue",
          description: "वेईब्रिज और अनलोडिंग हेतु कतार में प्रतीक्षारत।"
        },
        {
          index: 5,
          id: "procurement_processing",
          nameHindi: "खरीद प्रक्रिया",
          nameEnglish: "Procurement Processing",
          description: "फसल तौल, गुणवत्ता जांच एवं कागजी कार्रवाई प्रगति पर है।"
        },
        {
          index: 6,
          id: "procurement_completed",
          nameHindi: "खरीद पूर्ण",
          nameEnglish: "Procurement Completed",
          description: "खरीद रसीद जारी एवं भुगतान प्रक्रिया आरंभ।"
        }
      ];

      let currentStageIndex = 1;

      if (queue.status && queue.status.includes("खरीद पूर्ण")) {
        currentStageIndex = 6;
      } else if (queue.queuePosition === 0 || (queue.status && queue.status.includes("खरीद प्रक्रिया में"))) {
        currentStageIndex = 5;
      } else if (queue.arrivalStatus === "checked_in") {
        if (queue.queuePosition < 5 || (queue.status && (queue.status.includes("कतार") || queue.status.includes("आपकी बारी")))) {
          currentStageIndex = 4;
        } else {
          currentStageIndex = 3;
        }
      } else if (queue.arrivalStatus === "arrived") {
        currentStageIndex = 2;
      } else {
        currentStageIndex = 1;
      }

      return {
        currentStageIndex,
        currentStage: stages[currentStageIndex - 1],
        stages,
        queueData: queue,
        bookingData: booking
      };
    },

    /**
     * Generate dynamic Booking ID (e.g. KS-BOOK-4821)
     */
    generateBookingId() {
      const rand = Math.floor(1000 + Math.random() * 9000);
      return `KS-BOOK-${rand}`;
    },

    /**
     * Deterministically derive a stable token ID from booking details
     * Ensures consistent reload stability (e.g. KS-BOOK-4821 -> KS-TKN-4821)
     */
    generateTokenNumber(booking) {
      if (!booking) return `KS-TKN-0001`;
      if (booking.tokenId) return booking.tokenId;
      if (booking.bookingId) {
        const suffix = booking.bookingId.replace(/^KS-BOOK-/, '');
        return `KS-TKN-${suffix}`;
      }
      return `KS-TKN-${Math.floor(1000 + Math.random() * 9000)}`;
    },

    /**
     * Dynamically generate upcoming dates starting today using JavaScript Date API
     * Returns an array of friendly date objects
     */
    getUpcomingDates(daysCount = 4) {
      const dates = [];
      const hindiDays = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      const now = new Date();

      for (let i = 0; i < daysCount; i++) {
        const d = new Date();
        d.setDate(now.getDate() + i);

        const year = d.getFullYear();
        const monthNum = String(d.getMonth() + 1).padStart(2, '0');
        const dayNum = String(d.getDate()).padStart(2, '0');
        const isoDate = `${year}-${monthNum}-${dayNum}`;

        const monthName = months[d.getMonth()];
        const dayOfWeek = hindiDays[d.getDay()];

        let relativeLabel = `${dayNum} ${monthName}`;
        let tag = dayOfWeek;

        if (i === 0) {
          tag = "आज (Today)";
        } else if (i === 1) {
          tag = "कल (Tomorrow)";
        }

        dates.push({
          dateIso: isoDate,
          dayNum,
          monthName,
          dayOfWeek,
          tag,
          displayLabel: `${dayNum} ${monthName} (${tag})`,
          isToday: i === 0,
          isTomorrow: i === 1
        });
      }

      return dates;
    },

    /**
     * Mock time slots with realistic operational states
     */
    getMockTimeSlots() {
      return [
        {
          id: "slot-0900",
          timeRange: "09:00 AM – 10:00 AM",
          state: "available",
          stateLabel: "उपलब्ध (Available)"
        },
        {
          id: "slot-1000",
          timeRange: "10:00 AM – 11:00 AM",
          state: "available",
          stateLabel: "उपलब्ध (Available)"
        },
        {
          id: "slot-1100",
          timeRange: "11:00 AM – 12:00 PM",
          state: "full",
          stateLabel: "पूर्ण (Full - No slots)"
        },
        {
          id: "slot-1200",
          timeRange: "12:00 PM – 01:00 PM",
          state: "available",
          stateLabel: "उपलब्ध (Available)"
        },
        {
          id: "slot-1400",
          timeRange: "02:00 PM – 03:00 PM",
          state: "available",
          stateLabel: "उपलब्ध (Available)"
        },
        {
          id: "slot-1500",
          timeRange: "03:00 PM – 04:00 PM",
          state: "available",
          stateLabel: "उपलब्ध (Available)"
        }
      ];
    },

    /**
     * Returns color-coded badge HTML for queue load
     */
    getLoadBadge(status) {
      const s = (status || "").toLowerCase();
      if (s === "low") {
        return `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            कम प्रतीक्षा (Low Wait)
          </span>
        `;
      }
      if (s === "medium") {
        return `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            मध्यम कतार (Moderate Queue)
          </span>
        `;
      }
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          भारी भीड़ (High Wait)
        </span>
      `;
    },

    /**
     * Render single center card HTML
     * @param {Object} center
     * @param {boolean} isCompact whether card is on dashboard (true) or centers directory (false)
     */
    renderCenterCard(center, isCompact = false) {
      const loadBadge = this.getLoadBadge(center.loadStatus);
      const commodity = center.commodity || "विविध फसलें (Multiple Crops)";

      const buttonHtml = isCompact
        ? `<a href="center-details.html?id=${encodeURIComponent(center.id)}" class="btn btn-outline btn-sm w-full text-xs font-semibold py-2 text-center text-[#15803d] hover:bg-emerald-50 flex items-center justify-center gap-1">
             विवरण देखें (View Details) &rarr;
           </a>`
        : `<a href="center-details.html?id=${encodeURIComponent(center.id)}" class="btn btn-primary btn-sm w-full text-xs font-semibold py-2 text-center flex items-center justify-center gap-1">
             केंद्र देखें (View Center) &rarr;
           </a>`;

      return `
        <div class="card p-5 bg-white border border-slate-200 hover:border-emerald-500 transition-all flex flex-col justify-between shadow-xs">
          <div>
            <!-- Card Header: Title & Load Badge -->
            <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
              <span class="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                ${center.id}
              </span>
              ${loadBadge}
            </div>

            <h3 class="text-base font-bold text-slate-900 leading-snug">
              ${center.name}
            </h3>

            <p class="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span>${center.district}, ${center.state}</span>
            </p>

            <!-- Commodity Tag -->
            <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-500">मुख्य फसल (Crop):</span>
              <span class="font-semibold text-slate-800">${commodity}</span>
            </div>

            <!-- Demo Operational Data Indicators -->
            <div class="mt-3 bg-slate-50 rounded p-2.5 space-y-1.5 border border-slate-150">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-500">अनुमानित प्रतीक्षा (Wait):</span>
                <span class="font-bold text-slate-800">~${center.estimatedWaitMinutes} मिनट</span>
              </div>
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-500">वर्तमान कतार (Queue):</span>
                <span class="font-medium text-slate-700">${center.currentQueueVehicles} वाहन</span>
              </div>
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-500">दैनिक क्षमता (Capacity):</span>
                <span class="font-medium text-slate-700">${center.dailyCapacity || (center.dailyCapacityMT + ' MT')}</span>
              </div>
              <div class="pt-1 border-t border-slate-200 text-right">
                <span class="text-[10px] text-amber-700 font-medium px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200 inline-block">
                  डेमो डेटा • Demo Data
                </span>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100">
            ${buttonHtml}
          </div>
        </div>
      `;
    },

    /**
     * Display an accessible temporary modal notification
     */
    showInfoModal(title, message) {
      const existing = document.getElementById("farmer-info-modal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "farmer-info-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm";
      modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 transform transition-all animate-in fade-in zoom-in-95">
          <div class="w-12 h-12 rounded-full bg-emerald-50 text-[#15803d] flex items-center justify-center mb-4 mx-auto">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 text-center mb-2">
            ${title}
          </h3>
          <div class="text-xs sm:text-sm text-slate-600 text-center leading-relaxed mb-6">
            ${message}
          </div>
          <button type="button" id="close-info-modal-btn" class="btn btn-primary w-full py-2.5 font-semibold text-sm">
            ठीक है (Understood)
          </button>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById("close-info-modal-btn").addEventListener("click", () => {
        modal.remove();
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
      });
    },

    /**
     * Safely format a profile field value
     */
    formatValue(val) {
      if (val === null || val === undefined || String(val).trim() === "") {
        return `<span class="text-slate-400 italic">उपलब्ध नहीं (Not provided)</span>`;
      }
      return `<span class="text-slate-800 font-semibold">${val}</span>`;
    }
  };

  // Export to global window object
  window.FarmerPortal = FarmerPortal;
})();

/**
 * KisanSetu — Reusable Utility Helpers
 * Standardized utility functions for formatting, UI states, and queue calculations.
 */

const KisanUtils = {
  /**
   * Format numerical amounts into Indian Rupee (INR) representation.
   * Example: 2275 -> "₹2,275"
   */
  formatINR(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "₹0";
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  },

  /**
   * Format ISO date string into readable Indian calendar format.
   * Example: "2026-09-05" -> "05 Sep 2026"
   */
  formatDate(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  },

  /**
   * Format minutes into readable human duration.
   * Example: 140 -> "2h 20m", 45 -> "45m"
   */
  formatDuration(minutes) {
    if (minutes === null || minutes === undefined || isNaN(minutes)) {
      return "0m";
    }
    const mins = Math.max(0, Math.floor(minutes));
    if (mins < 60) {
      return `${mins}m`;
    }
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  },

  /**
   * Return corresponding CSS badge class and label for procurement center queue load.
   */
  getLoadBadgeDetails(status) {
    const normalized = (status || "").toLowerCase();
    switch (normalized) {
      case "low":
        return { label: "Low Load", badgeClass: "badge-low" };
      case "medium":
        return { label: "Medium Load", badgeClass: "badge-medium" };
      case "high":
        return { label: "High Load", badgeClass: "badge-high" };
      default:
        return { label: "Normal", badgeClass: "badge-info" };
    }
  },

  /**
   * Debounce helper for search inputs and rapid UI events.
   */
  debounce(func, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  },

  /**
   * HTML string sanitization helper to prevent XSS.
   */
  escapeHtml(str) {
    if (typeof str !== "string") return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Check whether a procurement center is accepting new farmer slot bookings.
   * Reads from kisansetu_center_config.
   * Preserves existing default behavior if no config exists.
   * Returns false when status is 'paused', 'maintenance', 'closed', or acceptingBookings is false.
   * Returns true only when status is 'active' AND acceptingBookings is true.
   */
  isCenterAcceptingBookings(centerId) {
    if (!centerId) return false;
    try {
      const cleanId = String(centerId).trim().toUpperCase();
      if (typeof localStorage === "undefined") return true;
      const raw = localStorage.getItem("kisansetu_center_config");
      if (!raw) return true;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return true;
      const config = parsed[cleanId];
      if (!config) return true;

      const status = String(config.operationalStatus || "active").trim().toLowerCase();
      const accepting = typeof config.acceptingBookings === "boolean" ? config.acceptingBookings : true;

      if (status === "paused" || status === "maintenance" || status === "closed" || accepting === false) {
        return false;
      }

      return status === "active" && accepting === true;
    } catch (e) {
      console.warn("KisanUtils: Error reading center availability config, falling back cleanly.", e);
      return true;
    }
  },

  /**
   * Retrieve standardized UI status mapping for center availability.
   */
  getCenterAvailability(centerId) {
    const isAvailable = this.isCenterAcceptingBookings(centerId);
    let status = "active";
    let accepting = true;

    try {
      const cleanId = String(centerId || "").trim().toUpperCase();
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem("kisansetu_center_config");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed[cleanId]) {
            const config = parsed[cleanId];
            status = String(config.operationalStatus || "active").trim().toLowerCase();
            if (typeof config.acceptingBookings === "boolean") {
              accepting = config.acceptingBookings;
            }
          }
        }
      }
    } catch (e) {
      // safe fallback
    }

    let reason = "";
    let labelHindi = "बुकिंग उपलब्ध";
    let labelEnglish = "Booking Available";
    let badgeClass = "bg-emerald-50 text-emerald-800 border-emerald-200";

    if (status === "maintenance") {
      labelHindi = "रखरखाव में";
      labelEnglish = "Under Maintenance";
      reason = "Maintenance";
      badgeClass = "bg-amber-50 text-amber-800 border-amber-200";
    } else if (status === "paused") {
      labelHindi = "केंद्र अस्थायी रूप से बंद";
      labelEnglish = "Center Paused";
      reason = "Paused";
      badgeClass = "bg-amber-50 text-amber-800 border-amber-200";
    } else if (status === "closed") {
      labelHindi = "केंद्र बंद";
      labelEnglish = "Center Closed";
      reason = "Closed";
      badgeClass = "bg-rose-50 text-rose-800 border-rose-200";
    } else if (!accepting) {
      labelHindi = "बुकिंग बंद";
      labelEnglish = "Booking Paused";
      reason = "Booking Paused";
      badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
    }

    return {
      isAvailable,
      status,
      acceptingBookings: accepting,
      reason,
      labelHindi,
      labelEnglish,
      badgeClass
    };
  }
};

// Export to window for vanilla JS browser usage
if (typeof window !== "undefined") {
  window.KisanUtils = KisanUtils;
  window.isCenterAcceptingBookings = KisanUtils.isCenterAcceptingBookings.bind(KisanUtils);
  window.getCenterAvailability = KisanUtils.getCenterAvailability.bind(KisanUtils);
}


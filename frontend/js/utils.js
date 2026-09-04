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
  }
};

// Export to window for vanilla JS browser usage
if (typeof window !== "undefined") {
  window.KisanUtils = KisanUtils;
}


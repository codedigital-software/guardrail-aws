window.GA = window.GA || {};

(function (GA) {
  "use strict";

  GA.KEYS = { settings: "ga_settings" };

  // Soft demand probe — replace with the real Tally form before launch.
  GA.WAITLIST_URL = "https://tally.so/r/KYgGek?ref=aws";

  GA.ENV = {
    PROD: { label: "PRODUCTION", color: "#c0392b", text: "#ffffff" },
    NONPROD: { label: "NON-PRODUCTION", color: "#0b827c", text: "#ffffff" },
    UNKNOWN: { label: "ACCOUNT UNVERIFIED", color: "#5867e8", text: "#ffffff" },
  };

  GA.DEFAULTS = {
    bannerEnabled: true,
    // Show a separate persistent warning when signed in as the root user.
    rootWarningEnabled: true,
    // Account-ID classifications (strings of 12 digits, no separators).
    safeAccounts: [],   // forced NON-PROD (never guarded)
    prodAccounts: [],   // forced PRODUCTION (always guarded)
    // Guarded console actions. Matched (case-insensitive) against a button's
    // own aria-label / value / textContent.
    // Specific labels only — a bare "Delete" matches every Delete button in the
    // Console and would nag constantly. RDS deletion is intentionally omitted:
    // AWS already requires typing "delete me", so native friction covers it.
    guardedActions: [
      { id: "terminate-instances", label: "Terminate", note: "EC2 instance termination" },
      { id: "delete-bucket", label: "Delete bucket", note: "S3 bucket deletion" },
      { id: "delete-function", label: "Delete function", note: "Lambda function deletion" },
    ],
    // Special check: when ANY save/add-rule form is submitted, scan it for
    // 0.0.0.0/0 and warn if present (the "I opened SSH to the world" mistake).
    openCidrCheckEnabled: true,
  };

  GA.getSettings = function () {
    return new Promise(function (resolve) {
      try {
        chrome.storage.sync.get([GA.KEYS.settings], function (res) {
          resolve(Object.assign({}, GA.DEFAULTS, (res && res[GA.KEYS.settings]) || {}));
        });
      } catch (e) {
        resolve(Object.assign({}, GA.DEFAULTS));
      }
    });
  };
})(window.GA);

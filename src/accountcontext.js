// Guardrail (AWS) — account ID + region detection from the Console DOM.
//
// AWS account IDs are not in URLs — they live in the top-right account menu
// (sometimes 12 plain digits, sometimes the xxxx-xxxx-xxxx form). We scrape the
// page for the first 12-digit pattern in nav-like areas, with a body fallback.
// FAIL-SAFE: when the account ID can't be read, the account is treated as
// PRODUCTION (guarded). The user can mark accounts safe/prod from the popup.
window.GA = window.GA || {};

(function (GA) {
  "use strict";

  // Match 12 contiguous digits OR the formatted 4-4-4 variant.
  var ACC_PLAIN = /\b(\d{12})\b/;
  var ACC_DASH = /\b(\d{4})-?(\d{4})-?(\d{4})\b/;

  function fromText(s) {
    if (!s) return null;
    var m = s.replace(/\s+/g, "").match(ACC_DASH);
    if (m) {
      var joined = m[1] + m[2] + m[3];
      if (/^\d{12}$/.test(joined)) return joined;
    }
    var p = s.match(ACC_PLAIN);
    return p ? p[1] : null;
  }

  function scrapeDoc(doc) {
    if (!doc) return null;
    var hints = [
      "[data-testid*='account' i]",
      "[aria-label*='account' i]",
      "[id*='account' i]",
      "nav, header",
    ];
    for (var i = 0; i < hints.length; i++) {
      var nodes = doc.querySelectorAll(hints[i]);
      for (var j = 0; j < nodes.length; j++) {
        var hit = fromText(nodes[j].textContent || "") ||
                  fromText(nodes[j].getAttribute && nodes[j].getAttribute("aria-label") || "") ||
                  fromText(nodes[j].getAttribute && nodes[j].getAttribute("title") || "");
        if (hit) return hit;
      }
    }
    return fromText(doc.body && doc.body.innerText || "");
  }

  function detectAccountId() {
    // Try our own frame first, then walk up parent frames (AWS renders service
    // editors inside same-origin iframes; the account ID lives in the top shell).
    var ours = scrapeDoc(document);
    if (ours) return ours;
    try {
      var w = window;
      while (w.parent && w.parent !== w) {
        w = w.parent;
        var hit = scrapeDoc(w.document);
        if (hit) return hit;
      }
    } catch (e) { /* cross-origin parent — give up, fail-safe to UNKNOWN */ }
    return null;
  }

  function detectRegion() {
    try {
      var u = new URL(location.href);
      var r = u.searchParams.get("region");
      if (r) return r;
      // Some service consoles encode region in the hostname (e.g. s3.<region>.console.aws.amazon.com).
      var host = location.hostname;
      var hm = host.match(/\.([a-z]{2}-[a-z]+-\d+)\./);
      if (hm) return hm[1];
    } catch (e) {}
    return null;
  }

  // Heuristic root-user detection — passive only. AWS displays "<root user>" /
  // "Root user" in the account menu when signed in as root.
  function isRootUser() {
    var t = (document.body && document.body.innerText || "").toLowerCase();
    if (/root\s+user/.test(t)) return true;
    var s = document.querySelector("[data-testid*='root' i],[aria-label*='root user' i]");
    return !!s;
  }

  GA.account = {
    id: detectAccountId,         // 12-digit string or null
    region: detectRegion,
    isRoot: isRootUser,
    // "PROD" | "NONPROD" | "UNKNOWN" (UNKNOWN is treated as PROD downstream)
    classify: function (settings) {
      var acc = detectAccountId();
      if (!acc) return "UNKNOWN";
      var prod = (settings && settings.prodAccounts) || [];
      var safe = (settings && settings.safeAccounts) || [];
      if (safe.indexOf(acc) !== -1) return "NONPROD";
      if (prod.indexOf(acc) !== -1) return "PROD";
      // Default: any account not explicitly marked safe is guarded.
      return "PROD";
    },
    isGuarded: function (settings) {
      return this.classify(settings) !== "NONPROD";
    },
  };
})(window.GA);

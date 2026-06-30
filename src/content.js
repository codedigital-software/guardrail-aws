// Guardrail (AWS) — content bootstrap. Wires the banner, the optional ROOT
// warning, and the guardrails. Re-classifies on SPA navigations so the banner
// updates when the user switches accounts/regions in the same tab.
(function () {
  "use strict";
  var GA = window.GA; if (!GA) return;
  var banner = null, rootBar = null;
  var isTopFrame = window.top === window;

  function render(settings) {
    // Guardrails arm in every frame (clicks fire inside iframes); banner +
    // root warning render only in the top frame to avoid N stacked banners.
    GA.guardrails.apply(GA.account.isGuarded(settings), settings);
    if (!isTopFrame) return;
    var t = GA.account.classify(settings);
    var env = GA.ENV[t] || GA.ENV.UNKNOWN;
    var id = GA.account.id();
    var region = GA.account.region();
    var label = env.label + " · " + (id || "unverified") + (region ? " · " + region : "");

    if (settings.bannerEnabled) {
      if (!banner) {
        banner = document.createElement("div");
        banner.className = "ga-banner";
        document.documentElement.appendChild(banner);
      }
      banner.style.background = env.color; banner.style.color = env.text;
      banner.textContent = label;
    }
    if (settings.rootWarningEnabled && GA.account.isRoot()) {
      if (!rootBar) {
        rootBar = document.createElement("div");
        rootBar.className = "ga-rootbar";
        document.documentElement.appendChild(rootBar);
      }
      rootBar.textContent = "⚠ Signed in as ROOT USER — use an IAM user/role for daily work";
    } else if (rootBar) { rootBar.remove(); rootBar = null; }
  }

  // Popup asks the top frame for the detected account ID. (sendMessage targets
  // the top frame by default, so only register the listener there.)
  if (isTopFrame) {
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      if (msg && msg.type === "ga:account") {
        sendResponse({ id: GA.account.id(), region: GA.account.region(), isRoot: GA.account.isRoot() });
      }
    });
  }

  GA.getSettings().then(function (s) {
    render(s);
    // SPA / pushState awareness AND late-rendered account-menu detection. AWS
    // populates the account ID asynchronously after document_idle, so we also
    // re-render when the scraped ID changes (e.g. null -> 606025553431).
    var lastUrl = location.href;
    var lastAcc = GA.account.id();
    var poke = function () {
      var url = location.href, acc = GA.account.id();
      if (url !== lastUrl || acc !== lastAcc) {
        lastUrl = url; lastAcc = acc;
        GA.getSettings().then(render);
      }
    };
    window.addEventListener("popstate", poke);
    setInterval(poke, 1000);
  });
})();

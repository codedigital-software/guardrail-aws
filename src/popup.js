var KEY = "ga_settings";
var WAITLIST_URL = "https://example.com/guardrail-aws-team-waitlist"; // keep in sync with config.js

function getSettings() {
  return new Promise(function (r) { chrome.storage.sync.get([KEY], function (res) { r((res && res[KEY]) || {}); }); });
}

// Ask the active tab's content script for its detected account ID.
function tabAccount() {
  return new Promise(function (resolve) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs[0];
      if (!tab || !/\.console\.aws\.amazon\.com/.test(tab.url || "") && !/console\.aws\.amazon\.com/.test(tab.url || "")) {
        return resolve({ id: null, onAws: false, url: tab && tab.url });
      }
      try {
        chrome.tabs.sendMessage(tab.id, { type: "ga:account" }, function (resp) {
          resolve({ id: (resp && resp.id) || null, onAws: true, url: tab.url });
        });
      } catch (e) { resolve({ id: null, onAws: true, url: tab.url }); }
    });
  });
}

function classify(id, s) {
  if (!id) return "UNKNOWN";
  if ((s.safeAccounts || []).indexOf(id) !== -1) return "NONPROD";
  if ((s.prodAccounts || []).indexOf(id) !== -1) return "PROD";
  return "PROD"; // fail-safe
}

function render(state) {
  var s = state.settings, id = state.id;
  var el = document.getElementById("cls"), accEl = document.getElementById("acc"), hint = document.getElementById("hint");
  if (!state.onAws) {
    el.textContent = "N/A"; el.className = "pill";
    accEl.textContent = "Not an AWS Console tab.";
    hint.textContent = "Open https://console.aws.amazon.com/ to use Guardrail.";
    return;
  }
  if (!id) {
    el.textContent = "UNVERIFIED"; el.className = "pill unknown";
    accEl.textContent = "Account ID not detected — guarded by default.";
    hint.textContent = "If you trust this account, mark it Non-production.";
    return;
  }
  var t = classify(id, s);
  var map = { PROD: ["PRODUCTION", "prod"], NONPROD: ["NON-PRODUCTION", "nonprod"], UNKNOWN: ["UNVERIFIED", "unknown"] };
  el.textContent = map[t][0]; el.className = "pill " + map[t][1];
  accEl.textContent = id;
  hint.textContent =
    t === "PROD" ? "Guarded: destructive actions are confirmed." :
    t === "NONPROD" ? "Marked safe — not guarded." : "Unknown — guarded.";
}

function mark(listKey, otherKey) {
  tabAccount().then(function (ta) {
    if (!ta.id) return;
    getSettings().then(function (s) {
      s[listKey] = (s[listKey] || []).filter(function (x) { return x !== ta.id; });
      s[listKey].push(ta.id);
      s[otherKey] = (s[otherKey] || []).filter(function (x) { return x !== ta.id; });
      var o = {}; o[KEY] = s;
      chrome.storage.sync.set(o, function () { render({ settings: s, id: ta.id, onAws: true }); });
    });
  });
}

document.getElementById("markprod").addEventListener("click", function () { mark("prodAccounts", "safeAccounts"); });
document.getElementById("marksafe").addEventListener("click", function () { mark("safeAccounts", "prodAccounts"); });
document.getElementById("opts").addEventListener("click", function () { chrome.runtime.openOptionsPage(); });
document.getElementById("waitlist").href = WAITLIST_URL;

Promise.all([getSettings(), tabAccount()]).then(function (r) {
  render({ settings: r[0], id: r[1].id, onAws: r[1].onAws });
});

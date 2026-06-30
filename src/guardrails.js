// Guardrail (AWS) — capture-phase interception of destructive Console clicks.
//
// Two checks fire on a guarded account:
//   (1) Label match — if the clicked control's own label matches a guarded
//       action (Terminate / Delete bucket / Delete / Delete function), prompt.
//   (2) Open-CIDR scan — if the click is a save/add-rule submit AND the form
//       contains 0.0.0.0/0 anywhere, prompt (the "I opened SSH to the world"
//       mistake; AWS only shows a warning icon — it doesn't stop you).
//
// Click events are `composed`, so capture-phase intercepts them before the
// page handler runs and lets us cancel even when controls live in shadow DOM.
// On confirm we replay the click past a bypass flag.
window.GA = window.GA || {};

(function (GA) {
  "use strict";

  var guardActive = false;
  var rules = [];
  var openCidrCheck = true;
  var armed = false;
  var bypass = false;

  var CONTROL = 'button,a,[role="button"],input[type="button"],input[type="submit"]';
  // Submit-style labels we'll scan for 0.0.0.0/0 in the surrounding form.
  var SUBMIT_LABELS = ["save rules", "save", "add rule", "create security group", "update security group"];

  function controlInfo(el) {
    var c = (el.closest && el.closest(CONTROL)) || el;
    var aria = (c.getAttribute && (c.getAttribute("aria-label") || "")) || "";
    var title = (c.getAttribute && (c.getAttribute("title") || "")) || "";
    var val = c.value || "";
    var text = (c.textContent || "").trim();
    return { ctrl: c, candidates: [aria, title, val, text].map(function (s) { return String(s).trim().toLowerCase(); }) };
  }

  function matchRule(info) {
    var href = location.href.toLowerCase();
    for (var i = 0; i < rules.length; i++) {
      // urlMatch scopes a generic label (e.g. bare "Delete") to one service, so
      // it doesn't fire on every Delete button across the Console.
      if (rules[i].urlMatch && href.indexOf(rules[i].urlMatch) === -1) continue;
      var lbl = rules[i].label.toLowerCase();
      // Word-boundary phrase match: the label must appear as whole words in a
      // candidate ("terminate" matches "Terminate instance" but not "determinate";
      // "delete bucket" matches only that phrase, not a bare "Delete").
      var re = new RegExp("(^|[^a-z])" + lbl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z]|$)");
      if (info.candidates.some(function (c) { return re.test(c); })) return rules[i];
    }
    return null;
  }

  function isSubmitLabel(info) {
    return info.candidates.some(function (c) {
      return SUBMIT_LABELS.some(function (s) { return c === s || c.indexOf(s) !== -1; });
    });
  }

  function findOpenCidr(ctrl) {
    var form = ctrl.closest && ctrl.closest("form");
    var scope = form || document;
    // Inputs (visible form state) + visible text in the surrounding container.
    var inputs = scope.querySelectorAll("input,textarea");
    for (var i = 0; i < inputs.length; i++) {
      var v = (inputs[i].value || "").trim();
      if (v === "0.0.0.0/0" || /(^|[^\d])0\.0\.0\.0\/0([^\d]|$)/.test(v)) return v;
    }
    var txt = (scope.textContent || "");
    return /(^|[^\d])0\.0\.0\.0\/0([^\d]|$)/.test(txt) ? "0.0.0.0/0" : null;
  }

  function onClickCapture(e) {
    if (!guardActive || bypass) return;
    var info = controlInfo(e.target);

    var hit = matchRule(info);
    if (hit) { return prompt(e, info.ctrl, hit, null); }

    if (openCidrCheck && isSubmitLabel(info)) {
      var cidr = findOpenCidr(info.ctrl);
      if (cidr) {
        return prompt(e, info.ctrl,
          { label: "Open to the internet", note: "this rule allows traffic from 0.0.0.0/0" },
          cidr);
      }
    }
  }

  function prompt(e, ctrl, rule, extra) {
    e.preventDefault();
    e.stopImmediatePropagation();
    confirmModal(rule, extra).then(function (ok) {
      if (!ok) return;
      bypass = true;
      try { ctrl.click(); } finally { bypass = false; }
    });
  }

  function confirmModal(rule, extra) {
    var acc = (window.GA.account && window.GA.account.id()) || "unverified";
    return new Promise(function (resolve) {
      var ov = document.createElement("div");
      ov.className = "ga-overlay";
      var extraLine = extra ? '<br><br>Detected: <code>' + esc(extra) + '</code>' : '';
      ov.innerHTML =
        '<div class="ga-modal" role="alertdialog" aria-modal="true">' +
        '  <div class="ga-modal-head">⚠ Account <b>' + esc(acc) + '</b> · treated as PRODUCTION</div>' +
        '  <div class="ga-modal-body"><b>' + esc(rule.label) + '</b><br>' + esc(rule.note || "") + '.' + extraLine + '<br><br>' +
        '  This action runs against live infrastructure. There is usually no undo.</div>' +
        '  <div class="ga-modal-btns">' +
        '    <button class="ga-cancel">Cancel</button>' +
        '    <button class="ga-confirm">Run on PRODUCTION</button>' +
        '  </div>' +
        '</div>';
      document.body.appendChild(ov);
      function done(v) { ov.remove(); resolve(v); }
      ov.querySelector(".ga-cancel").addEventListener("click", function () { done(false); });
      ov.querySelector(".ga-confirm").addEventListener("click", function () { done(true); });
      ov.addEventListener("click", function (e) { if (e.target === ov) done(false); });
      document.addEventListener("keydown", function esc(e) {
        if (e.key === "Escape") { document.removeEventListener("keydown", esc); done(false); }
      });
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  GA.guardrails = {
    apply: function (isGuardedAccount, settings) {
      guardActive = !!isGuardedAccount;
      rules = (settings && settings.guardedActions) || [];
      openCidrCheck = !settings || settings.openCidrCheckEnabled !== false;
      if (!armed) { document.addEventListener("click", onClickCapture, true); armed = true; }
    },
  };
})(window.GA);

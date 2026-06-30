var KEY = "ga_settings";
var DEFAULTS = {
  bannerEnabled: true,
  rootWarningEnabled: true,
  openCidrCheckEnabled: true,
  safeAccounts: [],
  prodAccounts: [],
  guardedActions: [
    { id: "terminate-instances", label: "Terminate", note: "EC2 instance termination" },
    { id: "delete-bucket", label: "Delete bucket", note: "S3 bucket deletion" },
    { id: "delete-function", label: "Delete", note: "Lambda function deletion", urlMatch: "/lambda/" },
  ],
};

var lines = function (v) { return (v || "").split("\n").map(function (s) { return s.trim(); }).filter(Boolean); };
var digits = function (s) { return s.replace(/\D/g, ""); };

function load() {
  chrome.storage.sync.get([KEY], function (res) {
    var s = Object.assign({}, DEFAULTS, res[KEY] || {});
    document.getElementById("bannerEnabled").checked = s.bannerEnabled;
    document.getElementById("rootWarningEnabled").checked = s.rootWarningEnabled;
    document.getElementById("openCidrCheckEnabled").checked = s.openCidrCheckEnabled;
    document.getElementById("prodAccounts").value = (s.prodAccounts || []).join("\n");
    document.getElementById("safeAccounts").value = (s.safeAccounts || []).join("\n");
    document.getElementById("guardedActions").value = (s.guardedActions || []).map(function (a) { return a.label; }).join("\n");
  });
}

document.getElementById("save").addEventListener("click", function () {
  var prod = lines(document.getElementById("prodAccounts").value).map(digits).filter(function (x) { return x.length === 12; });
  var safe = lines(document.getElementById("safeAccounts").value).map(digits).filter(function (x) { return x.length === 12; });
  var actions = lines(document.getElementById("guardedActions").value).map(function (label) {
    // Preserve note + urlMatch scoping for labels that match a known default.
    var def = DEFAULTS.guardedActions.filter(function (a) { return a.label.toLowerCase() === label.toLowerCase(); })[0];
    var a = { id: label.toLowerCase().replace(/\s+/g, "-"), label: label, note: (def && def.note) || "guarded action" };
    if (def && def.urlMatch) a.urlMatch = def.urlMatch;
    return a;
  });
  var s = {
    bannerEnabled: document.getElementById("bannerEnabled").checked,
    rootWarningEnabled: document.getElementById("rootWarningEnabled").checked,
    openCidrCheckEnabled: document.getElementById("openCidrCheckEnabled").checked,
    prodAccounts: prod, safeAccounts: safe,
    guardedActions: actions.length ? actions : DEFAULTS.guardedActions,
  };
  var o = {}; o[KEY] = s;
  chrome.storage.sync.set(o, function () {
    var el = document.getElementById("saved"); el.style.display = "inline";
    setTimeout(function () { el.style.display = "none"; }, 1500);
  });
});

load();

# Guardrail for AWS Console (v0.1.0)

A Manifest V3 browser extension that confirms before destructive AWS Console
actions on **production accounts**, plus a persistent account banner and a root-
user warning. Chrome + Edge. For developers, SREs, and cloud admins.

**v0 is a free, open-source demand-validation instrument.** No backend, no
account, no telemetry, no Stripe. The goal is to learn whether people want
behavioral cloud-console guardrails before adding a paid team tier.

## Why this, and why only these actions
AWS already has *piecemeal* friction on some deletes (S3 type-to-confirm, RDS
"delete me", deletion-protection flags). Guardrail adds uniform, **account-
aware** friction where AWS has none:

| Guarded action | Service | Why |
|---|---|---|
| **Terminate Instance(s)** | EC2 | AWS adds no confirmation |
| **Delete bucket** | S3 | AWS confirms, but not account-aware |
| **Delete** (DB) | RDS | Catastrophic blast radius |
| **Delete function** | Lambda | Single-click in older UIs |
| **`0.0.0.0/0` security-group rule** | EC2 | AWS shows an icon, doesn't stop you |

Plus a passive **"Signed in as ROOT USER"** banner.

## How it works
- **Account detection (fail-safe):** scrapes the 12-digit account ID from the
  Console DOM. Unknown accounts are treated as **production and guarded**. The
  user marks dev/test accounts safe from the popup (one click), per account ID.
- **Interception:** a single capture-phase document click listener catches the
  guarded controls before the page handler runs; the modal names the account ID
  and a Cancel/Confirm pair. On confirm the click is replayed past a bypass flag.
- **Open-CIDR check:** when any Save/Add-rule submit button is clicked, the
  surrounding form is scanned for `0.0.0.0/0` — if present on a guarded account,
  the modal warns specifically.
- **No backend, no network requests, no remote code, no cookie access.**

## Privacy posture
This extension does **not** transmit anything. It reads the AWS account ID from
the page DOM (no cookie access), keeps your settings in `chrome.storage`, and
makes zero network requests to any server. Source on GitHub. MIT.

## Project layout
```
manifest.json            MV3 (hosts: *.console.aws.amazon.com, console.aws.amazon.com)
build.sh                 produces Chrome + Edge zips
src/
  config.js              settings + defaults + waitlist URL
  accountcontext.js      account-ID + region detection from DOM (fail-safe)
  guardrails.js          capture-phase intercept + 0.0.0.0/0 form scan + confirm modal
  content.js             bootstrap + PROD banner + root warning + SPA navigation poke
  content.css            banner + modal styles
  popup.html/.js         current account, mark prod/safe, team-version waitlist link
  options.html/.js       account lists, guarded actions, toggles
icons/                   shield icons (shared portfolio art)
```

## Load & test
1. `chrome://extensions` → Developer mode → **Load unpacked** → this folder.
2. Open any `*.console.aws.amazon.com` page → the red **PRODUCTION** banner
   shows the detected account ID + region (every account is guarded by default).
3. Click **Terminate Instance** in EC2 → confirmation modal naming the account.
4. In **EC2 → Security Groups**, edit inbound rules to add `0.0.0.0/0` → click
   **Save rules** → modal warns.
5. In the popup, click **Mark this account as Non-production** to silence
   guarding for your dev account.

## Build
```bash
./build.sh   # -> dist/guardrail-aws-chrome.zip and dist/guardrail-aws-edge.zip
```

## Validation plan (the point of v0)
1. Ship free + open-source to Chrome + Edge.
2. Launch posts: r/aws, r/devops, r/sre, Hacker News.
3. Measure installs, ratings, GitHub stars over ~4–6 weeks.
4. The popup's **"Want a team version?"** link points at a waitlist — signups
   (especially team-size answers) are the willingness-to-pay signal.

## What this is NOT
- Not CLI/API protection. Browser-only. A determined fat-finger via `aws-cli`
  is unaffected — this catches Console clicks.
- Not a replacement for SCPs, MFA-delete, deletion protection. Use those *and*
  this; they're authorization-layer, this is click-time friction.
- Not multi-account or cross-account. Single tab, single account.

## TODO before launch
- [ ] Replace `WAITLIST_URL` (config.js + popup.js) with a real Tally form.
- [ ] Real-AWS smoke test on a personal account: banner reads correctly, the
      5 destructive actions all trigger the modal, 0.0.0.0/0 check fires on
      Security Group save.
- [ ] Store listing + reviewer notes + screenshots.
- [ ] Security statement in README (zero-network claim is the trust pitch).
```

# Guardrail for AWS Console — launch kit

This is the v0 demand experiment. The free + OSS shape exists to clear the
enterprise trust bar; the Tally waitlist link in the popup is the WTP probe
for a future paid team-policy tier. Watch installs + GitHub stars + waitlist
signups (team-size answers are the buyer signal).

---

## Reddit launch post — r/aws (also adaptable for r/devops, r/sre)

**Title:** Built a free open-source extension that confirms before destructive AWS Console actions on prod accounts

We've all seen the postmortem (or written it): wrong account in the tab, one wrong click. AWS already has *some* friction — S3 makes you type the bucket name, RDS has the "delete me" thing — but it's patchwork, and none of it is account-aware. Terminate Instance fires immediately. A security-group rule with 0.0.0.0/0 gets a warning icon, not a stop sign.

So I made Guardrail for AWS Console (free, MIT, source on GitHub): on a guarded account, clicking Terminate Instance / Delete Bucket / Delete (DB) / Delete Function pops a confirm dialog naming the account. Save rules / Add rule scans the form for 0.0.0.0/0 and warns specifically if present. There's also a Prod/Non-prod banner and a separate ROOT-user warning.

How it stays sane:
- Reads the account ID **from the page DOM**, not from your session cookie (no cookies permission).
- **Zero network requests.** No backend, no telemetry, no remote code.
- MIT, source available, no paid tier in v0.
- Treats every account as PROD by default (fail-safe); you mark dev accounts safe in the popup.

Doesn't catch CLI/API fat-fingers — it's browser-only. Use SCPs, MFA-delete, deletion protection too; this is click-time friction on top.

Disclosure: I built it. Genuinely after feedback — **which Console actions do you most wish had a "this is PROD, you sure?" step?**

*(links in comments)*

---

## Show HN

**Title:** Show HN: Guardrail – a free browser extension that adds confirm dialogs to destructive AWS Console clicks

The AWS Console has uneven friction on destructive actions. S3 makes you type the bucket name; RDS asks for "delete me"; EC2 Terminate Instance fires on click. A security-group rule with 0.0.0.0/0 gets a yellow icon but doesn't stop you. None of these are account-aware, so the same friction applies in your dev account and your prod account — which doesn't help when the problem is wrong-tab.

Guardrail intercepts the click on a configurable set of destructive Console actions (Terminate, Delete bucket / DB / function) and scans Save-rules forms for 0.0.0.0/0. On guarded accounts the click is held while a confirm dialog names the account. Default is fail-safe: every account is guarded until you mark it Non-production.

Trust posture:
- MIT, source: https://github.com/codedigital-software/guardrail-aws
- Reads the account ID from page DOM. Doesn't touch your session cookie (no `cookies` permission).
- Zero network requests. No backend, no telemetry, no remote code.
- Permissions: just `storage` + `console.aws.amazon.com` + subdomains.

What it doesn't do (deliberately):
- Doesn't protect CLI/API actions. Browser-only.
- Doesn't replace SCPs / MFA-delete / deletion protection. Use those AND this.
- Doesn't go cross-account or multi-tab.

The research I did before building flagged two failure modes I'm worried about — AWS shipping native uniform click-time confirms (December re:Invent risk) and enterprise security teams blocking third-party extensions touching the Console after the December 2024 Cyberhaven incident. The OSS-and-zero-network shape is the answer to the second one. The first I can't do anything about except ship fast and validate.

The popup has a "team version waitlist" link — that's how I'm trying to learn if there's a paid org-wide policy tier worth building. Roast it.

---

## Demo script (~20s)

Record with ScreenToGif (Windows, free). Captions ~4 words. Export GIF or short MP4.

| t | Shot | Caption |
|---|---|---|
| 0–3s | EC2 Instances list, red PROD banner at top showing "PRODUCTION · 123…012 · us-east-1" | "Prod AWS account." |
| 3–6s | Select instance → Instance state → Terminate instance | — |
| 6–11s | Guardrail modal: "Account 123…012 · treated as PRODUCTION — Terminate" (pause on it) | "Stops the click." |
| 11–13s | Click Cancel | "Crisis averted." |
| 13–18s | Cut to Security Groups → edit inbound rule, add 0.0.0.0/0, click Save rules → modal shows "Open to the internet · Detected: 0.0.0.0/0" | "Catches `0.0.0.0/0` too." |
| 18–20s | End card: name + "Free + open source" | — |

Alt 10s variant (Twitter/X): just the EC2 Terminate beat, end card.

---

## Posting rules + venue notes
- **r/aws**: Put links in the FIRST COMMENT, not the body (auto-filter, less spammy). Active mod culture; read the wiki before posting. Tag with the appropriate flair if available.
- **r/devops**: Tools posts welcome if value-first; weekly threads sometimes exist — check before standalone post.
- **r/sre**: Smaller, more technical; framing should lead with the failure mode, not the product.
- **Show HN**: title MUST start "Show HN:". Be honest about limitations in the body (HN punishes overclaiming). The line about CLI not being covered is a feature, not a bug — adds credibility.
- **Don't blast all venues the same day** from the same account. Reasonable spacing: HN first (highest leverage, sets the narrative), r/aws ~24h later if HN engaged, r/devops/r/sre after that.
- **Engage in replies** — answering "does it handle X?" earns the first reviews and GitHub stars, which the next wave of readers see.

## Also worth posting to (lower priority)
- "Last Week in AWS" newsletter (Corey Quinn) — submit via newsletter@lastweekinaws.com; they cover free OSS tools.
- AWS Community Builders Slack/Discord groups.
- LinkedIn — even though you've said it's not an option for you; left here for completeness.

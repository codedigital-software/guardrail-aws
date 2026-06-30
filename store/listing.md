# Chrome Web Store / Edge — listing copy (Guardrail for AWS Console)

Free, open-source (MIT) extension — no paid tier in v0. Lengths within store limits.

## Name (max 75 chars)
Guardrail for AWS Console

## Summary / short description (max 132 chars)
Confirm before destructive AWS Console actions on production accounts — Terminate, Delete bucket/DB/Function, 0.0.0.0/0 rules.

## Category
Developer Tools

## Search terms (Edge — up to 7)
AWS
AWS Console
AWS production
fat finger
EC2 terminate
delete bucket
security group

## Detailed description
A safety net for developers, SREs, and cloud admins who switch between AWS accounts all day.

The AWS Console has *some* friction on destructive actions (typing a bucket name to delete S3, the "delete me" confirmation on RDS) — but it's piecemeal, and it isn't account-aware. Nothing stops you from terminating an EC2 instance in production with a single click because you thought you were in dev. Nothing warns you that the security-group rule you're about to save opens SSH to 0.0.0.0/0 on a prod account.

Guardrail adds uniform, account-aware confirmation on the AWS Console actions that AWS doesn't.

WHAT IT DOES
• Confirm-before-action — on a guarded account, clicking Terminate Instance, Delete Bucket, Delete (DB), or Delete Function pops a confirmation that names the account.
• 0.0.0.0/0 form scan — when you click Save rules / Add rule, the form is scanned for 0.0.0.0/0; if present, the modal warns specifically.
• PROD account banner — the detected account ID + region across the top of every Console page, color-coded.
• Root-user warning — a separate prominent bar when you're signed in as the root user.
• Configurable rules — add your own button labels to guard, mark accounts as production or non-production from the popup.

PRIVACY
Guardrail runs entirely on your device. It has no backend, no account, no telemetry — it makes zero network requests. The AWS account ID is read from the page DOM (NOT from your session cookie); your AWS resources, credentials, and session data never leave your browser. All code is bundled — no remote code. Source on GitHub.

Full policy: https://codedigital-software.github.io/legal/guardrail-aws-privacy.html

Not affiliated with or endorsed by Amazon Web Services. AWS is a trademark of Amazon.com, Inc.

## Single purpose (privacy practices tab)
Guardrail warns AWS Console users before destructive actions on production accounts: confirmation prompts on Terminate Instance, Delete Bucket, Delete DB, Delete Function, and security-group rules that open 0.0.0.0/0, plus a PROD account banner and a root-user warning.

## Permission justifications (privacy practices tab)
- storage: Stores the user's account classifications (which 12-digit AWS account IDs are production vs non-production), guarded-action labels, and display preferences locally. Synced by the browser, not by us.
- Host access to console.aws.amazon.com and *.console.aws.amazon.com: Content scripts display the environment banner and the confirmation dialog on the user's AWS Console pages. No other origins are accessed.
- Remote code: No. All code is bundled in the package; nothing is fetched and executed at runtime.

## Data usage disclosures
- The extension collects and transmits NOTHING. No account, no backend, no analytics, no telemetry. Do not check any data-collection category.
- The AWS account ID is read from the page DOM (not from cookies) and used only locally to classify the account against the user's prod / safe lists.
- I do not sell or transfer user data (there is none).

## Notes for certification (reviewer-facing, <2000 chars)
WHAT IT DOES
Guardrail shows a confirmation dialog before destructive actions in the AWS Console — Terminate Instance (EC2), Delete bucket (S3), Delete (RDS), Delete function (Lambda), and security-group rules that allow 0.0.0.0/0. Also shows a Production/Non-production account banner and a warning when signed in as the root user. Runs only on console.aws.amazon.com and its subdomains.

HOW TO TEST
You need an AWS account. The AWS Free Tier (https://aws.amazon.com/free) is sufficient — no resources need to actually exist; the guardrail intercepts the button click before AWS processes it. There is NO paid tier, NO account, and NO backend in this extension; "Dev: simulate Pro" toggles do not apply here.

By design, EVERY AWS account is treated as PRODUCTION (guarded) on first install — this is the fail-safe default. To test:
1. Open https://console.aws.amazon.com and sign in.
2. The extension banner at the top shows PRODUCTION + your account ID.
3. Go to EC2 > Instances. Click "Instance state" > "Terminate instance" (you can do this on a zero-instance account; the click is intercepted before AWS sees it). A confirmation dialog appears naming the account. Cancel aborts it.
4. Same flow works on S3 (Delete bucket), RDS, Lambda.
5. In EC2 > Security Groups, edit any group's inbound rules, add 0.0.0.0/0 as a source, click "Save rules" — modal warns specifically about the open CIDR.
6. To stop guarding a dev account, open the extension popup and click "Mark this account as Non-production".

PRIVACY: zero network requests, no cookie access (account ID is read from the page DOM, not the session cookie). All code is bundled, MIT-licensed, source at https://github.com/codedigital-software/guardrail-aws. Policy: https://codedigital-software.github.io/legal/guardrail-aws-privacy.html

## Assets needed before submit
- Screenshots (1280x800): the red PRODUCTION banner on an EC2 page, the Terminate confirmation modal, the 0.0.0.0/0 security-group warning. (In store/screenshots/.)
- Replace WAITLIST_URL (config.js + popup.js) with a real Tally form.
- Privacy policy URL (above) is live and always-on.

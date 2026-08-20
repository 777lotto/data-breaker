# Threat model

## Assets

- Names, aliases, dates of birth, addresses, emails, and phone numbers.
- Requester identity and authorization evidence.
- Browser sessions, confirmation links, and future mailbox credentials.
- Submission receipts and broker response history.

## Trust boundaries

1. Local configuration enters the trusted core.
2. Declarative adapters request individual semantic fields.
3. The browser transmits selected values to declared domains.
4. External broker pages and their resources are untrusted.
5. Repository contributions and dependency updates are untrusted until reviewed.

## Primary threats and controls

### Malicious or compromised adapter

An adapter could attempt to navigate to an attacker domain or request
unnecessary fields.

Controls:

- Declarative workflows instead of arbitrary adapter code.
- Semantic field injection rather than complete profile access.
- Manifest validation and per-adapter domain allowlists.
- Human-readable plans and minimum-field review.
- Tests for destinations and submission checkpoints.

### Accidental PII disclosure

Values could leak through logs, URLs, screenshots, fixtures, errors, or issue
reports.

Controls:

- Safe summaries and URL sanitization.
- No screenshots, traces, videos, or storage by default.
- Synthetic fixtures and `.invalid` addresses.
- Ignored local profiles, receipts, artifacts, and state directories.
- Contribution and issue templates that prohibit PII.

### Duplicate or unintended submission

A crash or selector change could produce an uncertain outcome or click the
wrong control.

Controls:

- Explicit submission checkpoints.
- Accessible role and label locators.
- Playwright actionability checks.
- No automatic retry after an unknown submission outcome.
- Future persistent state must distinguish prepared, submitted, unknown, and
  confirmed outcomes.

### CAPTCHA or identity-control bypass

Automation could improperly evade a service control or misrepresent a subject.

Controls:

- Known CAPTCHA detection and manual checkpoints.
- No CAPTCHA-solving services.
- Interactive login, MFA, residency verification, and identity upload.
- Separate requester capacity and authorization metadata.

### External page exfiltration

A broker page can intentionally or accidentally send entered data to third
parties.

Controls:

- All network destinations require manifest declaration.
- Production traffic requires HTTPS.
- Plans display broker destinations before execution.
- New resource domains require adapter review.

## Out of scope for the foundation

- Persistent encrypted state.
- Mailbox integrations and confirmation-link automation.
- Identity-document upload.
- Live broker submissions.
- Plugin execution or untrusted imperative adapter code.

Each feature must update this threat model before implementation.

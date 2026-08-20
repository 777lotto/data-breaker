# Privacy

`data-breaker` is designed to keep personal information on the user's device.

## Current behavior

- No telemetry or analytics are collected.
- Profile values are read from the current process environment or a selected
  local environment file.
- Execution plans contain semantic field names, not their values.
- CLI profile output contains only a local subject ID, jurisdiction, requester
  capacity, and collection counts.
- The runner creates an isolated browser context and closes it after a run.
- Screenshots, videos, traces, and browser storage are not retained.
- The foundation release does not connect to mailboxes or persist receipts.

## Network behavior

Each adapter declares navigation and resource domains. The browser runner blocks
HTTP requests outside that allowlist. Production adapters must use HTTPS.

Submitting a real request necessarily discloses selected profile fields to the
declared broker or privacy-service domains. The execution plan must be reviewed
before that occurs.

## Repository and support channels

Do not commit `.env` files, private profiles, state directories, receipts,
screenshots, traces, or logs. The repository ignores their standard locations,
but ignore rules are not a substitute for review.

Do not post personal information in GitHub issues, discussions, pull requests,
or security reports. Use synthetic `.invalid` email addresses and reserved
example phone numbers in tests.

## Future storage

Persistent run state, receipts, and mailbox integrations will require a separate
security review. Raw PII must remain excluded from ordinary logs and journals,
and sensitive state must use strict permissions and protected storage.

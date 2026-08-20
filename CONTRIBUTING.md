# Contributing

Thank you for helping make personal-data removal more accessible and reliable.

## Before contributing

Read:

- [RESPONSIBLE_USE.md](RESPONSIBLE_USE.md)
- [PRIVACY.md](PRIVACY.md)
- [THREAT_MODEL.md](THREAT_MODEL.md)
- [Adapter authoring](docs/adapter-authoring.md)

Never include real personal information, authentication material, mailbox
content, identity documents, broker receipts, unredacted screenshots, or
browser traces in a contribution.

## Branch workflow

- `bet` is production.
- `bluff` is integration.
- Create a focused branch from `bluff`.
- Open a pull request back to `bluff`.
- Promotion from `bluff` to `bet` is a release operation.

## Local checks

```sh
npm install
npm run check
npm run build
```

The end-to-end test binds only to loopback and uses a synthetic `.invalid`
email address.

## Adapter contributions

An adapter pull request must include:

- A manifest with source URLs, jurisdiction, policy basis, and verification
  date.
- The minimum semantic fields required by the form.
- Explicit navigation and resource domains.
- A submission checkpoint before any destructive click.
- Sanitized DOM fixtures or a local reproduction; no copied user data.
- Tests for planning, domain policy, and expected checkpoints.
- A note describing CAPTCHA, email, identity, and authorized-agent behavior.

An adapter is not marked `automatic` solely because it can click a submit
button. Its policy, verification, retry, and failure behaviors must also be
understood.

## Reporting broken adapters

Use the broken-adapter issue form and include public URLs, observed labels, and
redacted errors. Do not attach a completed form, screenshot containing PII, or
confirmation email.

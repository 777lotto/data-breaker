# data-breaker

Local-first automation for submitting and tracking personal-data deletion,
suppression, and opt-out requests.

> [!IMPORTANT]
> `data-breaker` is in its foundation stage. The only included adapter targets a
> synthetic broker running on localhost. It does not yet submit requests to real
> data brokers.

## Highlights

- Validated subject and requester profiles loaded from environment variables.
- Separate identities for self-service, authorized-agent, and guardian requests.
- Declarative broker workflows that request semantic fields instead of receiving
  an entire private profile.
- Jurisdiction-aware planning, with Georgia (`US-GA`) first in the development
  queue.
- Explicit submission checkpoints and CAPTCHA detection.
- Per-adapter network allowlists.
- No telemetry and no PII in plans, logs, tests, or repository fixtures.
- Playwright behind an internal runner boundary; adapters do not import browser
  automation APIs.

## Requirements

- Node.js 20.19 or newer
- npm
- Google Chrome for the local fixture, or a Playwright-managed Chromium build

## Quick start

Install dependencies and create a local environment file containing only the
repository's synthetic profile:

```sh
npm install
cp .env.example .env
npm run typecheck
npm run test:unit
```

Start the local synthetic broker:

```sh
npm run fixture
```

In another terminal, validate the profile and inspect the execution plan:

```sh
npm run dev -- profile validate
npm run dev -- plan
```

Run the workflow without submission approval:

```sh
npm run dev -- run
```

The command fills the local form, stops at the submission checkpoint, returns
`action-required`, and exits with status 2. The synthetic fixture can be
submitted explicitly:

```sh
npm run dev -- run --approve-submit
```

No step in this quick start contacts a real broker.

## Commands

- `data-breaker doctor` checks the runtime, profile, adapter, and browser.
- `data-breaker profile validate` validates input and prints only safe counts and
  identifiers.
- `data-breaker plan` shows destinations, semantic fields, policy basis, and
  checkpoints without printing field values.
- `data-breaker run` executes an adapter and stops before submission by default.
- `data-breaker run --approve-submit` crosses submission checkpoints for the
  selected adapter.

Use `--env-file PATH` to select a private environment file and `--adapter PATH`
to select a manifest.

## Safety model

Real broker support must preserve these rules:

- A user may act only for themselves or someone who explicitly authorized them.
- The planner shows the destination and semantic fields before execution.
- Production adapter URLs use HTTPS.
- Navigation and resource domains must be declared.
- Destructive clicks require a preceding submission checkpoint.
- CAPTCHA, MFA, identity verification, and document upload require interactive
  user participation.
- Unknown submission outcomes are never automatically retried.
- Broker responses are not reported as successful deletion until confirmed.

See [PRIVACY.md](PRIVACY.md), [RESPONSIBLE_USE.md](RESPONSIBLE_USE.md), and
[THREAT_MODEL.md](THREAT_MODEL.md).

## Georgia-first development

Georgia is the first jurisdiction implementation. Initial real adapters will
target published, voluntary, or nationwide removal processes available to
Georgia residents.

Georgia SB 111 was introduced with consumer-privacy language, but that language
did not survive in the enacted act. The final bill addresses rural-hospital tax
credits, so this project must not cite SB 111 as a Georgia deletion right. See
[the Georgia research note](docs/georgia.md).

## Project layout

```text
data-breaker/
├── .github/                  # CI and contribution templates
├── adapters/                # declarative broker manifests and workflows
├── docs/                    # architecture and authoring references
├── scripts/                 # development utilities
├── src/
│   ├── adapters/            # adapter schemas and loading
│   ├── browser/             # guarded Playwright execution
│   ├── cli/                 # command-line entry point
│   ├── config/              # profile schemas and environment loading
│   ├── core/                # semantic fields and execution plans
│   └── security/            # redaction helpers
└── tests/                   # synthetic unit and browser fixtures
```

## Branch and release model

- `bet` is the production/default branch.
- `bluff` is the persistent integration branch.
- Focused branches merge into `bluff`.
- Releases promote `bluff` into `bet`.
- Signed `vX.Y.Z` tags identify releases.

## Contributing

Contributions are welcome once the initial public repository is available.
Never put real personal information in an issue, fixture, trace, screenshot,
commit, or pull request. Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing
a broker adapter.

## License

`data-breaker` is available under the [MIT License](LICENSE).

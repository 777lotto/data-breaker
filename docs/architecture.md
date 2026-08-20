# Architecture

## Data flow

```text
environment/profile
        |
        v
validated subject + requester
        |
        v
jurisdiction-aware execution plan
        |
        v
declarative adapter workflow
        |
        v
guarded browser runner
        |
        +--> submission/CAPTCHA/identity checkpoint
        |
        v
sanitized outcome
```

## Components

### Profile configuration

`src/config/profile.ts` defines the canonical subject and requester schemas and
loads environment variables. It validates data before an adapter is loaded.

### Semantic fields

`src/core/fields.ts` is the only foundation component that resolves semantic
keys such as `subject.primaryEmail` into private values. Adapters see field keys,
not profile objects.

### Adapter schema

`src/adapters/schema.ts` validates broker metadata, workflow steps, domains,
jurisdictions, policy basis, and submission checkpoints.

### Planner

`src/core/plan.ts` checks jurisdiction compatibility and required profile fields.
Its output contains no field values.

### Browser runner

`src/browser/runner.ts` interprets validated steps through Playwright. Browser
automation is kept behind this boundary so adapters remain declarative and a
future driver could implement the same workflow model.

### Security helpers

The domain policy blocks undeclared requests. Redaction helpers sanitize output,
and CAPTCHA detection converts a challenge into an action-required result.

## Execution states

The foundation returns:

- `completed`: every declared step succeeded;
- `action-required`: execution stopped at a review, submission, CAPTCHA, or
  identity checkpoint.

Persistent states such as `submitted`, `pending-verification`, `unknown`,
`confirmed`, `denied`, and `exempt` will be added with the run journal.

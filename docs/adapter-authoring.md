# Adapter authoring

Adapters are declarative JSON manifests under `adapters/<broker>/manifest.json`.
They do not import Playwright or execute arbitrary JavaScript.

## Required metadata

- Stable lowercase `id`.
- Public display name and description.
- Homepage and allowed domains.
- Resource domains required by the form.
- Supported jurisdictions and request types.
- Support level and policy basis.
- Date the workflow was last verified.
- Ordered workflow steps.

## Policy basis

Use:

- `statutory` only when a verified law applies to the selected jurisdiction;
- `published-policy` when the broker promises the option publicly;
- `voluntary` when the broker accepts requests without a stated legal duty;
- `unknown` while cataloging an unverified route.

Never copy legal language between jurisdictions without verifying that it
applies.

## Locators

Prefer:

1. accessible role and name;
2. associated label;
3. stable visible text;
4. CSS only when no semantic locator works.

The workflow requests a semantic value:

```json
{
  "type": "fill",
  "field": "subject.primaryEmail",
  "target": {
    "strategy": "label",
    "value": "Email address"
  }
}
```

It must not contain actual user data.

## Submission safety

Every click that submits or irreversibly changes a request is marked
`destructive` and follows a `submission` checkpoint:

```json
{
  "type": "checkpoint",
  "kind": "submission",
  "message": "Review the populated request before submission."
}
```

CAPTCHA, login, MFA, identity upload, or uncertain field mapping uses an
appropriate manual checkpoint.

## Domains

Production URLs use HTTPS. `allowedDomains` contains navigation and submission
destinations. `resourceDomains` contains any additional hosts required for
scripts, frames, or API requests. The runner blocks undeclared traffic.

Loopback HTTP is allowed only for manifests explicitly marked as fixtures.

## Verification checklist

- Test with synthetic data.
- Inspect every requested semantic field.
- Confirm request eligibility for each jurisdiction.
- Record authorization behavior.
- Confirm the final action and success indicator.
- Document CAPTCHA and email verification.
- Test denial, timeout, and selector-change behavior.
- Update `lastVerified`.

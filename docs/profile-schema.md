# Profile schema

## Subject and requester

A profile contains:

- one data subject;
- one requester capacity;
- one or more emails, phones, and addresses;
- a jurisdiction used for eligibility and request wording.

The requester capacity is:

- `self`;
- `authorized-agent`; or
- `guardian`.

Representative requests require the requester's name, email, and an
authorization reference. The reference points to locally held evidence; it must
not contain the evidence itself.

## Environment variables

Required self-request variables:

```text
DATA_BREAKER_JURISDICTION
DATA_BREAKER_SUBJECT_ID
DATA_BREAKER_SUBJECT_FIRST_NAME
DATA_BREAKER_SUBJECT_LAST_NAME
DATA_BREAKER_SUBJECT_EMAILS
DATA_BREAKER_SUBJECT_PHONES
DATA_BREAKER_SUBJECT_ADDRESSES
DATA_BREAKER_REQUESTER_CAPACITY
```

Optional subject variables:

```text
DATA_BREAKER_SUBJECT_MIDDLE_NAME
DATA_BREAKER_SUBJECT_SUFFIX
DATA_BREAKER_SUBJECT_ALIASES
DATA_BREAKER_SUBJECT_DATE_OF_BIRTH
```

Emails, phones, aliases, and addresses are JSON arrays. See `.env.example` for a
synthetic Georgia profile.

Representative requests additionally require:

```text
DATA_BREAKER_REQUESTER_FIRST_NAME
DATA_BREAKER_REQUESTER_LAST_NAME
DATA_BREAKER_REQUESTER_EMAIL
DATA_BREAKER_REQUESTER_AUTHORIZATION_REFERENCE
```

Middle name, suffix, and trade name are optional.

## Data minimization

An adapter declares each semantic field it needs. Planning fails if a required
field is unavailable. A profile may contain more information than one request
uses; the runner does not pass the complete profile to the adapter.

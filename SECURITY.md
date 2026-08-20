# Security policy

## Supported versions

Until the first tagged release, only the current `bet` branch receives security
updates.

## Reporting a vulnerability

Do not open a public issue for a vulnerability that could expose personal
information, credentials, authorization records, or unsafe browser behavior.
Use GitHub private vulnerability reporting after the repository enables it.

If private reporting is unavailable, open a public issue containing no exploit,
secrets, PII, or sensitive details and ask the maintainer to establish a private
channel.

## High-priority findings

Please report:

- profile values appearing in plans, logs, errors, traces, or artifacts;
- an adapter navigating or transmitting data outside declared domains;
- a way to cross submission checkpoints without approval;
- credential, mailbox, or browser-state persistence;
- unsafe handling of CAPTCHA, MFA, identity documents, or agent authorization;
- dependency or workflow compromise.

Reports should use synthetic data and provide the smallest safe reproduction.

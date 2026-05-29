# Security Policy & Known Advisories

This document tracks dependency vulnerabilities that cannot be immediately
resolved, with rationale and a remediation timeline. It is maintained as part
of the dependency-audit process (`pnpm audit --audit-level=high`).

## Reporting a vulnerability

Email the maintainers privately rather than opening a public issue. Include
affected component, reproduction steps, and impact assessment.

## Audit baseline

Run from the repo root:

```bash
pnpm audit --audit-level=high
pnpm dedupe
```

The CI pipeline runs `pnpm audit --audit-level=high` and secret scanning on
every pull request (see `.github/workflows/ci.yml`).

## Resolved in this pass

The following HIGH-severity advisories were remediated via `pnpm.overrides`
in the root `package.json` and a dependency bump:

| Package          | Vulnerable        | Fixed via                                   |
| ---------------- | ----------------- | ------------------------------------------- |
| `axios`          | `<1.16.0`         | override `^1.16.0` (was `^1.13.5`)          |
| `fast-uri`       | `<=3.1.0`         | override `^3.1.1`                           |
| `path-to-regexp` | `<0.1.13` (exp 4) | scoped override `0.1.13`                    |
| `path-to-regexp` | `8.0.0–8.3.x`     | scoped override `^8.4.0`                    |
| `picomatch`      | `<2.3.2`          | scoped override `2.3.2`                     |
| `picomatch`      | `4.0.0–4.0.3`     | scoped override `^4.0.4`                    |
| `next`           | `<16.2.3`         | bump `web-client` to `^16.2.3`             |

## Accepted / unresolvable (tracked)

### `lodash` & `lodash-es` — Prototype pollution (HIGH)

- **Advisory patched version:** `>=4.18.0`
- **Status:** No fix available. `lodash` has not shipped a `4.18.0` release;
  the latest published version on the `4.x` line is `4.17.x`. The advisory's
  declared "patched" version does not exist, so there is nothing to upgrade to.
- **Exposure:** Pulled in transitively only — `@nestjs/config` and
  `@nestjs/swagger` (server, dev/runtime config parsing) and
  `@ant-design/pro-layout` in `web-admin` (build-time UI utilities). None of
  these paths pass untrusted user input through the affected `lodash` merge
  gadgets.
- **Mitigation in place:** Root override pins `lodash`/`lodash-es` to
  `^4.17.23` (latest hardened `4.17.x`). Application code does not depend on
  `lodash` directly.
- **Remediation timeline:** Re-evaluate when (a) upstream `lodash` publishes a
  fixed release, or (b) the consuming dependencies (`@nestjs/*`, Ant Design
  pro-layout) drop the `lodash` dependency. Re-check each dependency-bump cycle.

## Notes

- Remaining `moderate`/`low` advisories are below the CI failure threshold
  (`--audit-level=high`) and are reviewed during routine dependency bumps.

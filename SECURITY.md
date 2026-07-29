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
| `brace-expansion`| `<2.1.3` (2.x)    | scoped override `2.1.3` (see note below)    |

## Accepted / unresolvable (tracked)

### `brace-expansion` — DoS via unbounded expansion length (HIGH)

- **Advisory:** [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg)
  — declared affected `<=5.0.7`, patched `>=5.0.8`.
- **Status:** *Vulnerability is fixed; the advisory metadata is over-broad.*
  Upstream backported the `maxLength` bound to every maintenance line
  (`1.1.16`, `2.1.3`, `3.0.5`) after fixing it in `5.0.8`, but the GitHub
  advisory still declares a single range of `<=5.0.7`. Because `2.1.3 <= 5.0.7`
  by semver, the audit flags the patched release. Verified directly: `2.1.3`
  contains the `maxLength` guard (absent in `2.1.2`).
- **Why not upgrade to `5.0.8`:** it is a breaking API change, not just a patch.
  `2.x` exports a callable default (`module.exports = expandTop`); `5.x` exports
  a namespace object (`{ expand, EXPANSION_MAX, EXPANSION_MAX_LENGTH }`) with no
  default. Every consumer here is `minimatch@9.0.9`, which calls the default
  export — forcing `5.0.8` makes `expand(...)` throw
  `TypeError: expand is not a function` across eslint, glob, rimraf and webpack.
  `5.x` also requires Node `20 || >=22`, tighter than this repo's `>=18`.
- **Mitigation in place:** root override pins the `2.x` line to the patched
  `2.1.3`; the advisory is suppressed via `pnpm.auditConfig.ignoreGhsas` so CI
  is not blocked by metadata that does not match reality.
- **Remediation timeline:** drop the suppression once either (a) the advisory is
  amended with per-major ranges, or (b) the tree moves to `minimatch@11+`, which
  consumes the `5.x` named-export API. Re-check each dependency-bump cycle.

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

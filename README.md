# trade-imports-ins-tests

End-to-end, accessibility and security tests for the trade imports services — the animals frontend and its admin portal, the high-risk plants frontend, and the Import Notification Service front door (including the address book). Tests are split by domain so each service's deploy can run only its own suite.

## Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Editor Setup](#editor-setup)
- [Running Tests](#running-tests)
- [Local Testing](#local-testing)
- [Visual Regression Tests](#visual-regression-tests)
- [Security Testing](#security-testing)
- [Running Tests on GitHub](#running-tests-on-github)
- [Running Tests via CDP Portal](#running-tests-via-cdp-portal)
- [Developer Workflow](#developer-workflow)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)
- [Licence](#licence)

## Prerequisites

- Node.js v24
- npm package manager

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd trade-imports-ins-tests
   ```

2. Use the correct version of Node.js:

   ```bash
   nvm use
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Install Playwright browsers:

   ```bash
   npx playwright install
   ```

   Or install only Chromium (for faster setup):

   ```bash
   npx playwright install chromium
   ```

## Editor Setup

### TypeScript version (VS Code and Cursor)

To keep TypeScript checks and editor behaviour consistent with this repository and CI, use the workspace TypeScript version in your editor:

1. Open any `.ts` or `.tsx` file.
2. Open Command Palette (`Cmd+Shift+P` on macOS).
3. Run `TypeScript: Select TypeScript Version`.
4. Select `Use Workspace Version`.

## Running Tests

This project uses **Playwright Test** as the test runner, with TypeScript for type-safe test development.

| Command                                       | Test scope                                            | Target               | Config                                | Generates Report |
| --------------------------------------------- | ----------------------------------------------------- | -------------------- | ------------------------------------- | ---------------- |
| `npm test`                                    | E2E suite, excluding `@compose` and `@a11y`           | CDP                  | `playwright.config.ts`                | ✓                |
| `npm run test:a11y`                           | Accessibility (`@a11y`) test suite                    | CDP                  | `playwright.config.ts`                | ✓                |
| `npm run test:dynamics`                       | Dynamics integration (`@dynamics`) test suite         | CDP                  | `playwright.config.ts`                | ✓                |
| `npm run test:docker-compose`                 | E2E + E2E integration (`@compose`) test suites        | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:a11y`            | Accessibility (`@a11y`) test suite                    | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:visual`          | Visual regression (`@visual`) suite                   | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:security`        | ZAP passive scan against the e2e suite                | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:security:active` | Security (`@active`, ZAP passive + active scan) suite | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:ci`              | E2E, for the workspace CI stack job                   | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |

### Running one domain

The scripts above run every domain. Against the docker-compose stack, each
domain also has its own scripts, named `test:docker-compose:<domain>[:<suite>]`
to match the [CDP domain profiles](#running-tests-via-cdp-portal). They run
the same suite as the all-domain script, limited to that domain's `tests/<domain>/` directory.

| Domain          | e2e                                 | a11y                                     | visual                               | security (ZAP passive)                       | security:active (ZAP active, scoped)                |
| --------------- | ----------------------------------- | ---------------------------------------- | ------------------------------------ | -------------------------------------------- | --------------------------------------------------- |
| `animals`       | `test:docker-compose:animals`       | `test:docker-compose:animals:a11y`       | `test:docker-compose:animals:visual` | `test:docker-compose:animals:security`       | `test:docker-compose:animals:security:active`       |
| `animals-admin` | `test:docker-compose:animals-admin` | `test:docker-compose:animals-admin:a11y` | —                                    | `test:docker-compose:animals-admin:security` | `test:docker-compose:animals-admin:security:active` |
| `ins`           | `test:docker-compose:ins`           | —                                        | —                                    | `test:docker-compose:ins:security`           | `test:docker-compose:ins:security:active`           |
| `plants`        | `test:docker-compose:plants`        | —                                        | —                                    | —                                            | —                                                   |

A dash means the domain has no specs of that test type yet.

Per-domain `security:active` sets `ZAP_SCOPE` so the no-traffic gate only covers
that domain's ZAP contexts; the report is labelled scoped. Full-corpus active
remains `npm run test:docker-compose:security:active`.

Optional: append these Playwright parameters to the command you're running (e.g. `npm test`) when needed.

| Playwright Parameters      | Action                                     |
| -------------------------- | ------------------------------------------ |
| `-- --headed`              | Run tests in headed mode (see the browser) |
| `-- tests/example.spec.ts` | Run a specific test file                   |
| `-- --grep "@smoke"`       | Run tests with a specific tag              |
| `-- --debug`               | Run tests in debug mode                    |
| `-- --ui`                  | Run tests with UI mode                     |
| `-- tests/animals/`        | Run one domain or test suite directory     |

### Test Reports

| Command                      | Report                 | Generates Report |
| ---------------------------- | ---------------------- | ---------------- |
| `npx playwright show-report` | Open HTML report       | n/a              |
| `npm run report`             | Generate Allure report | ✓                |

After tests run, Playwright results and report are generated automatically, and Allure results are also generated automatically. Run `npm run report` to generate the Allure report.

### Test Configuration

Shared settings (projects, reporters, `retries: 1`, `trace: on-first-retry`)
live in `utils/playwright/shared-config.ts`. The target-specific configs extend
those settings:

| File                                  | Target               |
| ------------------------------------- | -------------------- |
| `playwright.config.ts`                | CDP services         |
| `playwright.docker-compose.config.ts` | docker-compose stack |

`@a11y` tests use the same configs; per-test timeout is longer in
`fixtures/a11y.ts`.

The animals journey scans leave out govuk-frontend's conditional-reveal radios
(`govukConditionalRevealRadioOnOrigin` and
`govukConditionalRevealRadiosOnReason` in `fixtures/a11y.ts`). govuk-frontend sets `aria-expanded` on
each radio that opens a conditional reveal (`radios.mjs`), and axe's
`aria-allowed-attr` rule rejects it. That is a disagreement between
govuk-frontend and axe, not a service defect.

The CDP config sets a 60s test timeout and a 15s expect timeout, against
Playwright's 30s and 5s defaults that the docker-compose config keeps. Each CDP
page load is a real network hop, so CDP needs a longer budget than the local
stack. The suite once also timed out in bursts: a
leaked address book on dev (grown to 4,882 records) made every
`contact-address` page load fan out dozens of concurrent reads through the
CDP SSL sidecar, which returned 502/504s for a few minutes at a time. Session
reuse, a per-test address-book teardown and a one-off purge removed the leak
and the outage; three clean CDP runs then kept every test under
three-quarters of its new budget (45s, or 135s for tests marked
`test.slow()`), so the timeout came down from 90s to 60s.

`documents-limits`' fifteen-document test sets its own 120s timeout: its real
uploads and virus scans take 57–60s on the local stack and about 67s on CDP,
which left too thin a margin under the 90s a slow test gets on compose.
Re-check it if the base timeouts change.

The flow helpers wait for each page's heading with `pageLoadWait`
(`config/timeouts.ts`, 30s) rather than the test timeout, so a transient 502
fails the step that hit it within 30s and names the page it was waiting for.
Sign-in waits for either the landing page or the "Sorry, we are unable to sign
you in." page before deciding whether to try again.

### Address-book records made by a test

Specs do not clean up the addresses they create. In CDP dev, test, perf-test
and ext-test the address book removes every address about 7 days after it was
created, so test records age out on their own there. That needs both
`ADDRESS_TTL_DAYS` and `ADDRESS_TTL_EXPIRY_ENABLED` set; the local
docker-compose stack sets neither, so addresses a local run creates never age
out. Make each name unique (a timestamp or UUID
suffix) so a search finds only this run's record. A spec deletes an address
only when the deletion is what it tests. Where expiry is on, the shared journey
addresses seeded in `globalSetup` expire too; the next run's
`ensureE2eAddressBook` creates them again.

### Commodity species in the animals specs

`domain/animals/constants/commodity-species.ts` names each species a spec
chooses by its CN commodity code and Latin name. The commodity page labels each
tick box with the Latin name alone, under a heading of the code, and one Latin
name can sit under several codes (`Bos taurus` is under four), so a species
needs both. The stack's MDM stub answers only the searches saved from MDM, so
each species' `searchTerm` is a saved term whose first page of results lists
that species; the first page is the frontend's 100 results. The
frontend saves only a species its search showed, so a seeded journey posts the
search before it posts the chosen species. A spec that needs what MDM says
about a species, such as its common name, reads it from reference-data's
commodity search through `ReferenceDataApiClient`, rather than from a copy of
it that goes stale.

The outbox and PIMS Dynamics specs expect `GBN_AG_CATTLE_COMMON_NAME`, because
the event's common name for `Bos taurus` differs from reference data's.

### Authenticated session reuse

Each worker signs in once per domain and its tests restore that session
instead of driving the identity provider every time (`fixtures/auth-state.ts`).
Saved state lives under `playwright/.auth/` (gitignored, removed by `_clean`),
holds only the `sid` auth cookie, and is never written unless a fresh context
has proved it restores to a signed-in landing page. A spec that must start
unauthenticated opts out with `test.use({ storageState: COLD_START })`.

The fixtures that sign in have their own timeout, longer than a test's, because
signing in takes longer than a test's own budget.

A spec that needs the same user in a new browser session uses the
`openFreshSession` fixture. It opens a page in a new browser context that keeps
only the auth cookie of the test's own page, so the service holds none of the
first session's journey state. The fixture closes every context it opened.

`E2E_SESSION_REUSE=off` is the kill switch: every test signs in for itself
again. The CDP config caps workers at 4 when reuse is off; against the
docker-compose stack re-cap them yourself (e.g. `-- --workers=4`).
Reuse is on by default against both the docker-compose stack and CDP.
`ENVIRONMENT=dev npm run probe:cdp-session-reuse` passed against dev on
2026-09-15 for animals-frontend, admin and ins-frontend — it signs in once per
service and proves load-balanced replicas honour a session minted against
another. Re-run it before relying on reuse against a different CDP
environment.

The `docker-compose` config targets `localhost:3000` / `localhost:3001` /
`localhost:3002` / `localhost:3003`, so start the workspace stack first. CI
runs `npm run test:docker-compose:ci` against that stack via the workspace
reusable workflow.

### Domains, test suites and projects

Tests are split into four domains, each a functional area of the product. One
or more services serve a domain: `animals` covers the animals frontend and
backend, and `ins` covers the ins frontend, ins backend and address book. A domain's specs
live under its own `tests/<domain>/` directory, and its base URL is resolved
from the spec's directory:

| Domain          | Front end                        | Directory              |
| --------------- | -------------------------------- | ---------------------- |
| `animals`       | `trade-imports-animals-frontend` | `tests/animals/`       |
| `animals-admin` | `trade-imports-animals-admin`    | `tests/animals-admin/` |
| `ins`           | `trade-imports-ins-frontend`     | `tests/ins/`           |
| `plants`        | `trade-imports-plants-frontend`  | `tests/plants/`        |

A test suite is a group of specs you run together: a domain's directory, or one
test type within it such as `tests/animals/e2e/`. Select one or several by path:

```bash
npm run test:docker-compose -- tests/animals/ tests/ins/e2e/
```

Always end a directory with `/`. Playwright reads the path as a regex, so
`tests/animals` would also run `tests/animals-admin/`.

A Playwright project is browser config only. Both configs have one, `chromium`,
and it runs every domain.

Within a domain directory, specs are grouped by test type, then by feature:

```text
tests/<domain>/
  a11y/
  e2e/
    features/
      address-book/   (animals and ins)
    pages/
    journeys/
    visual/
  security/
```

Folders only organise specs: type tags (`@a11y`, `@active`, `@compose`, `@dynamics`, `@visual`)
select the test type, and the directory selects the domain. A service tag, such as
`@ins-backend`, is a different kind: it names a service whose pull request
should also run the spec, whatever test type or domain the spec is in (see
[GitHub Actions workflow](#github-actions-workflow)).

`npm run lint` runs `lint:suite-tags` to keep the two in step: a test under `a11y/` must carry
`@a11y`, one under `security/` must carry `@active`, and one under `e2e/` neither.

`@duplicated-in-frontend` marks an end-to-end spec whose behaviour the frontend's own FIT suite also proves, so a reader knows the check exists in both places.

## Local Testing

### Local workspace stack

1. From the [workspace root](https://github.com/DEFRA/trade-imports-workspace),
   start the locally built stack:

   ```bash
   ./scripts/stack/run-stack.sh -d
   ```

2. Run every domain with `npm run test:docker-compose`, or one domain with
   its own script, e.g. `npm run test:docker-compose:plants` (see
   [Running one domain](#running-one-domain)).

`npm run test:docker-compose` targets the stack animals frontend on :3000, the
admin service on :3001, the ins frontend on :3002 and the high-risk plants
frontend on :3003.

To debug, append Playwright flags, e.g.
`npm run test:docker-compose -- --headed --workers=1`.

The suite does not wipe the database before it runs, and does not need to.
Every spec creates the state it asserts on through the front door (the
backend API), scoped to that run, so the specs pass against a database that
already holds the records of earlier runs.

For the security (OWASP ZAP) profiles against this stack, see
[Security Testing](#security-testing) below.

#### Workspace stack commands (run from the workspace root)

| Command                             | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `./scripts/stack/run-stack.sh`      | Start the full stack from published images             |
| `./scripts/stack/run-stack.sh -d`   | Start the stack built from local source under `repos/` |
| `./scripts/stack/stop-stack.sh`     | Stop the stack and wipe volumes                        |
| `./scripts/stack/bounce-backend.sh` | Recreate the backend container (picks up Java changes) |

See `docker/stack/AGENTS.md` in the workspace for the full flag reference.

### Target CDP environments (from local machine)

To run tests against a CDP environment from your local machine (on the CCoE AWS OpenVPN):

1. Set these in your `.env`:

   ```bash
   PLAYWRIGHT_ENVIRONMENT=dev   # or test, perf-test
   CDP_LOCAL=true
   DEVELOPER_API_KEY=<your developer API key from the CDP Portal>
   ```

2. Run tests with `npm test`.

CDP blocks direct calls to its backend services from outside its network, so
global set-up cannot reach the backend or the address book without
`CDP_LOCAL=true`. That setting sends those calls through the protected
ephemeral gateway, which needs `DEVELOPER_API_KEY` as `x-api-key`. The run
stops at once if `CDP_LOCAL=true` and the key is missing. The CDP Portal run
sits inside CDP and needs neither.

Use `.env.example` as a template.
When running via the CDP Portal, `ENVIRONMENT` is provided by the portal; use `PLAYWRIGHT_ENVIRONMENT` and avoid setting `ENVIRONMENT` locally.

### Capping parallel browsers (`PLAYWRIGHT_WORKERS`)

Set `PLAYWRIGHT_WORKERS` to limit how many browsers Playwright runs at once, because the device is usually the bottleneck. Use a whole number or a percentage, for example `PLAYWRIGHT_WORKERS=2` on a 16 GB machine running the full Docker stack.
If it is not set, Playwright's default applies (50% of cores on CI).

## Visual Regression Tests

Visual regression tests (tagged `@visual`) guard rendered composition — layout, spacing, colour, and typography as the user sees the page. They compare screenshots against committed baseline images and fail if any pixels differ outside the masked regions.

Baselines are stored alongside their spec files in `*-snapshots/` directories and must be committed. Each platform requires its own baseline — update both when visual changes are intentional.

Visual specs import `test` from `@fixtures/visual`. On macOS it launches Playwright's headless shell with legacy scroll bars (`-AppleShowScrollBars Always`) and connects to it over CDP. Chromium sizes a native `<select>` arrow box from the macOS scroll bar style, and with the default "Show scroll bars: Automatically" setting that style follows whether a mouse is connected: overlay scroll bars on a trackpad alone, legacy ones with a mouse. Overlay scroll bars draw every native select 4px narrower, so a `*-darwin.png` baseline made on a laptop's trackpad failed with a mouse plugged in (704 pixels on the no-JavaScript import reason page), and the other way round. Playwright's own launch refuses an argument that does not start with `-`, so the fixture starts the browser itself. On Linux the fixture is the shared one, unchanged.

Visual specs run headless whatever the project setting, because headed mode uses OS font rendering, which produces pixel differences against a headless baseline.

The origin of import baseline masks the whole status strip, not the notification reference alone. The strip renders from the first request and the reference inside it is minted per run, so an unmasked strip never matches the baseline twice. Masking the full-width strip keeps the masked box a fixed size, which the reference alone is not. The strip's own content is covered by `tests/animals/e2e/features/reference-strip.spec.ts`.

The declaration baselines mask the date of declaration instead, because the server writes today's date into the page text. `freezeDatePickersAt` does not reach that text: it stops the browser clock and moves each date picker's served bounds, and changes nothing the server has already written. The date's strong emphasis is proved by the declaration e2e specs.

Run against the stack with `npm run test:docker-compose:visual` (or
`test:docker-compose:animals:visual` for `animals` alone). `animals` and `plants` have `@visual` specs.

Regenerate the E2E baseline against the stack frontend with
`npm run test:visual:update:macos` for the host-rendered `*-darwin.png` image and
`npm run test:visual:update:linux` for the container-rendered `*-linux.png` image
used by CI. Both commands run every `@visual` spec and write the
updated snapshot into the working tree for commit. Narrow to one spec (or title via
`--grep`) by passing Playwright args after the command, and add
`--update-snapshots=missing` to write only new baselines:

```bash
npm run test:visual:update:macos -- tests/animals/e2e/visual/origin-of-import.visual.spec.ts
./bin/update-visual-baselines-linux.sh tests/animals/e2e/visual/origin-of-import.visual.spec.ts
```

The Linux script points the service URLs at `host.docker.internal`, because inside the container `localhost` is the container. It also runs the container with `--add-host=localhost:host-gateway`, which maps `localhost` to the host, so any URL the script does not override and that still names `localhost` reaches the stack too.

Visual specs set `headless: true`, because headed mode uses the host's font rendering and
never matches a headless baseline.

Every full-page screenshot of a notification page masks the whole status strip. It renders
from the first request and holds the notification reference, which is minted per run. The
whole strip is masked, not the reference alone, so the masked box stays a fixed size. The
strip's own content is covered by `tests/animals/e2e/features/reference-strip.spec.ts`.

A calendar screenshot depends on today's date twice: the browser's today picks the month and
the highlighted day, and the server's today sets each picker's `data-min-date` and
`data-max-date`. `freezeDatePickersAt` (`utils/frozen-date-picker.ts`) stops the browser clock
on a fixed day and moves the served bounds by the same number of days, so the calendar looks
as it would if that day were today.

## Security Testing

Two profiles run a DAST scan with [OWASP ZAP](https://www.zaproxy.org/) as a proxy, driven by real Playwright journeys rather than a crawler:

- `security` — passive scan across the e2e suite, cheap enough to run broadly
- `security:active` — passive plus a scoped active scan against the `@active` suite; docker-compose only, because that suite is destructive

See [`docs/security.md`](docs/security.md) for how to run it, what is scanned and why, and how the run is gated.

## Running Tests on GitHub

E2E tests run in GitHub Actions via the workspace's reusable workflow, which starts the workspace stack with `run-stack.sh --branch <branch>` and runs this repo's published test image against it, with reports published to GitHub Pages.

### GitHub Actions workflow

The `/.github/workflows/workspace-e2e-tests.yml` workflow triggers after `Publish Branch Image` completes and calls `DEFRA/trade-imports-workspace/.github/workflows/e2e-tests.yml@main` with the branch name, then reports the result back to the PR.

A service tag (`config/service-tags.ts`, for example `@ins-backend`) marks a spec in another domain that the service's pull request should also run. `npm run lint` fails if a spec carries the tag of a service whose pull request already runs the spec's domain by path, as `config/service-tags.ts` maps it.

### Scheduled security scan

`.github/workflows/scheduled-security-scan.yml` calls the workspace's `security-active-scan.yml`. Manual dispatch only for now — see [`docs/security.md`](docs/security.md).

## Running Tests via CDP Portal

Test Suite URL: https://portal.cdp-int.defra.cloud/test-suites/trade-imports-ins-tests (requires CCoE AWS OpenVPN).

In the CDP Portal, provide a `PROFILE` value to choose which test suite the container runs via `entrypoint.sh`.
If `PROFILE` is not set, the `default` profile is used.

| PROFILE           | Test suite                                                                                     | NPM script              |
| ----------------- | ---------------------------------------------------------------------------------------------- | ----------------------- |
| `default`         | e2e test suite                                                                                 | `npm test`              |
| `a11y`            | accessibility test suite                                                                       | `npm run test:a11y`     |
| `dynamics`        | Dynamics checks (`@dynamics`), see [Dynamics checks](#dynamics-checks)                         | `npm run test:dynamics` |
| `security`        | security test suite (ZAP passive scan)                                                         | `npm run test:security` |
| `security:active` | **not supported on CDP** — refused by `entrypoint.sh`; run it against the docker-compose stack | —                       |

The profiles above run every domain. To run one domain's suite only, prefix the
suite with its domain name as `<domain>:<suite>`:

| PROFILE                    | Test suite                                              |
| -------------------------- | ------------------------------------------------------- |
| `<domain>:e2e`             | that domain's e2e suite (`npm test -- tests/<domain>/`) |
| `<domain>:a11y`            | that domain's accessibility suite                       |
| `<domain>:dynamics`        | that domain's Dynamics checks (`@dynamics`)             |
| `<domain>:security`        | that domain's security suite (ZAP passive scan)         |
| `<domain>:security:active` | **not supported on CDP**, as `security:active`          |

`<domain>` is one of `animals`, `animals-admin`, `ins` or `plants`, e.g.
`animals:a11y` or `plants:e2e`. A domain with no specs of a test type (for example
`plants:a11y` today) fails with Playwright's "No tests found".

Calls that leave CDP for the internet go through the CDP proxy
(`localhost:3128`), which the `externalRequest` fixture uses. Journey and
service calls stay direct.

### Dynamics checks

`@dynamics` tests prove a submitted notification reaches a domain's Dynamics
instance (animals: PIMS Dynamics). They run only through `PROFILE=dynamics` or
`<domain>:dynamics`, and are excluded from the e2e, a11y, security and
docker-compose runs.

They query the Dataverse Web API, so they need these settings (from the test suite's
app-config and secrets on CDP, `.env` locally; see `.env.example`):

- `ANIMALS_DYNAMICS_URL` — the PIMS Dynamics environment
- `DATAVERSE_TENANT_ID`, `DATAVERSE_CLIENT_ID` — the app registration
- `DATAVERSE_CLIENT_SECRET` — its secret

A missing setting fails the test at once, naming the variable, before any journey
runs. The tests skip on the docker-compose stack, which has no PIMS Dynamics. On CDP their
Dataverse calls go through the CDP proxy (see [Running Tests via CDP Portal](#running-tests-via-cdp-portal)),
which must allow `login.microsoftonline.com` and the Dynamics host for this test suite.

**The suite is for CDP.** Run `npm run test:dynamics` from a laptop only to debug it or
write a new test: use the laptop-to-CDP `.env` (`CDP_LOCAL=true`, `PLAYWRIGHT_ENVIRONMENT`)
plus the settings above.

Tests are run from the CDP Portal under the Test Suites section. See the requirements below for how the portal run executes and publishes results.

### CDP Portal requirements

- The CDP Portal run depends on the image being built/published by `/.github/workflows/publish.yml` (from this repo's `Dockerfile`).
- The container entrypoint (`entrypoint.sh`) must exit `0` on success and a non-zero code on failure.
- Reports are published to S3 by `npm run report:publish` (which runs `./bin/publish-tests.sh` and uses `RESULTS_OUTPUT_S3_PATH`).

## Developer Workflow

### Linting

This project uses **ESLint** and **Prettier** for code quality and formatting.

| Action                   | Command                | Tool       |
| ------------------------ | ---------------------- | ---------- |
| Check for linting issues | `npm run lint`         | ESLint     |
| Auto-fix linting         | `npm run lint:fix`     | ESLint     |
| Format code              | `npm run format`       | Prettier   |
| Check code formatting    | `npm run format:check` | Prettier   |
| Type check TypeScript    | `npm run typecheck`    | TypeScript |

### Commit Checklist

Before committing changes:

- Run `npm run lint:fix` to auto-fix linting issues
- Run `npm run format` to format code
- Run `npm run typecheck` to check types (recommended)

### Pre-commit Hooks

This project uses **Husky** and **lint-staged** to automatically validate code quality before commits. The pre-commit hook checks linting (ESLint) and formatting (Prettier) on staged files only. If checks fail, the commit is blocked.

## Troubleshooting

### Tests fail with browser not found

Run `npx playwright install` to install required browsers.

### TypeScript errors

Ensure TypeScript is properly installed and `tsconfig.json` is configured correctly.

### Tests timeout

Increase timeout in `playwright.config.ts` or in individual tests using `test.setTimeout()`.

### Apple Silicon Docker build fails

Build with `--platform=linux/amd64` due to the AWS CLI v2 dependency:

```bash
docker build --platform=linux/amd64 .
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright TypeScript Guide](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government licence v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.

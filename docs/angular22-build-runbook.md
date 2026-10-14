# Angular 22 migration: version 3.0.1

The later teacher announcement supplied on 14 October 2026 asks for HTML, TypeScript, CSS, Node.js, Angular 22+ and a weather API. It supersedes the older brief's AngularJS suggestion for this technical requirement. This version implements that stack on both the public and staff websites.

## Reproducible source and build

The full Angular workspace is in `frontend/`. It contains two separately bootstrapped applications, standalone components, HTML templates, typed API models, Angular Router, HttpClient services, Angular form validators and test sources. No AngularJS runtime or controller files remain in the current websites. Each production page contains only the Angular host and entry scripts; its page content is compiled from the TypeScript workspace.

Versions are locked: Angular/CLI/build/compiler 22.2.2 and TypeScript 6.0.3. Use Node 24.15.0+ within the 24.x series, Node 22.22.3+ within 22.x, or Node 26+. Verification used Node 24.19.0 for the frontend and Node 18.20.8 for the existing Express/Passenger API.

From the project root:

```sh
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run check
npm --prefix frontend run build
```

The build publishes production scripts and HTML entry pages to `clientside/` and `adminside/`. Original fonts, photographs and CSS remain local. Both site ZIPs include the complete reproducible frontend workspace when built without `--runtime-only`. Runtime packages omit the workspace, development dependencies, tests, documentation and local credentials.

The browser runs the Angular frontend. Express serves its static files and JSON APIs. Production therefore does not need the Angular build toolchain or a newer Node runtime. Each public/staff router gets its correct SCU application base from Express; the same output works at the root, with Passenger's public prefix, and when Passenger strips that prefix.

## Scope and verification

- Homepage, combined search, event details, registration and confirmation are Angular pages.
- Staff list, all event statuses, create/update/delete protection, category controls and contact records use Angular and the real APIs.
- Form validation, error feedback, concurrent submission guards and local date/time handling are retained.
- The site's existing visual identity and independent staff layout are retained.
- MySQL tables, foreign keys, duplicate-email rules, stored ticket prices and transactional protection are retained.
- Open-Meteo remains a real external request with correct venue coordinates, date/timezone, forecast horizon and failure messages.
- Local checks: 14 Angular tests; 8 API/data/deployment tests under Node 18.20.8; 19 additional MySQL/API integration checks.

Tests use dedicated local databases and fictitious contacts. Production deployment must compare every database table's complete row digest and the private environment file before and after the update. Do not re-import the SQL or replace the private environment file during this migration.

## Assessment evidence

The technical implementation is not a mark guarantee. Private GitHub access/progress, each student's explanation/video, genuine teamwork evidence and confidential peer evaluations still need the students' own evidence. Historical verification records describe their original versions; use this runbook and the dated 3.0.1 deployment record for the current build.

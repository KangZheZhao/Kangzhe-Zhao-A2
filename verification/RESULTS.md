# Local verification

Checked on 10 October 2026 against a dedicated loopback MySQL 8.4.8 instance and the application at `http://localhost:3028`. This records local results, not a hosted deployment or a mark prediction.

## Automated checks

| Check | Result | Evidence |
| --- | --- | --- |
| JavaScript syntax | 15 source files passed | `npm run check` |
| Validation tests | 5 passed | `api/test/validation.test.js` |
| API smoke | Passed | `npm run smoke` |
| Database/API integration | 19 passed | [Integration results](integration-results.json) |
| Final SQL restoration | Passed; 10 events and 10 registrations | [Database checks](database-checks.json) |
| A2 migration | Passed; every old event value preserved | [Database checks](database-checks.json) |
| Default `api/app.js` startup | Started and health returned 200 | Local separate-port process check |
| Windows preview restart and stop | Dedicated database/app restarted; owned ports closed afterward | [Restart check](preview-restart.json) |
| Real Open-Meteo response | Correct event date and coordinates | [Recorded response](weather-response.json) |

The integration checks cover combined filters, invalid inputs, malformed JSON, category and event CRUD, registration insertion, duplicate email, simultaneous duplicate bookings, simultaneous capacity claims, old price preservation, capacity changes, version conflicts, protected deletion, multiple events per email, suspension and finished events. They create and remove only their own fixtures.

The exported SQL was restored into a newly created database. Counts, the event/email unique key and foreign-key deletion protection were checked. The A2 migration ran in a different temporary database created from the original A2 SQL; all old event columns were compared before and after. Both temporary databases were removed after those checks.

## Browser checks

Actual browser interaction verified:

- Combined date/location/category search found the selected event; a no-match search showed an empty result; Clear filters restored the list.
- Register opened the separate page. An empty submission showed errors and focused the first invalid field.
- A fictional three-ticket booking at $25 produced a stored $75 receipt. Following its event link showed that registration first in the list.
- Staff status filtering selected the past event. New event, save, update and price change appeared in the public details.
- Category create/edit changed the list and search options.
- All eight pages were checked at 375 x 812 and 1280 x 900. Page width did not exceed the viewport; wide tables scroll inside their containers. Loaded images showed no broken-image state. Browser warning/error logs were empty at the final check.

[Mobile measurements](ui-metrics.json) and [desktop measurements](desktop-metrics.json) record the page widths. A discovered mobile detail-table overflow was corrected before the final checks.

Screenshots:

- [Desktop home](ui/home-desktop.jpg)
- [Desktop staff list](ui/admin-desktop.jpg)
- [Mobile home](ui/home-mobile.jpg)
- [Mobile event and weather](ui/event-mobile.jpg)
- [Mobile registration](ui/registration-mobile.jpg)
- [Mobile staff list](ui/admin-mobile.jpg)
- [Actual test booking receipt](ui/registration-confirmation.jpg)

The receipt screenshot shows an intentionally temporary UI test. That booking, test event and test category were removed by exact identifiers after verification. Final [database counts](database-counts.json) are 10 events, 4 categories, 10 registrations and 20 tickets. The other final screenshots use this clean fictional dataset.

## Original and external work

All 1,030 original non-Git file hashes matched the initial baseline. The original branch remained `main` at `a2b335b`, including its pre-existing deletion and personal untracked notes. No original file was changed.

The source packages are validated separately in `delivery/manifest.json` and the packaging check record. They omit `.env`, dependencies, local databases and historical A2 files. No public SCU URL, GitHub push, personal video, peer evaluation or production deployment has been verified. Those require the student's real work and accounts.

All three ZIPs were also extracted into a separate folder. Dependencies installed from the lockfile, the exported SQL imported into another empty database, and a CRUD-only application user ran the packaged `app.js`. All 5 validation tests, 19 integration checks, eight pages, bundled assets and the real weather request passed from that extracted copy. The temporary package-test database and user were removed afterward. `delivery/runtime-checks.json` records that run.

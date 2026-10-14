# A3 requirements audit

Current technical release (14 October 2026): both websites use **Angular 22.2.2 and TypeScript 6.0.3**, as required by the later teacher announcement. The original brief's optional AngularJS wording is superseded for this requirement. Current verification: **14 Angular tests and 8 API/data/deployment tests passed**; see [the actual release record](../verification/SCU-angular22-2026-10-14.md) and [the reproducible build](angular22-build-runbook.md). Historical dated verification files retain their original results.

Checked against the supplied 14-page PROG2002 A3 brief on 10 October 2026. The original is the A2 version of the same charity event case. This v2 adds the A3 functionality. The rubric is an assessment standard, not a guarantee of marks.

| Rubric area | Weight | Implementation and evidence | Remaining work |
| --- | --- | --- | --- |
| Database | 5% | Four tables; registration PK/FK and unique event/email; 10 registrations; final SQL; restore and A2 migration checks | Student explains their decisions |
| REST APIs | 10% | Details with bookings; event CRUD; booking insertion; category CRUD; bound SQL and validation; 19 isolated database/API checks and 8 API/deployment tests; current live health and complete database-row preservation | Personal explanation; full CRUD is tested in an isolated database, not repeated against current production records |
| Client website | 30% | Home, combined search, details, registration and receipt; Angular 22 components and typed HttpClient services; real event-day weather; desktop/mobile checks; two verified SCU deployments | Each student's own demonstration |
| Admin website | 30% | All statuses; new/edit/delete; contacts on edit; categories; Angular 22 components and typed HttpClient services; protected deletion; live listing and save in both accounts | Each student's own demonstration |
| Concept understanding | 10% | Transaction/price/identity comments; docs; real local commits and demo outline | Genuine team GitHub progress and personal explanation/video |
| Teamwork | 15% | Blank peer form and contribution prompts | Real meetings, contributions and confidential evaluations |

## Behaviours checked

- One email can book two events. A second booking at the same event is rejected, including case variations and concurrent requests.
- Registrations show newest first with quantity and date. The public list excludes contact fields.
- Register carries an event ID to a separate page. It retrieves the event, validates inputs, inserts through the API and displays a real receipt.
- Staff see past and suspended listings. Save creates or updates an event; editing displays its registrations.
- Events with bookings resist deletion through both API and SQL. Suspension preserves their bookings.
- Concurrent requests cannot oversell. Capacity reduction below bookings and an older edit version are rejected.
- Both sites are built from standalone TypeScript components with Angular Router, typed HttpClient services, HTML `@if`/`@for` templates and Angular form validation. The production bundles and complete reproducible source are provided.
- Weather uses venue coordinates and the event date; unavailable forecasts show an explanation.

## Evidence still needed

SCU Angular 22 deployments were verified on 14 October 2026 for `kzhao11` and `tzhou14`; see [the current release results](../verification/SCU-angular22-2026-10-14.md). Earlier dated records retain their original live-write results. No private GitHub URL, recorded video or completed peer evaluation has been verified here. Local commits document this assistance session; they do not establish student teamwork or regular GitHub progress.

The brief says “2 zip files” but names three archives; this delivery uses all three names. The two supplied peer forms are byte-identical, so one unchanged blank copy is retained. Its A2 email subject conflicts with the A3 brief; the checklist uses the brief's A3 subject.

The brief permits limited GenAI use but prohibits directly copying generated code/text into the assessment. Natural wording and a restrained layout do not change that restriction. The assistance record states what was generated. The student must agree acceptable use with the Unit Assessor and produce their own work and explanation.

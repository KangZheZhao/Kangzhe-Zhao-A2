# Sydney Community Giving A3 assessment completion table

Project: Sydney Community Giving, including Harbour Sunrise Run. Accounts: kzhao11 and tzhou14. Application version: 3.0.1. The supplied A3 brief and peer evaluation template were checked on 14 October 2026. Both websites implement the later classroom requirement using Angular 22.2.2 and TypeScript 6.0.3.

This completed table records implementation and submission readiness. The tutor assigns marks; the weight column reproduces the assessment rubric.

## Assessment rubric

| Criterion | Weight | Completed implementation and evidence | Submission status |
| --- | --- | --- | --- |
| Database | 5% | Four related tables with registration identity, contacts, timestamp, tickets, historical prices and an event foreign key. The final exported SQL contains 10 events and 10 registrations. Unique event/email and foreign-key constraints enforce repeat-booking and deletion rules. | Final exported schema/data included as one SQL file per account. |
| REST APIs | 10% | Public listing/search/details, booking creation, weather endpoint and staff event/category CRUD. Transactions enforce booking capacity and deletion protection. Event versions detect stale updates. Recorded validation/deployment tests passed 8 cases and integration verification passed 19 cases. | Complete API source, migration, lockfile, import/export helpers and test sources included. |
| Public website | 30% | Angular pages retrieve events and categories through typed HttpClient services. The registration page shows the selected event, validates details and quantity, checks terms, submits a booking and shows confirmation. Event details show latest registrations and the event-day forecast. | Deployments recorded for kzhao11 and tzhou14; full TypeScript workspace and production files included. |
| Staff website | 30% | Angular staff pages list all event statuses, create and edit validated events, show booking contacts, manage categories and block deletion of booked events. The interface uses blue sidebar navigation and calendar/list views. | Staff deployments recorded for both accounts; staff TypeScript sources and production files included. |
| Concepts, comments, GitHub and video | 10% | API/database documentation explains bound SQL, parent-row locking, capacity checks, UTC timestamps, price snapshots and stale-edit protection. Genuine local version history is present. | The team repository URL, marker access and personal demonstration video link still need to be supplied. Maximum video length: 15 minutes. |
| Teamwork | 15% | Each member's original evaluation has six criteria, two rating columns, workload allocation and feedback questions. | Actual names, individual contributions, ratings and feedback are required before the forms can be completed. |

## Detailed requirement checks

| Requirement | Result | Source or delivery evidence |
| --- | --- | --- |
| At least 10 sample registrations | Complete: 10 in the final export | database/charityevents_db.sql and each accountA3-database.sql |
| Registration relationship and duplicate prevention | Complete | Event foreign key and unique event/email key |
| Newest-first event registrations | Complete | Public/staff event APIs and Angular event templates |
| Validated booking with confirmation | Complete | Public registration component and API booking transaction |
| Event CRUD and protected deletion | Complete | api/routes/events.js and staff editor/list |
| Active, past and suspended events for staff | Complete | Staff listing endpoint and status views |
| Category management and navigation | Complete | Category routes, staff category component and menus |
| Angular 22+ and TypeScript on both websites | Complete: Angular 22.2.2, TypeScript 6.0.3 | Locked workspace, standalone components, Router, HttpClient and form directives |
| External weather API | Complete | Open-Meteo event-day endpoint with cache and timeout |
| Reproducible frontend build | Complete | Full workspace in both website archives; recorded 14 Angular tests passed |
| Each member's public deployment | Deployment records checked | kzhao11 and tzhou14 URLs in submission-links.txt |
| Three account-named source archives | Complete | kzhao11A3-* and tzhou14A3-* files |
| SQL and project documentation | Complete | Final SQL export, README, API and database notes |
| Private GitHub and progress evidence | Link/access verification pending | Supply the accessible team repository URL containing A3 progress |
| Personal demonstration video | Pending link | SCU OneDrive shareable link; maximum 15 minutes |
| Confidential peer evaluation | Member information pending | Each member sends their own completed form privately to the tutor |

The development bootstrap SQL and the final exported SQL have different purposes. Submit the packaged final export for assessment. The recorded hosted databases contain 11 registrations; the final packaged export contains 10 sample registrations.

For A3 peer evaluation, use email subject PROG2002_A3_[Team_ID]_[Member_name], as required by the A3 brief.

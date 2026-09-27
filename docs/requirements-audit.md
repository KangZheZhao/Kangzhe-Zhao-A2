# Assessment brief check (PROG2002 A2)

This table maps the brief to files that can be checked in the running project.

| Brief | Requirement | Where to inspect | State |
| --- | --- | --- | --- |
| pp. 1, 4 | Home shows organisation information and API-driven current/upcoming events | `clientside/index.html`, `clientside/js/home.js`, `GET /api/events` | Implemented |
| pp. 1, 4 | Suspended and past events do not appear in public listings | `api/server.js`, `api/charityevents_db.sql` | Implemented |
| pp. 2, 4 | Search by date, location, category, alone or combined; clear fields; show errors | `clientside/search.html`, `clientside/js/search.js`, `GET /api/events`, `GET /api/categories` | Implemented |
| pp. 2, 5 | Detail page fetches only the selected event and shows full text, time, place, purpose, price/free, goal and progress | `clientside/event.html`, `clientside/js/event.js`, `GET /api/events/:id` | Implemented |
| pp. 2, 5 | Registration form and Register action with exact under-construction alert | `clientside/event.html`, `clientside/js/event.js` | Fields are shown, but no registration data is stored |
| pp. 2, 4 | Menu on every page | All four HTML files | Implemented |
| p. 3 | `charityevents_db`, connected tables, keys, at least eight sample events and several categories, `event_db.js` | `api/charityevents_db.sql`, `api/event_db.js` | Implemented |
| pp. 3-4 | Node.js/Express GET endpoints consumed with browser `fetch` and DOM updates | `api/server.js`, `clientside/js/` | Implemented |
| pp. 5-6 | Regular GitHub commits and private repository link | Repository commit history | Commits exist; marker access to the private repository still needs checking |
| p. 6 | Two named ZIP files and importable SQL | `scripts/package-submission.sh`, `output/` | Built with `username` placeholder until the student supplies the real username |
| pp. 5-7 | Completed report, personal video of no more than 15 minutes, OneDrive link, GenAI declaration | `report/`, `docs/demo-outline.md`, `docs/submission-checklist.md` | Instructor example report and its declaration complete; video and OneDrive link not created |

The report is an instructor example with blank student identity fields. This checklist records the sample project's state; it does not claim that a personal video or student submission has been completed.

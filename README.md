# Sydney Community Giving - A3 reference

This version extends the A2 charity event site with ticket registration and staff event management. Express serves both websites and the JSON API from one origin. MySQL stores events and bookings. Both websites use AngularJS 1.8.3, bundled locally.

AI assistance produced parts of this reference implementation and its documentation. The supplied A3 brief restricts copying AI-generated code or text into an assessment. Read [the assistance record](docs/GenAI-assistance-record.md) before using this work for study or submission.

## Run the project

Use Node.js 18.20.8 or later and MySQL 5.7.44 or later for a fresh database import. Verification used Node.js 18.20.8 and MySQL 8.4.8. MySQL 8.0.16+ enforces the named CHECK constraints; MySQL 5.7 relies on API validation while retaining foreign keys and the event/email unique key. Keep `api`, `clientside` and `adminside` beside one another. The separate A2 migration still requires MySQL 8.0.16+.

1. Create an empty database, for example `charityevents_a3_dev`, with `utf8mb4` character encoding. Import **one** SQL file into the selected database:
   - `database/charityevents_db.sql` is the tested export of the final schema and data: 10 events and 10 fictional registrations.
   - `api/charityevents_db.sql` creates the same schema with event dates relative to the import date. It replaces existing project tables; use an empty database.
2. Give the application database user `SELECT`, `INSERT`, `UPDATE` and `DELETE` permissions on this database. Use an import account with schema permissions when importing. A2's read-only account is insufficient for A3.
3. Copy `api/.env.example` to `api/.env`. Set database name, account, password, host and port. The example uses website port 3000.
4. In `api`, run:

   ```sh
   npm ci
   npm start
   ```

5. Open `http://localhost:3000/` for visitors and `http://localhost:3000/admin/` for staff. If `PORT` differs, use that port.

The server checks the database connection on startup. Opening HTML directly bypasses the server and will not load event data.

On the existing Windows workspace, `scripts/preview-windows.ps1` can restart the saved local test environment when its `.local` profile is present. It stops only the database it launched when the preview ends. Fresh copies should use the database setup above.

## Pages

| Visitors | Staff |
| --- | --- |
| `/index.html`: upcoming events | `/admin/`: all events, status filters and deletion |
| `/search.html`: date, location and category search | `/admin/event.html`: new event |
| `/event.html?id=1`: details, bookings and weather | `/admin/event.html?id=1`: editing and booking contacts |
| `/registration.html?id=1`: booking and receipt | `/admin/categories.html`: category management |
| `/about.html`: organisation and causes | |

A booking records name, contacts, quantity, server timestamp and ticket price. It does not charge a card. Ticket revenue and `raised_amount` are separate: staff maintain the fundraising total. Email is the booking identity, so one email can book several events but cannot book the same event twice. There is no login or user table.

The staff area has no authentication, as specified in the brief. Use fictional contacts in a public demonstration. Public event data shows names, quantities and timestamps; staff data also contains email addresses and phone numbers.

Weather uses the actual event date and venue coordinates. Dates outside the forecast window show an explanation. Weather failure does not prevent details or bookings from working.

## Check and export

From `api`:

```sh
npm run check
npm test
npm run smoke
npm run integration
npm run export
```

`check` and `test` do not need a database. `smoke` reads the running server. `integration` creates and removes its own fixtures; it refuses non-loopback targets or database names without the `_dev` suffix. Run write tests against a dedicated local database only.

`export` writes all four tables and data to `database/charityevents_db.sql`, without credentials or a fixed database name. For an existing A2 database, back up first and use the separate [A2 migration](docs/database.md).

## Files and hand-in

- [API reference](docs/api.md), [database notes](docs/database.md) and [cPanel guide](docs/cpanel-deployment.md) explain the implementation.
- [Requirements audit](docs/requirements-audit.md) maps the brief to features and remaining evidence.
- [Demo outline](docs/demo-outline.md) and [submission checklist](docs/submission-checklist.md) support the student's own explanation.
- [Verification results](verification/RESULTS.md) record actual checks and browser screenshots.
- `reference/` holds unchanged copies of the supplied brief and blank peer form.
- `archive/a2/` preserves the old report, ZIPs, declarations and scripts. These historical files are excluded from A3 packages. Copied personal A2 notes in `1/` and `report/` are also excluded.

Make the three source archives from the project root:

```sh
python scripts/package-submission.py --username username
```

The placeholder files are `delivery/usernameA3-clientside.zip`, `delivery/usernameA3-adminside.zip` and `delivery/usernameA3-api.zip`. Extract all three into the same parent folder. The API archive includes project documentation, database export and tests. `.env`, dependencies, local database files and A2 archives are omitted.

For hosting, add `--runtime-only --username YOUR_ACCOUNT`. This produces the same application in three account-named ZIPs and a separate `YOUR_ACCOUNTA3-manifest.json`, without project notes, helper scripts, tests or the A2 migration. Import `api/charityevents_db.sql` into a fresh database. Set `APP_BASE_PATH=/scg-a3` for that public URL prefix, or leave it empty at the domain root. Page navigation, assets, API requests and redirects use the configured base.

Each student still needs to deploy the same project in their own SCU cPanel, provide genuine team work on a private GitHub repository, record their own demonstration, and complete the confidential peer form. This local reference does not supply those personal or hosted results.

The v2 repository keeps the A2 history but has no GitHub remote configured. Its temporary clone remote back to the original local folder was removed. Configure the intended private team repository before pushing.

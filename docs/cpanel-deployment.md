# Deploying each student's copy

Version 2.0.1 was deployed in the `kzhao11` and `tzhou14` SCU accounts on 14 October 2026, with separate application directories and databases. [Actual URLs and verification results](../verification/SCU-2026-10-14.md) are recorded separately. For another account, use that account's own database and follow its actual cPanel interface. Credentials stay private.

## Place the files

Extract all three source ZIPs into one application directory in your home folder:

```text
scg-a3/
  api/
    app.js
    server.js
    package.json
    .env.example
    charityevents_db.sql
  clientside/
  adminside/
```

The app root is `scg-a3/api`. `app.js` starts the same server as `npm start`. Both client folders remain its siblings. Uploading HTML alone to `public_html` will not run the API.

## Database and environment

Create a separate MySQL database using cPanel. Select that empty database in phpMyAdmin and import `api/charityevents_db.sql` once. Use the full prefixed database and user names shown by cPanel. An existing account database login can be used if it already has the required permissions; otherwise configure a dedicated user. The application needs permission to read and write rows, and schema import needs table creation privileges.

Copy `.env.example` to `.env` inside `api` and enter your settings:

```dotenv
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=3306
DB_USER=CPANEL_PREFIX_USER
DB_PASSWORD=YOUR_DATABASE_PASSWORD
DB_NAME=CPANEL_PREFIX_DATABASE
APP_BASE_PATH=/scg-a3
```

Use SCU's host and port if different. Never upload `.env` to GitHub or put it in a hand-in archive. Alternatively set the same variables in the application's environment configuration. The server respects values already supplied by the host.

## Register and start

The account needs Node.js support; this project requires 18.20.8 or later. SCU inspected on 14 October 2026 provides 18.20.8. In its Node application screen, use your domain, source path `scg-a3/api`, production environment and public URL `scg-a3`. Run `npm ci --omit=dev` from `api`. Passenger loads `app.js`, which explicitly starts the same service as the CLI; it controls listening ports differently from a local server. [cPanel Node.js instructions](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/)

Set `APP_BASE_PATH=/scg-a3` and `HOST=0.0.0.0` in the private runtime configuration. Leave `PORT` unset unless the host specifies a value. Pages use a shared application base, so visitors, staff, assets, API requests and redirects retain the public prefix. The server accepts both prefixed requests and requests already stripped by Passenger. Keep the trailing slash when opening the home page. At the domain root, leave `APP_BASE_PATH` empty.

The fresh-import SQL files support MySQL 5.7.44 and MySQL 8.0.16+. On 5.7, named CHECK constraints are omitted; the API validates their fields, and foreign keys plus the event/email unique key remain enforced. The separate A2 migration requires MySQL 8.0.16+ and is excluded from runtime packages.

Use `python scripts/package-submission.py --username YOUR_ACCOUNT --runtime-only` for the hosting packages. Extract the three sibling application folders and import `api/charityevents_db.sql` only into the new, empty database. Keep the account-prefixed names shown by cPanel. Project documentation is retained locally and omitted from this profile.

Application Manager supports domain, base URL, source path and environment settings. If SCU uses another Node screen, use the equivalent settings from its recording. Check app logs on startup failure. After changing files, use the restart control or update `api/tmp/restart.txt`. [Application Manager](https://docs.cpanel.net/cpanel/software/application-manager/), [Node.js restart instructions](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/)

## Verify publicly

Check `/api/health` returns `status: ok`, then test calendar, combined search, details, booking receipt, staff editing and protected deletion outside cPanel. Use fictional contacts. Check changes after a fresh reload and in the selected database. Weather should show the correct event date or explain its absence.

Repeat in the other student's own account. Record both public URLs and actual results in the checklist. Local screenshots or successful uploads do not prove a working cPanel deployment.

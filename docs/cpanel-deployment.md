# Deploying each student's copy

Deployment has not been performed for this reference. Each student must use their own SCU cPanel account and database. Follow the SCU Session Recording guide for the account's actual interface. Credentials stay with their owner.

## Place the files

Extract all three source ZIPs into one application directory in your home folder:

```text
a3/
  api/
    app.js
    server.js
    package.json
    .env.example
  clientside/
  adminside/
  database/charityevents_db.sql
  scripts/
  docs/
```

The app root is `a3/api`. `app.js` starts the same server as `npm start`. Both client folders remain its siblings. Uploading HTML alone to `public_html` will not run the API.

## Database and environment

Create a separate MySQL database and user using cPanel. Select that empty database in phpMyAdmin and import `database/charityevents_db.sql` once. Use the full prefixed database and user names shown by cPanel. Give the application user permission to read and write rows; schema import needs table creation privileges.

Copy `.env.example` to `.env` inside `api` and enter your settings:

```dotenv
PORT=3000
HOST=127.0.0.1
DB_HOST=localhost
DB_PORT=3306
DB_USER=CPANEL_PREFIX_USER
DB_PASSWORD=YOUR_DATABASE_PASSWORD
DB_NAME=CPANEL_PREFIX_DATABASE
```

Use SCU's host and port if different. Never upload `.env` to GitHub or put it in a hand-in archive. Alternatively set the same variables in the application's environment configuration. The server respects values already supplied by the host.

## Register and start

The account needs Node.js support; this project requires 20.11 or later. In Application Manager, use your domain, source path `a3/api`, production environment and base URL `/`. Run `npm ci --omit=dev` from `api`. Passenger normally looks for `app.js`, which is provided; it controls listening ports differently from a local server. [cPanel Node.js instructions](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/)

These pages use root URLs such as `/api` and `/admin`. Register at `/` on the assigned domain/subdomain. If SCU requires a subpath such as `/a3`, adapt page, script, stylesheet and API base paths first; that configuration has not been verified here.

Application Manager supports domain, base URL, source path and environment settings. If SCU uses another Node screen, use the equivalent settings from its recording. Check app logs on startup failure. After changing files, use the restart control or update `api/tmp/restart.txt`. [Application Manager](https://docs.cpanel.net/cpanel/software/application-manager/), [Node.js restart instructions](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/)

## Verify publicly

Check `/api/health` returns `status: ok`, then test calendar, combined search, details, booking receipt, staff editing and protected deletion outside cPanel. Use fictional contacts. Check changes after a fresh reload and in the selected database. Weather should show the correct event date or explain its absence.

Repeat in the other student's own account. Record both public URLs and actual results in the checklist. Local screenshots or successful uploads do not prove a working cPanel deployment.

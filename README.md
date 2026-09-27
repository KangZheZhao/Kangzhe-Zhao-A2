# Sydney Community Giving

A fictional Sydney charity events website for PROG2002 Assessment 2. The site uses a MySQL database, a read-only Node.js and Express API, and four pages built with HTML, CSS and vanilla JavaScript.

## Project layout

- `api/`: Express server, `event_db.js`, SQL setup, package files and API smoke test.
- `clientside/`: home, search, event detail and about pages with CSS, DOM scripts and local photography. Asset sources and licenses are recorded in `clientside/assets/CREDITS.md`.
- `report/`: the assessment report template, formatted in Arial 12 pt with 1.5 line spacing. It still needs the student's own answers and identity details.
- `docs/`: development and submission notes.

## Requirements

- Node.js 18 or later.
- MySQL 8.0 or later, running locally.
- A MySQL account allowed to import the database and a separate account allowed to read it.

## Set up and run

1. Import the sample database from the repository root:

   ```sh
   mysql -u root -p < api/charityevents_db.sql
   ```

   This creates `charityevents_db`, three related tables, and ten sample events. Eight are current or upcoming; one is past and one is suspended. Re-importing resets these project tables. The event dates are relative to the date of import.

2. Create a read-only application account in MySQL. Choose your own password, then run these statements as an administrator:

   ```sql
   CREATE USER 'charity_app'@'127.0.0.1' IDENTIFIED BY 'your_local_password';
   GRANT SELECT ON charityevents_db.* TO 'charity_app'@'127.0.0.1';
   ```

3. Copy `api/.env.example` to `api/.env` and set that account's password and the local database host and port. `.env` is ignored by Git.
4. From `api/`, run `npm ci`, then `npm start`.
5. Open `http://localhost:3000/`. The Express server serves both the API and the sibling `clientside/` directory; keep those two directories next to each other after extracting the submission ZIP files.

The home page is `/index.html`, the search page is `/search.html`, an event detail page is `/event.html?id=1`, and the organisation page is `/about.html`.

On the current development Mac, an official MySQL 8.4 archive was unpacked into the ignored `.local/` directory. `scripts/local-mysql.sh start` and `scripts/local-mysql.sh stop` manage that local instance; these files are not needed by a marker who already has MySQL installed. The local root password is stored only in ignored `.local/admin-password.txt`.

## API

| Method and path | Purpose |
| --- | --- |
| `GET /api/events` | List non-suspended events that are current or upcoming in Sydney local time. Optional `date=YYYY-MM-DD`, `location=text`, and `categoryId=number` filters may be combined. |
| `GET /api/categories` | List category IDs and names for the search form. |
| `GET /api/events/:id` | Return one non-suspended event with its full description, ticket price and fundraising figures. |

The API returns JSON. Invalid inputs return HTTP 400, unknown or suspended events return HTTP 404, and server/database failures return HTTP 500. Search input is validated and used in parameterised SQL queries. The detail page presents registration fields, but Register only shows the required under-construction alert; no data is saved and there are no ticket purchase or write endpoints.

## Verify

With the server running, run `npm run smoke` from `api/`. It checks categories, event visibility, search filters, detail data and error responses. Also manually check the four pages at desktop and phone widths and confirm that the Register button shows the required message.

## Submission reminders

Run `scripts/package-submission.sh` from the repository root to create two ZIP files in `output/`. Until the student supplies a username, their names use the placeholder `usernameA2-clientside.zip` and `usernameA2-api.zip`. Pass the actual username as the first argument to regenerate them with the final names. Both archives contain their top-level `clientside/` or `api/` directory so that they can be extracted side by side. The API archive also contains this README.

The assignment also requires a completed report, a private GitHub repository link with genuine progress commits, and a demonstration video/link of no more than 15 minutes. The supplied brief permits only limited GenAI assistance and says the final report and code must be the student's own work. Treat this implementation as a study reference: the student must write and understand their submission, record a personal explanation and demonstration, and include an accurate GenAI-use statement. Do not include `.env`, `.local/`, `node_modules/` or Git internals in the ZIP files.

# Sydney Community Giving

A charity events site for PROG2002 A2. The event data is in MySQL, the API uses Express, and the pages are plain HTML, CSS and JavaScript.

## What's where

- `api/` has the server, SQL file and a small smoke test.
- `clientside/` has the four pages, scripts, styles and pictures.
- `report/` has the Word report. The student name and ID fields are blank.
- `docs/` has notes for the report, demo and hand-in.

## Run it locally

You need Node.js 18+, MySQL 8+ and a MySQL account that can import the database.

1. From the project folder, import the sample data:

   ```sh
   mysql -u root -p < api/charityevents_db.sql
   ```

   This makes three tables and ten events. Re-importing replaces those tables, so don't use it on a database you want to keep.

2. Make an account for the site to read from. Pick your own password:

   ```sql
   CREATE USER 'charity_app'@'127.0.0.1' IDENTIFIED BY 'your_local_password';
   GRANT SELECT ON charityevents_db.* TO 'charity_app'@'127.0.0.1';
   ```

3. Copy `api/.env.example` to `api/.env` and put the password there. Check the host and port too.
4. In `api/`, run `npm ci` and then `npm start`.
5. Open `http://localhost:3000/`.

Keep `api/` and `clientside/` next to each other. The server also serves the pages and pictures.

## Pages and API

The pages are `/index.html`, `/search.html`, `/event.html?id=1` and `/about.html`.

- `GET /api/events` gives the current and upcoming events. You can add `date`, `location` or `categoryId` to filter the list.
- `GET /api/categories` fills the category menu.
- `GET /api/events/:id` gives one event's details.

The Register button just shows the under-construction message. It doesn't save anyone's details or take payments.

## Quick check

With the server running, use `npm run smoke` in `api/`. Also click through the pages on a computer and phone-sized screen. Try a search that finds nothing and one that combines filters.

For the two ZIP files, run `scripts/package-submission.sh` from this folder. Give it the student username as the first argument. The files go in `output/`; the report, video and repository link are separate hand-in items. The ZIP files leave out `.env`, `.local/`, `node_modules/` and Git files.

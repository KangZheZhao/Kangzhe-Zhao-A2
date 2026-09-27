# Sydney Community Giving

A Sydney charity events website for PROG2002 Assessment 2. MySQL stores the events, Express serves a read-only API, and four HTML pages use plain JavaScript to display the results.

## Project layout

- `api/`: Express server, `event_db.js`, SQL setup, package files and API smoke test.
- `clientside/`: home, search, event detail and about pages; CSS, JavaScript and local images. Image and font sources are in `clientside/assets/CREDITS.md`.
- `report/`: the completed project report based on the supplied template. Student identity is left blank; the document uses Arial 12 pt and 1.5 line spacing.
- `docs/`: brief check, report guide, video outline and submission checklist.

## Requirements

- Node.js 18 or later.
- MySQL 8.0 or later, running locally.
- A MySQL account allowed to import the database and a separate account allowed to read it.

## Set up and run

1. Import the sample database from the repository root:

   ```sh
   mysql -u root -p < api/charityevents_db.sql
   ```

   The script creates `charityevents_db` with an organisation, four categories and ten events. Eight dates are upcoming, one event is past and one is suspended. The dates are set relative to import day. Re-importing replaces the three tables and their data.

2. Create a read-only application account in MySQL. Choose your own password, then run these statements as an administrator:

   ```sql
   CREATE USER 'charity_app'@'127.0.0.1' IDENTIFIED BY 'your_local_password';
   GRANT SELECT ON charityevents_db.* TO 'charity_app'@'127.0.0.1';
   ```

3. Copy `api/.env.example` to `api/.env` and set that account's password and the local database host and port. `.env` is ignored by Git.
4. From `api/`, run `npm ci`, then `npm start`.
5. Open `http://localhost:3000/`. The Express server serves both the API and the sibling `clientside/` directory; keep those two directories next to each other after extracting the submission ZIP files.

Pages: `/index.html`, `/search.html`, `/event.html?id=1` and `/about.html`.

## API

| Method and path | Purpose |
| --- | --- |
| `GET /api/events` | List non-suspended events that are current or upcoming in Sydney local time. Optional `date=YYYY-MM-DD`, `location=text`, and `categoryId=number` filters may be combined. |
| `GET /api/categories` | List category IDs and names for the search form. |
| `GET /api/events/:id` | Return one non-suspended event with its full description, ticket price and fundraising figures. |

All routes return JSON. Invalid inputs return 400, an unknown or suspended event returns 404, and database errors return 500. Search values are checked before they reach parameterised SQL queries. Register shows the required under-construction alert; there are no registration or payment endpoints.

## Verify

With the server running, run `npm run smoke` in `api/`. It checks the event list, categories, filters, detail route and error responses. Check the four pages at desktop and phone widths, including the Register alert.

## Submission reminders

Run `scripts/package-submission.sh` from the repository root to build both ZIP files in `output/`. Pass the student username as its first argument; without it, the filenames use `username` as a placeholder. Extract the two archives side by side so that `api/` can serve `clientside/`.

The report, separate `report/GenAI Use Declaration.txt`, private repository link and video are outside the two ZIP files. The ZIP files exclude `.env`, `.local/`, `node_modules/` and Git internals.

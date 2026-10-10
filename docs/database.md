# Database notes

## Why registration is separate

An event has many bookings. A person may attend several events, and a booking may cover several tickets. Putting contact details on `events` would mix these relationships and overwrite earlier registrations. `registrations.event_id` therefore references `events.id`.

| Table | Purpose |
| --- | --- |
| `organisations` | Host name, mission and contact |
| `categories` | Unique names used by search and editing |
| `events` | Listing, schedule, prices, capacity, venue coordinates and visibility |
| `registrations` | Booking identity, contacts, UTC timestamp, quantity and price snapshot |

`registrations` has a primary key, unique `(event_id, email)` key and an index starting with `event_id` for booking lists. The API trims and lowercases email. This identity rule does not verify ownership of the address.

`ON DELETE RESTRICT` protects events with bookings. The API checks first to give staff a useful message; the database remains a second guard against deletion by a different client.

## Booking transaction

The API locks the event row before checking status, checking for an existing email and summing booked tickets. It inserts the registration and commits. Capacity changes and deletion lock the same parent row, so concurrent bookings cannot both claim the final tickets.

The client sends quantity. The server reads the event price, calculates the total in cents and stores `unit_price` and `total_amount`. A later price change leaves previous bookings unchanged. `UTC_TIMESTAMP(6)` supplies the timestamp; the website displays it in Sydney local time, including daylight saving.

`events.version` stops an older edit form from silently overwriting a more recent save. A stale update returns `409` and asks staff to reload.

## Seed, export and migration

`api/charityevents_db.sql` creates four tables, 10 events and 10 fictional registrations. Eight events are initially active, one is past and one suspended. Alex Chen appears at two events to demonstrate the multi-event rule. Sample emails use the reserved `example.com` domain.

`database/charityevents_db.sql` is an actual export of the tested database. It contains explicit dates and imports into an empty database without `CREATE DATABASE` or `USE`, allowing cPanel-prefixed names. The export was restored into a separate database and checked for counts, duplicate prevention and deletion protection.

For an existing A2 database, back it up and apply `api/migrations/001-a3.sql` **once** instead of importing the seed. It preserves old rows and creates an empty registration table. It adds capacity 200 and version 1, with nullable coordinates. Enter venue coordinates in the editor for migrated events before expecting weather. Add at least 10 fictional registrations for the assessment dataset.

The migration was tested against a fresh copy of the original A2 schema: every existing event value survived unchanged, and the new foreign key prevented deletion after a test booking.

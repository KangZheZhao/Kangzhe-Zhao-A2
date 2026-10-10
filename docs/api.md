# API reference

All endpoints return JSON except successful deletion (`204`). Website and API share an origin. POST and PUT require `Content-Type: application/json`. User input in SQL uses bound parameters.

## Endpoints

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/health` | Database connectivity and app version |
| GET | `/api/events` | Active current/upcoming events ordered by date |
| GET | `/api/events/:id` | Event and registrations, newest first |
| POST | `/api/events/:id/registrations` | Booking; `201` with receipt |
| GET | `/api/events/:id/weather` | Event-day forecast at the venue |
| GET | `/api/categories` | Names and event counts |
| GET | `/api/organisations` | Organisation information |
| GET | `/api/admin/events` | All events, including past and suspended |
| GET | `/api/admin/events/:id` | Event plus booking contacts and totals |
| POST | `/api/admin/events` | Create event; `201` |
| PUT | `/api/admin/events/:id` | Replace editable fields; `200` |
| DELETE | `/api/admin/events/:id` | Delete unregistered event; `204` |
| POST | `/api/admin/categories` | Create category; `201` |
| PUT | `/api/admin/categories/:id` | Rename category; `200` |
| DELETE | `/api/admin/categories/:id` | Delete unused category; `204` |

Combine optional filters, for example `/api/events?date=2026-10-17&location=Barangaroo&categoryId=1`. Date must be real and formatted `YYYY-MM-DD`. Location matches venue, suburb or city. `%` and `_` are literal search characters. No matches return `[]`.

Suspended events are hidden from public lists and details. Past events remain available by detail URL but cannot accept bookings. Public registration fields are `id`, `full_name`, `registered_at` and `tickets`.

## Registration body

```json
{
  "full_name": "Example Visitor",
  "email": "visitor@example.com",
  "phone": "0400000123",
  "tickets": 2,
  "accept_terms": true
}
```

Quantity must be a whole number from 1 to 10 and fit remaining capacity. The server determines event, timestamp and price; supplied price fields have no authority. The response contains `registration`, `event_name` and a confirmation message.

## Event body

Create requires `organisation_id`, `category_id`, `name`, `image_file`, `short_description`, `purpose`, `description`, `event_date`, `start_time`, `end_time`, `venue`, `suburb`, `city`, `ticket_price`, `goal_amount`, `raised_amount`, `ticket_capacity`, `latitude`, `longitude` and `is_suspended`. Update also requires the current `version` from the staff detail API.

Times use `HH:mm` in Sydney local time; end follows start on the same day. Price and raised amount are non-negative, target positive, and amounts allow two decimal places. Capacity is 1 to 100,000. Latitude is -90 to 90, longitude -180 to 180. `image_file` must be a supplied photograph. Category create/update accepts `{ "name": "Community workshop" }`.

## Errors and weather

| Status | Meaning |
| --- | --- |
| 400 | Invalid fields, ID, date, JSON or foreign-key selection |
| 403 | Browser write came from another origin |
| 404 | Missing event/route or suspended public event |
| 409 | Duplicate, capacity conflict, stale edit or protected deletion |
| 413 / 415 | Body too large / unsupported content type |
| 503 | Weather service unavailable |
| 500 | Unexpected server/database error with a general public message |

Validation returns `error` and, where relevant, `fields`. There is no authentication requirement in the brief; the staff routes are an assessment interface, not an access-controlled production service.

Weather contains `available`, `date`, coordinates, low/high temperatures, weather code, description and rain probability. Out-of-range dates return `available: false` and `reason`. Successful responses are cached for 15 minutes; upstream requests time out after eight seconds. Today's forecast is not substituted for a later event.

-- PROG2002 A3 reference dataset. All people and bookings are fictional.
-- Select an EMPTY project database before importing this file.
-- No CREATE DATABASE / USE statement: supports cPanel-prefixed database names.
-- Re-importing replaces the four project tables. Back up existing data first.
SET NAMES utf8mb4;

DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS organisations;

CREATE TABLE organisations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  mission VARCHAR(500) NOT NULL,
  contact_email VARCHAR(160) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE events (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  organisation_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  image_file VARCHAR(80) NOT NULL,
  short_description VARCHAR(255) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue VARCHAR(140) NOT NULL,
  suburb VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Sydney',
  ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  goal_amount DECIMAL(12,2) NOT NULL,
  raised_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  ticket_capacity INT UNSIGNED NOT NULL DEFAULT 200,
  latitude DECIMAL(9,6) NULL,
  longitude DECIMAL(9,6) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_events_visibility_date (is_suspended, event_date),
  KEY idx_events_category (category_id),
  CONSTRAINT fk_events_organisation FOREIGN KEY (organisation_id)
    REFERENCES organisations (id),
  CONSTRAINT fk_events_category FOREIGN KEY (category_id)
    REFERENCES categories (id)
  /*!80016 ,
  CONSTRAINT chk_events_time CHECK (end_time > start_time),
  CONSTRAINT chk_events_ticket CHECK (ticket_price >= 0),
  CONSTRAINT chk_events_goal CHECK (goal_amount > 0),
  CONSTRAINT chk_events_raised CHECK (raised_amount >= 0),
  CONSTRAINT chk_events_capacity CHECK (ticket_capacity BETWEEN 1 AND 100000),
  CONSTRAINT chk_events_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_events_longitude CHECK (longitude BETWEEN -180 AND 180)
  */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE registrations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id INT UNSIGNED NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  registered_at DATETIME(6) NOT NULL,
  tickets INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_registrations_event_email (event_id, email),
  KEY idx_registrations_event_date (event_id, registered_at, id),
  CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE RESTRICT
  /*!80016 ,
  CONSTRAINT chk_registrations_tickets CHECK (tickets BETWEEN 1 AND 10),
  CONSTRAINT chk_registrations_price CHECK (unit_price >= 0 AND total_amount = unit_price * tickets)
  */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO organisations (id, name, mission, contact_email) VALUES
  (1, 'Sydney Community Giving',
   'We organise Sydney fundraisers for food relief, youth mentoring, housing support and creative learning.',
   'hello@sydneycommunitygiving.example');

INSERT INTO categories (id, name) VALUES
  (1, 'Fun Run'),
  (2, 'Gala & Dinner'),
  (3, 'Arts & Music'),
  (4, 'Community Market');

-- Dates are relative to import time so a marker can still see upcoming events.
INSERT INTO events
  (organisation_id, category_id, name, image_file, short_description, purpose, description,
   event_date, start_time, end_time, venue, suburb, city,
   ticket_price, goal_amount, raised_amount, is_suspended)
VALUES
  (1, 1, 'Harbour Sunrise Run',
   'community-run.jpg',
   'A 5 km walk or 10 km run along the harbour.',
   'Support neighbourhood food relief.',
   'Meet at Barangaroo Reserve for a 5 km walk or 10 km run. Volunteers will mark both routes, and breakfast follows at the finish.',
   DATE_ADD(CURDATE(), INTERVAL 7 DAY), '07:00:00', '11:00:00',
   'Barangaroo Reserve', 'Barangaroo', 'Sydney', 25.00, 12000.00, 4200.00, FALSE),
  (1, 4, 'Carriageworks Makers Market',
   'market.jpg',
   'A maker market at Carriageworks with free entry.',
   'Help provide care packs for families in Sydney.',
   'At Carriageworks, browse makers'' stalls, try the family activities and pick up lunch from the food stalls. Entry is free.',
   DATE_ADD(CURDATE(), INTERVAL 12 DAY), '10:00:00', '16:00:00',
   'Carriageworks', 'Eveleigh', 'Sydney', 0.00, 8000.00, 2600.00, FALSE),
  (1, 2, 'Town Hall Mentors'' Dinner',
   'dinner.jpg',
   'A Town Hall fundraiser for youth mentoring.',
   'Expand youth mentoring programmes.',
   'Dinner at Sydney Town Hall is followed by short talks from mentors and live music. The evening closes with a fundraising appeal.',
   DATE_ADD(CURDATE(), INTERVAL 28 DAY), '18:30:00', '22:30:00',
   'Sydney Town Hall', 'Sydney CBD', 'Sydney', 95.00, 30000.00, 11250.00, FALSE),
  (1, 3, 'Enmore Benefit Night',
   'concert.jpg',
   'An evening concert in Newtown for wellbeing programmes.',
   'Fund wellbeing sessions for people facing isolation.',
   'Local musicians and community groups share the Enmore stage. Doors open at 17:00 for an evening of live performances.',
   DATE_ADD(CURDATE(), INTERVAL 35 DAY), '17:00:00', '21:00:00',
   'Enmore Theatre', 'Newtown', 'Sydney', 38.00, 18000.00, 5850.00, FALSE),
  (1, 1, 'Steps for Shelter',
   'community-run.jpg',
   'A community walk through Centennial Park.',
   'Fund practical community housing support.',
   'Choose a short loop or take the longer route through Centennial Park. Volunteers will be stationed along both routes.',
   DATE_ADD(CURDATE(), INTERVAL 42 DAY), '08:00:00', '12:00:00',
   'Centennial Park', 'Centennial Park', 'Sydney', 20.00, 15000.00, 6300.00, FALSE),
  (1, 4, 'Parramatta Family Fair',
   'market.jpg',
   'A free family afternoon in Parramatta Park.',
   'Supply school essentials for local children.',
   'Come for games, food stalls or a drop-in craft activity in Parramatta Park. The fair is free to enter.',
   DATE_ADD(CURDATE(), INTERVAL 49 DAY), '11:00:00', '17:00:00',
   'Parramatta Park', 'Parramatta', 'Sydney', 0.00, 10000.00, 3300.00, FALSE),
  (1, 3, 'The Rocks Art Auction',
   'art-gallery.jpg',
   'An afternoon exhibition and silent auction at The Rocks.',
   'Fund art workshops for young people.',
   'Browse work by emerging Sydney artists, meet the contributors and leave a silent bid during the afternoon.',
   DATE_ADD(CURDATE(), INTERVAL 56 DAY), '16:00:00', '20:00:00',
   'The Rocks Discovery Museum', 'The Rocks', 'Sydney', 15.00, 22000.00, 8200.00, FALSE),
  (1, 2, 'Jones Bay Community Dinner',
   'dinner.jpg',
   'A shared dinner with local volunteers at Jones Bay Wharf.',
   'Help run regular community meals.',
   'Share dinner at Jones Bay Wharf and hear from volunteers who run local meal programmes. The evening includes a short talk and time to meet the team.',
   DATE_ADD(CURDATE(), INTERVAL 63 DAY), '18:00:00', '21:30:00',
   'Doltone House Jones Bay Wharf', 'Pyrmont', 'Sydney', 75.00, 25000.00, 9500.00, FALSE),
  (1, 1, 'Previous Community Walk',
   'community-run.jpg',
   'A completed event kept to test date handling.',
   'Support neighbourhood food relief.',
   'This sample event has finished and should not appear in current event listings.',
   DATE_SUB(CURDATE(), INTERVAL 10 DAY), '08:00:00', '11:00:00',
   'Hyde Park', 'Sydney CBD', 'Sydney', 10.00, 5000.00, 5000.00, FALSE),
  (1, 3, 'Paused Benefit Concert',
   'concert.jpg',
   'A sample suspended event.',
   'Support community projects.',
   'This sample event is suspended and must never appear in public results.',
   DATE_ADD(CURDATE(), INTERVAL 70 DAY), '18:00:00', '21:00:00',
   'City Recital Hall', 'Sydney CBD', 'Sydney', 30.00, 10000.00, 1000.00, TRUE);

UPDATE events SET latitude = -33.8573, longitude = 151.2011 WHERE id = 1;
UPDATE events SET latitude = -33.8930, longitude = 151.1937 WHERE id = 2;
UPDATE events SET latitude = -33.8732, longitude = 151.2066 WHERE id = 3;
UPDATE events SET latitude = -33.8988, longitude = 151.1735 WHERE id = 4;
UPDATE events SET latitude = -33.8978, longitude = 151.2345 WHERE id = 5;
UPDATE events SET latitude = -33.8116, longitude = 151.0001 WHERE id = 6;
UPDATE events SET latitude = -33.8592, longitude = 151.2085 WHERE id = 7;
UPDATE events SET latitude = -33.8578, longitude = 151.1922 WHERE id = 8;
UPDATE events SET latitude = -33.8731, longitude = 151.2113 WHERE id = 9;
UPDATE events SET latitude = -33.8665, longitude = 151.2081 WHERE id = 10;

-- Ten registrations; the same person can attend different events.
-- UTC timestamps are converted to Australia/Sydney for display.
INSERT INTO registrations (event_id, full_name, email, phone, registered_at, tickets, unit_price, total_amount) VALUES
 (1, 'Alex Chen', 'alex.chen@example.com', '0400000101', DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 8 DAY), 2, 25.00, 50.00),
 (1, 'Priya Shah', 'priya.shah@example.com', '0400000102', DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 6 DAY), 1, 25.00, 25.00),
 (1, 'Oliver Reed', 'oliver.reed@example.com', '0400000103', DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 4 DAY), 3, 25.00, 75.00),
 (1, 'Mia Tran', 'mia.tran@example.com', '0400000104', DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 1 DAY), 2, 25.00, 50.00),
 (2, 'Alex Chen', 'alex.chen@example.com', '0400000101', DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 7 DAY), 2, 0.00, 0.00),
 (2, 'Sam Wilson', 'sam.wilson@example.com', '0400000105', DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 2 DAY), 4, 0.00, 0.00),
 (3, 'Ella Martin', 'ella.martin@example.com', '0400000106', DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 5 DAY), 2, 95.00, 190.00),
 (3, 'Noah Patel', 'noah.patel@example.com', '0400000107', DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 3 DAY), 1, 95.00, 95.00),
 (4, 'Ruby Lee', 'ruby.lee@example.com', '0400000108', DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 2 DAY), 2, 38.00, 76.00),
 (9, 'Jack Brown', 'jack.brown@example.com', '0400000109', DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 15 DAY), 1, 10.00, 10.00);

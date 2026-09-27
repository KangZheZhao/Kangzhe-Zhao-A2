-- Import with a MySQL account that can create databases and tables.
-- Re-importing replaces the three project tables and their sample data.
CREATE DATABASE IF NOT EXISTS charityevents_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE charityevents_db;

DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS organisations;

CREATE TABLE organisations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  mission VARCHAR(500) NOT NULL,
  contact_email VARCHAR(160) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB;

CREATE TABLE events (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  organisation_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
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
  PRIMARY KEY (id),
  KEY idx_events_visibility_date (is_suspended, event_date),
  KEY idx_events_category (category_id),
  CONSTRAINT fk_events_organisation FOREIGN KEY (organisation_id)
    REFERENCES organisations (id),
  CONSTRAINT fk_events_category FOREIGN KEY (category_id)
    REFERENCES categories (id),
  CONSTRAINT chk_events_time CHECK (end_time > start_time),
  CONSTRAINT chk_events_ticket CHECK (ticket_price >= 0),
  CONSTRAINT chk_events_goal CHECK (goal_amount > 0),
  CONSTRAINT chk_events_raised CHECK (raised_amount >= 0)
) ENGINE=InnoDB;

INSERT INTO organisations (id, name, mission, contact_email) VALUES
  (1, 'Sydney Community Giving',
   'Bringing neighbours together around local causes through welcoming community events.',
   'hello@sydneycommunitygiving.example');

INSERT INTO categories (id, name) VALUES
  (1, 'Fun Run'),
  (2, 'Gala & Dinner'),
  (3, 'Arts & Music'),
  (4, 'Community Market');

-- Dates are relative to import time so a marker can still see upcoming events.
INSERT INTO events
  (organisation_id, category_id, name, short_description, purpose, description,
   event_date, start_time, end_time, venue, suburb, city,
   ticket_price, goal_amount, raised_amount, is_suspended)
VALUES
  (1, 1, 'Harbour Sunrise Run',
   'Choose a 5 km walk or 10 km run, then stay for breakfast.',
   'Support neighbourhood food relief.',
   'Choose a relaxed 5 km walk or a 10 km run along the harbour. Volunteers will guide the route, and everyone is welcome at the finish-line breakfast. Ticket donations support local food relief partners.',
   DATE_ADD(CURDATE(), INTERVAL 14 DAY), '07:00:00', '11:00:00',
   'Barangaroo Reserve', 'Barangaroo', 'Sydney', 25.00, 12000.00, 4200.00, FALSE),
  (1, 4, 'Neighbourhood Giving Market',
   'Local maker stalls and family activities at Carriageworks.',
   'Fund practical support for families in need.',
   'Browse stalls from Sydney makers, enjoy family activities, and learn about volunteer opportunities. Entry is free; optional donations and stall proceeds help provide community care packs.',
   DATE_ADD(CURDATE(), INTERVAL 21 DAY), '10:00:00', '16:00:00',
   'Carriageworks', 'Eveleigh', 'Sydney', 0.00, 8000.00, 2600.00, FALSE),
  (1, 2, 'Community Lights Gala',
   'Dinner and live music at Sydney Town Hall for youth mentoring.',
   'Expand youth mentoring programmes.',
   'Join an evening dinner celebrating the volunteers and mentors who support young people. The programme includes short talks, live music, and a fundraising appeal for more mentoring places.',
   DATE_ADD(CURDATE(), INTERVAL 28 DAY), '18:30:00', '22:30:00',
   'Sydney Town Hall', 'Sydney CBD', 'Sydney', 95.00, 30000.00, 11250.00, FALSE),
  (1, 3, 'Sounds for Support',
   'Local musicians take the Enmore stage for wellbeing programs.',
   'Provide access to local wellbeing activities.',
   'Enjoy performances by local musicians and community groups. Ticket donations support accessible wellbeing activities for people facing isolation across Sydney.',
   DATE_ADD(CURDATE(), INTERVAL 35 DAY), '17:00:00', '21:00:00',
   'Enmore Theatre', 'Newtown', 'Sydney', 38.00, 18000.00, 5850.00, FALSE),
  (1, 1, 'Steps for Shelter',
   'Choose a short or long route through Centennial Park.',
   'Assist community housing support services.',
   'This accessible community walk offers short and long route options. Join neighbours, volunteers and local teams to raise awareness and funds for practical housing support.',
   DATE_ADD(CURDATE(), INTERVAL 42 DAY), '08:00:00', '12:00:00',
   'Centennial Park', 'Centennial Park', 'Sydney', 20.00, 15000.00, 6300.00, FALSE),
  (1, 4, 'Riverside Family Fair',
   'Games, food stalls and hands-on activities beside the river.',
   'Supply school essentials for local children.',
   'Spend an afternoon with games, food stalls and creative activities beside the river. Entry is free and donations support school supply packs for local children.',
   DATE_ADD(CURDATE(), INTERVAL 49 DAY), '11:00:00', '17:00:00',
   'Parramatta Park', 'Parramatta', 'Sydney', 0.00, 10000.00, 3300.00, FALSE),
  (1, 3, 'Art for Good Auction',
   'Meet emerging Sydney artists and place a silent bid.',
   'Support creative learning in the community.',
   'See works contributed by emerging Sydney artists and hear about community arts projects. Entry tickets are donations; the exhibition and silent auction raise funds for creative learning.',
   DATE_ADD(CURDATE(), INTERVAL 56 DAY), '16:00:00', '20:00:00',
   'The Rocks Discovery Museum', 'The Rocks', 'Sydney', 15.00, 22000.00, 8200.00, FALSE),
  (1, 2, 'Harbour Hope Dinner',
   'A shared dinner with local volunteers at Jones Bay Wharf.',
   'Create more community meal programmes.',
   'Gather for a welcoming dinner with stories from local volunteers and a simple fundraising programme. Contributions help create regular community meals and connection opportunities.',
   DATE_ADD(CURDATE(), INTERVAL 63 DAY), '18:00:00', '21:30:00',
   'Doltone House Jones Bay Wharf', 'Pyrmont', 'Sydney', 75.00, 25000.00, 9500.00, FALSE),
  (1, 1, 'Previous Community Walk',
   'A completed event kept to test date handling.',
   'Support neighbourhood food relief.',
   'This sample event has finished and should not appear in current event listings.',
   DATE_SUB(CURDATE(), INTERVAL 10 DAY), '08:00:00', '11:00:00',
   'Hyde Park', 'Sydney CBD', 'Sydney', 10.00, 5000.00, 5000.00, FALSE),
  (1, 3, 'Paused Benefit Concert',
   'A sample suspended event.',
   'Support community projects.',
   'This sample event is suspended and must never appear in public results.',
   DATE_ADD(CURDATE(), INTERVAL 70 DAY), '18:00:00', '21:00:00',
   'City Recital Hall', 'Sydney CBD', 'Sydney', 30.00, 10000.00, 1000.00, TRUE);

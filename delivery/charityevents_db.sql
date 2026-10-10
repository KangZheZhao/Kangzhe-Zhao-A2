-- Sydney Community Giving schema and data export
-- Select an empty project database before importing.
-- Registration timestamps use UTC; event dates and times use Sydney local time.
SET NAMES utf8mb4;

CREATE TABLE `organisations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mission` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_email` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `organisations` (`id`, `name`, `mission`, `contact_email`) VALUES
(1, 'Sydney Community Giving', 'We organise Sydney fundraisers for food relief, youth mentoring, housing support and creative learning.', 'hello@sydneycommunitygiving.example');

CREATE TABLE `categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Fun Run'),
(2, 'Gala & Dinner'),
(3, 'Arts & Music'),
(4, 'Community Market');

CREATE TABLE `events` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` int unsigned NOT NULL,
  `category_id` int unsigned NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_file` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `venue` varchar(140) COLLATE utf8mb4_unicode_ci NOT NULL,
  `suburb` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sydney',
  `ticket_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `goal_amount` decimal(12,2) NOT NULL,
  `raised_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `is_suspended` tinyint(1) NOT NULL DEFAULT '0',
  `ticket_capacity` int unsigned NOT NULL DEFAULT '200',
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `version` int unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_events_visibility_date` (`is_suspended`,`event_date`),
  KEY `idx_events_category` (`category_id`),
  KEY `fk_events_organisation` (`organisation_id`),
  CONSTRAINT `fk_events_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_events_organisation` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`),
  CONSTRAINT `chk_events_capacity` CHECK ((`ticket_capacity` between 1 and 100000)),
  CONSTRAINT `chk_events_goal` CHECK ((`goal_amount` > 0)),
  CONSTRAINT `chk_events_latitude` CHECK ((`latitude` between -(90) and 90)),
  CONSTRAINT `chk_events_longitude` CHECK ((`longitude` between -(180) and 180)),
  CONSTRAINT `chk_events_raised` CHECK ((`raised_amount` >= 0)),
  CONSTRAINT `chk_events_ticket` CHECK ((`ticket_price` >= 0)),
  CONSTRAINT `chk_events_time` CHECK ((`end_time` > `start_time`))
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `events` (`id`, `organisation_id`, `category_id`, `name`, `image_file`, `short_description`, `purpose`, `description`, `event_date`, `start_time`, `end_time`, `venue`, `suburb`, `city`, `ticket_price`, `goal_amount`, `raised_amount`, `is_suspended`, `ticket_capacity`, `latitude`, `longitude`, `version`) VALUES
(1, 1, 1, 'Harbour Sunrise Run', 'community-run.jpg', 'A 5 km walk or 10 km run along the harbour.', 'Support neighbourhood food relief.', 'Meet at Barangaroo Reserve for a 5 km walk or 10 km run. Volunteers will mark both routes, and breakfast follows at the finish.', '2026-10-17', '07:00:00', '11:00:00', 'Barangaroo Reserve', 'Barangaroo', 'Sydney', '25.00', '12000.00', '4200.00', 0, 200, '-33.857300', '151.201100', 1),
(2, 1, 4, 'Carriageworks Makers Market', 'market.jpg', 'A maker market at Carriageworks with free entry.', 'Help provide care packs for families in Sydney.', 'At Carriageworks, browse makers\' stalls, try the family activities and pick up lunch from the food stalls. Entry is free.', '2026-10-22', '10:00:00', '16:00:00', 'Carriageworks', 'Eveleigh', 'Sydney', '0.00', '8000.00', '2600.00', 0, 200, '-33.893000', '151.193700', 1),
(3, 1, 2, 'Town Hall Mentors\' Dinner', 'dinner.jpg', 'A Town Hall fundraiser for youth mentoring.', 'Expand youth mentoring programmes.', 'Dinner at Sydney Town Hall is followed by short talks from mentors and live music. The evening closes with a fundraising appeal.', '2026-11-07', '18:30:00', '22:30:00', 'Sydney Town Hall', 'Sydney CBD', 'Sydney', '95.00', '30000.00', '11250.00', 0, 200, '-33.873200', '151.206600', 1),
(4, 1, 3, 'Enmore Benefit Night', 'concert.jpg', 'An evening concert in Newtown for wellbeing programmes.', 'Fund wellbeing sessions for people facing isolation.', 'Local musicians and community groups share the Enmore stage. Doors open at 17:00 for an evening of live performances.', '2026-11-14', '17:00:00', '21:00:00', 'Enmore Theatre', 'Newtown', 'Sydney', '38.00', '18000.00', '5850.00', 0, 200, '-33.898800', '151.173500', 1),
(5, 1, 1, 'Steps for Shelter', 'community-run.jpg', 'A community walk through Centennial Park.', 'Fund practical community housing support.', 'Choose a short loop or take the longer route through Centennial Park. Volunteers will be stationed along both routes.', '2026-11-21', '08:00:00', '12:00:00', 'Centennial Park', 'Centennial Park', 'Sydney', '20.00', '15000.00', '6300.00', 0, 200, '-33.897800', '151.234500', 1),
(6, 1, 4, 'Parramatta Family Fair', 'market.jpg', 'A free family afternoon in Parramatta Park.', 'Supply school essentials for local children.', 'Come for games, food stalls or a drop-in craft activity in Parramatta Park. The fair is free to enter.', '2026-11-28', '11:00:00', '17:00:00', 'Parramatta Park', 'Parramatta', 'Sydney', '0.00', '10000.00', '3300.00', 0, 200, '-33.811600', '151.000100', 1),
(7, 1, 3, 'The Rocks Art Auction', 'art-gallery.jpg', 'An afternoon exhibition and silent auction at The Rocks.', 'Fund art workshops for young people.', 'Browse work by emerging Sydney artists, meet the contributors and leave a silent bid during the afternoon.', '2026-12-05', '16:00:00', '20:00:00', 'The Rocks Discovery Museum', 'The Rocks', 'Sydney', '15.00', '22000.00', '8200.00', 0, 200, '-33.859200', '151.208500', 1),
(8, 1, 2, 'Jones Bay Community Dinner', 'dinner.jpg', 'A shared dinner with local volunteers at Jones Bay Wharf.', 'Help run regular community meals.', 'Share dinner at Jones Bay Wharf and hear from volunteers who run local meal programmes. The evening includes a short talk and time to meet the team.', '2026-12-12', '18:00:00', '21:30:00', 'Doltone House Jones Bay Wharf', 'Pyrmont', 'Sydney', '75.00', '25000.00', '9500.00', 0, 200, '-33.857800', '151.192200', 1),
(9, 1, 1, 'Previous Community Walk', 'community-run.jpg', 'A completed event kept to test date handling.', 'Support neighbourhood food relief.', 'This sample event has finished and should not appear in current event listings.', '2026-09-30', '08:00:00', '11:00:00', 'Hyde Park', 'Sydney CBD', 'Sydney', '10.00', '5000.00', '5000.00', 0, 200, '-33.873100', '151.211300', 1),
(10, 1, 3, 'Paused Benefit Concert', 'concert.jpg', 'A sample suspended event.', 'Support community projects.', 'This sample event is suspended and must never appear in public results.', '2026-12-19', '18:00:00', '21:00:00', 'City Recital Hall', 'Sydney CBD', 'Sydney', '30.00', '10000.00', '1000.00', 1, 200, '-33.866500', '151.208100', 1);

CREATE TABLE `registrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `event_id` int unsigned NOT NULL,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registered_at` datetime(6) NOT NULL,
  `tickets` int unsigned NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_registrations_event_email` (`event_id`,`email`),
  KEY `idx_registrations_event_date` (`event_id`,`registered_at`,`id`),
  CONSTRAINT `fk_registrations_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_registrations_price` CHECK (((`unit_price` >= 0) and (`total_amount` = (`unit_price` * `tickets`)))),
  CONSTRAINT `chk_registrations_tickets` CHECK ((`tickets` between 1 and 10))
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `registrations` (`id`, `event_id`, `full_name`, `email`, `phone`, `registered_at`, `tickets`, `unit_price`, `total_amount`) VALUES
(1, 1, 'Alex Chen', 'alex.chen@example.com', '0400000101', '2026-10-02 06:37:32.241662', 2, '25.00', '50.00'),
(2, 1, 'Priya Shah', 'priya.shah@example.com', '0400000102', '2026-10-04 06:37:32.241662', 1, '25.00', '25.00'),
(3, 1, 'Oliver Reed', 'oliver.reed@example.com', '0400000103', '2026-10-06 06:37:32.241662', 3, '25.00', '75.00'),
(4, 1, 'Mia Tran', 'mia.tran@example.com', '0400000104', '2026-10-09 06:37:32.241662', 2, '25.00', '50.00'),
(5, 2, 'Alex Chen', 'alex.chen@example.com', '0400000101', '2026-10-03 06:37:32.241662', 2, '0.00', '0.00'),
(6, 2, 'Sam Wilson', 'sam.wilson@example.com', '0400000105', '2026-10-08 06:37:32.241662', 4, '0.00', '0.00'),
(7, 3, 'Ella Martin', 'ella.martin@example.com', '0400000106', '2026-10-05 06:37:32.241662', 2, '95.00', '190.00'),
(8, 3, 'Noah Patel', 'noah.patel@example.com', '0400000107', '2026-10-07 06:37:32.241662', 1, '95.00', '95.00'),
(9, 4, 'Ruby Lee', 'ruby.lee@example.com', '0400000108', '2026-10-08 06:37:32.241662', 2, '38.00', '76.00'),
(10, 9, 'Jack Brown', 'jack.brown@example.com', '0400000109', '2026-09-25 06:37:32.241662', 1, '10.00', '10.00');

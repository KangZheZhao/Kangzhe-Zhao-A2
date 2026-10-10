-- Run ONCE on an existing A2 database after taking a backup.
-- Preserves every A2 event, category and organisation. Does not seed registrations.
SET NAMES utf8mb4;
ALTER TABLE events
  ADD COLUMN ticket_capacity INT UNSIGNED NOT NULL DEFAULT 200,
  ADD COLUMN latitude DECIMAL(9,6) NULL,
  ADD COLUMN longitude DECIMAL(9,6) NULL,
  ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1,
  ADD CONSTRAINT chk_events_capacity CHECK (ticket_capacity BETWEEN 1 AND 100000),
  ADD CONSTRAINT chk_events_latitude CHECK (latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT chk_events_longitude CHECK (longitude BETWEEN -180 AND 180);
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
  CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE RESTRICT,
  CONSTRAINT chk_registrations_tickets CHECK (tickets BETWEEN 1 AND 10),
  CONSTRAINT chk_registrations_price CHECK (unit_price >= 0 AND total_amount = unit_price * tickets)
) ENGINE=InnoDB;

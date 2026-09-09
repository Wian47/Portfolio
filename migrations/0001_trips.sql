-- Migration number: 0001 	 2026-09-09T00:00:00.000Z
CREATE TABLE IF NOT EXISTS trips (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  version     INTEGER NOT NULL,
  doc         TEXT NOT NULL,
  archived_at TEXT
);

-- The list query filters on archived_at and sorts by updated_at, in that order.
CREATE INDEX IF NOT EXISTS trips_recent ON trips(archived_at, updated_at DESC);

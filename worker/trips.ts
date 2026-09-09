/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { Trip, TripId, TripSummary, VersionedTrip } from '../trip/model';
import { parseTrip } from '../trip/validate';

/**
 * One row per trip, the document stored whole as JSON. There is one user, a
 * trip is a few hundred stops, every read wants all of it and every write is a
 * small edit to one document. Normalising into `days` and `stops` tables would
 * buy queries nobody runs and cost a multi-statement transaction on every drag.
 */

const LIST_LIMIT = 200;

export type ReplaceResult =
  | { kind: 'replaced'; version: number }
  | { kind: 'conflict'; current: VersionedTrip }
  | { kind: 'missing' };

interface TripRow {
  doc: string;
  version: number;
}

const readRow = (row: TripRow): VersionedTrip | null => {
  const parsed = parseTrip(JSON.parse(row.doc) as unknown);
  return parsed.ok ? { trip: parsed.value, version: row.version } : null;
};

export const listTrips = async (db: D1Database): Promise<TripSummary[]> => {
  const { results } = await db
    .prepare(
      `SELECT id, title, updated_at AS updatedAt, version
         FROM trips
        WHERE archived_at IS NULL
        ORDER BY updated_at DESC
        LIMIT ?`
    )
    .bind(LIST_LIMIT)
    .all<TripSummary>();
  return results;
};

export const getTrip = async (db: D1Database, id: TripId): Promise<VersionedTrip | null> => {
  const row = await db
    .prepare('SELECT doc, version FROM trips WHERE id = ? AND archived_at IS NULL')
    .bind(id)
    .first<TripRow>();
  return row === null ? null : readRow(row);
};

export const insertTrip = async (db: D1Database, trip: Trip): Promise<boolean> => {
  const { meta } = await db
    .prepare(
      `INSERT INTO trips (id, title, updated_at, version, doc, archived_at)
       VALUES (?, ?, ?, 1, ?, NULL)
       ON CONFLICT(id) DO NOTHING`
    )
    .bind(trip.id, trip.title, trip.updatedAt, JSON.stringify(trip))
    .run();
  return meta.changes === 1;
};

/**
 * The version check lives in the WHERE clause, so two devices racing on the
 * same trip cannot both win. Zero rows changed means somebody else wrote first,
 * and the caller gets the current document back to replay its edit against.
 */
export const replaceTrip = async (
  db: D1Database,
  id: TripId,
  trip: Trip,
  expectedVersion: number
): Promise<ReplaceResult> => {
  const { meta } = await db
    .prepare(
      `UPDATE trips
          SET doc = ?, title = ?, updated_at = ?, version = version + 1
        WHERE id = ? AND version = ? AND archived_at IS NULL`
    )
    .bind(JSON.stringify(trip), trip.title, trip.updatedAt, id, expectedVersion)
    .run();

  if (meta.changes === 1) return { kind: 'replaced', version: expectedVersion + 1 };

  const current = await getTrip(db, id);
  return current === null ? { kind: 'missing' } : { kind: 'conflict', current };
};

/** Archive rather than delete. A trip you took is a record, not a draft. */
export const archiveTrip = async (
  db: D1Database,
  id: TripId,
  at: string
): Promise<boolean> => {
  const { meta } = await db
    .prepare('UPDATE trips SET archived_at = ? WHERE id = ? AND archived_at IS NULL')
    .bind(at, id)
    .run();
  return meta.changes === 1;
};

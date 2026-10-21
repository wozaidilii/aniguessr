import { readFileSync } from "node:fs";
import path from "node:path";
import {
  animeTitle,
  clusterSamePlaces,
  haversineKm,
  localizedNavText,
  type NavCatalog,
  type NavSpot,
} from "~/lib/pilgrimage-nav";

export const SAME_PLACE_GROUPS_CSV = path.join(
  "scripts",
  "data",
  "same-place-groups.csv",
);

export interface SamePlaceGroupRow {
  groupId: string;
  spotIds: string[];
  names: string[];
  works: string[];
  maxDistanceM: number;
}

const FIELD_SEPARATOR = "|";

function csvCell(value: string): string {
  if (/[",\n\r]/u.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function maxDistanceMeters(spots: readonly NavSpot[]): number {
  let max = 0;
  for (let left = 0; left < spots.length; left += 1) {
    const a = spots[left];
    if (!a) continue;
    for (let right = left + 1; right < spots.length; right += 1) {
      const b = spots[right];
      if (!b) continue;
      const meters = haversineKm(a.lat, a.lng, b.lat, b.lng) * 1000;
      if (meters > max) max = meters;
    }
  }
  return Math.round(max * 10) / 10;
}

/** Groups of two or more spots. Members and rows are sorted for a stable file. */
export function buildSamePlaceGroupRows(
  catalog: NavCatalog,
): SamePlaceGroupRow[] {
  const rows: SamePlaceGroupRow[] = [];
  for (const group of clusterSamePlaces(catalog.spots)) {
    if (group.length < 2) continue;
    const members = [...group].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
    const first = members[0];
    if (!first) continue;
    rows.push({
      groupId: first.id,
      spotIds: members.map((spot) => spot.id),
      names: members.map((spot) => localizedNavText(spot.name, "ja")),
      works: members.map(
        (spot) =>
          animeTitle(catalog.animes, spot.subjectId, "ja") ||
          localizedNavText(spot.name, "ja"),
      ),
      maxDistanceM: maxDistanceMeters(members),
    });
  }
  rows.sort((left, right) => left.groupId.localeCompare(right.groupId));
  return rows;
}

export function formatSamePlaceGroupsCsv(
  rows: readonly SamePlaceGroupRow[],
): string {
  const lines = ["group_id,spot_ids,names,works,max_distance_m"];
  for (const row of rows) {
    lines.push(
      [
        row.groupId,
        row.spotIds.join(FIELD_SEPARATOR),
        row.names.join(FIELD_SEPARATOR),
        row.works.join(FIELD_SEPARATOR),
        row.maxDistanceM.toFixed(1),
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char ?? "";
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      cells.push(current);
      current = "";
      continue;
    }
    current += char ?? "";
  }
  cells.push(current);
  return cells;
}

export function parseSamePlaceGroupsCsv(csv: string): SamePlaceGroupRow[] {
  const lines = csv.trim().split(/\n/u);
  const header = lines[0];
  if (header !== "group_id,spot_ids,names,works,max_distance_m") {
    throw new Error("Unexpected same-place CSV header");
  }
  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const cells = parseCsvLine(line);
      const spotIds = (cells[1] ?? "").split(FIELD_SEPARATOR).filter(Boolean);
      const names = (cells[2] ?? "").split(FIELD_SEPARATOR);
      const works = (cells[3] ?? "").split(FIELD_SEPARATOR);
      return {
        groupId: cells[0] ?? "",
        spotIds,
        names,
        works,
        maxDistanceM: Number(cells[4] ?? "0"),
      };
    });
}

let peerIndex: Map<string, string[]> | null = null;

function peerIndexFromDisk(): Map<string, string[]> {
  if (peerIndex) return peerIndex;
  const csv = readFileSync(
    path.join(process.cwd(), SAME_PLACE_GROUPS_CSV),
    "utf8",
  );
  const index = new Map<string, string[]>();
  for (const row of parseSamePlaceGroupsCsv(csv)) {
    for (const id of row.spotIds) index.set(id, row.spotIds);
  }
  peerIndex = index;
  return index;
}

/** Other spot ids that share this spot's place. Empty when it is alone. */
export function samePlacePeerIds(spotId: string): string[] {
  const members = peerIndexFromDisk().get(spotId) ?? [];
  return members.filter((id) => id !== spotId);
}

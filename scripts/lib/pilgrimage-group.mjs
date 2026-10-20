/** Shared grouping rules for the pilgrimage SEO build. */

export function cleanString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function isMostlyHan(value) {
  const han = (value.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latin = (value.match(/[A-Za-z]/g) ?? []).length;
  const kana = (value.match(/[\u3040-\u30ff]/g) ?? []).length;
  return han > 0 && kana === 0 && han >= latin;
}

export function localizedField(question, field) {
  const zh = cleanString(question?.[field]);
  let ja = cleanString(question?.locales?.ja?.[field]);
  let en = cleanString(question?.locales?.en?.[field]);
  if (en && zh && en === zh && ja && ja !== zh) en = "";
  if (en && isMostlyHan(en) && ja && ja !== en) en = "";
  return { zh, ja, en };
}

export function localizedList(question, field) {
  const base = Array.isArray(question?.[field]) ? question[field] : [];
  const zh = base.map(cleanString).filter(Boolean);
  const jaRaw = question?.locales?.ja?.[field];
  const enRaw = question?.locales?.en?.[field];
  let ja = Array.isArray(jaRaw) ? jaRaw.map(cleanString).filter(Boolean) : [];
  let en = Array.isArray(enRaw) ? enRaw.map(cleanString).filter(Boolean) : [];
  if (
    en.length > 0 &&
    zh.length > 0 &&
    JSON.stringify(en) === JSON.stringify(zh) &&
    ja.length > 0
  ) {
    en = [];
  }
  if (en.length > 0 && en.every(isMostlyHan) && ja.length > 0) en = [];
  return { zh, ja, en };
}

export function hasSeasonMarker(title) {
  return /第\s*[0-9０-９一二三四五六七八九十]+\s*[季期]|[0-9０-９]+\s*期|season\s*\d|劇場版|电影|映画|特别篇|特別編|ova\b|after\s*story|続編|续篇|完结|完結/i.test(
    title ?? "",
  );
}

export function stripSeasonKey(title) {
  if (!title) return "";
  let value = title.normalize("NFKC");
  value = value.replace(/[《》「」『』【】[\]"*＊]/g, "");
  value = value.replace(/（[^）]*）|\([^)]*\)/g, " ");
  value = value.replace(
    /第\s*[0-9０-９一二三四五六七八九十]+\s*[季期部作話]/g,
    " ",
  );
  value = value.replace(/[0-9０-９]+\s*期/g, " ");
  value = value.replace(/season\s*\d+/gi, " ");
  value = value.replace(/\b(?:1st|2nd|3rd|[4-9]th)\s*(?:season)?\b/gi, " ");
  value = value.replace(/[ⅡⅢⅣⅤ]/g, " ");
  value = value.replace(
    /\b(?:ova|ona|oad|specials?|the movie|movie|film)\b/gi,
    " ",
  );
  value = value.replace(
    /劇場版|剧场版|映画|电影|最终章|最終章|最终话|最終話|セカンドシーズン|サードシーズン|フォースシーズン|second season|third season|fourth season/gi,
    " ",
  );
  value = value.replace(
    /特别篇|特別編|特别编|续篇|続編|后篇|後編|前編|完结篇|完結編|电影版/g,
    " ",
  );
  value = value.replace(/after\s*story/gi, " ");
  value = value.replace(/[!！~～:：·・\-—_]/g, " ");
  value = value.replace(/\s+/g, " ").trim().toLowerCase();
  return value;
}

export function isButaSubject(subject) {
  const ja = subject.titles?.ja ?? "";
  const zh = subject.titles?.zh ?? "";
  const en = subject.titles?.en ?? "";
  return (
    ja.includes("青春ブタ野郎") ||
    zh.includes("青春笨蛋少年") ||
    zh.includes("青春猪头少年") ||
    /rascal does not dream/i.test(en)
  );
}

function titleBlob(subject) {
  return `${subject.titles?.ja ?? ""}\n${subject.titles?.en ?? ""}\n${subject.titles?.zh ?? ""}`;
}

export function chooseCanonicalSubject(members) {
  return [...members].sort((a, b) => {
    const bunny = (subject) =>
      /バニーガール先輩|bunny girl senpai/i.test(titleBlob(subject)) ? 0 : 1;
    const marker = (subject) => (hasSeasonMarker(titleBlob(subject)) ? 1 : 0);
    const year = (subject) => subject.year ?? 9999;
    const id = (subject) =>
      Number(subject.subjectId) || Number.MAX_SAFE_INTEGER;
    return (
      bunny(a) - bunny(b) ||
      marker(a) - marker(b) ||
      year(a) - year(b) ||
      id(a) - id(b) ||
      b.spotCount - a.spotCount
    );
  })[0];
}

/**
 * Group Bangumi subject ids that are seasons or films of one work.
 * Seishun Buta Yarou is matched by title because each film has a different subtitle.
 * @param {Array<{subjectId: string, titles: {zh: string, ja: string, en: string}, year: number | null, spotCount: number}>} subjects
 */
export function groupSubjects(subjects) {
  /** @type {Map<string, typeof subjects>} */
  const groups = new Map();
  const assigned = new Set();

  const add = (key, subject) => {
    if (assigned.has(subject.subjectId)) return;
    assigned.add(subject.subjectId);
    const list = groups.get(key);
    if (list) list.push(subject);
    else groups.set(key, [subject]);
  };

  for (const subject of subjects) {
    if (isButaSubject(subject)) add("series:seishun-buta-yarou", subject);
  }

  /** @type {Map<string, typeof subjects>} */
  const buckets = new Map();
  for (const subject of subjects) {
    if (assigned.has(subject.subjectId)) continue;
    const key = stripSeasonKey(
      subject.titles?.ja || subject.titles?.en || subject.titles?.zh || "",
    );
    if (key.length < 3) {
      add(`solo:${subject.subjectId}`, subject);
      continue;
    }
    const list = buckets.get(key);
    if (list) list.push(subject);
    else buckets.set(key, [subject]);
  }

  for (const [key, members] of buckets) {
    if (members.length === 1) {
      add(`solo:${members[0].subjectId}`, members[0]);
      continue;
    }
    for (const member of members) add(`season:${key}`, member);
  }

  for (const subject of subjects) {
    if (!assigned.has(subject.subjectId))
      add(`solo:${subject.subjectId}`, subject);
  }

  return [...groups.values()];
}

export function haversineMeters(a, b) {
  const radius = 6_371_000;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Single-link clusters of spots within `meters` of each other. */
export function clusterWithinMeters(spots, meters) {
  const parent = spots.map((_, index) => index);
  const find = (index) => {
    let cursor = index;
    while (parent[cursor] !== cursor) {
      parent[cursor] = parent[parent[cursor]];
      cursor = parent[cursor];
    }
    return cursor;
  };
  const union = (left, right) => {
    const rootLeft = find(left);
    const rootRight = find(right);
    if (rootLeft !== rootRight) parent[rootRight] = rootLeft;
  };

  const cell = 0.0002;
  /** @type {Map<string, number[]>} */
  const grid = new Map();
  spots.forEach((spot, index) => {
    const key = `${Math.floor(spot.lat / cell)}:${Math.floor(spot.lng / cell)}`;
    const list = grid.get(key);
    if (list) list.push(index);
    else grid.set(key, [index]);
  });

  spots.forEach((spot, index) => {
    const cy = Math.floor(spot.lat / cell);
    const cx = Math.floor(spot.lng / cell);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const neighbors = grid.get(`${cy + dy}:${cx + dx}`);
        if (!neighbors) continue;
        for (const other of neighbors) {
          if (other <= index) continue;
          if (haversineMeters(spot, spots[other]) <= meters)
            union(index, other);
        }
      }
    }
  });

  /** @type {Map<number, typeof spots>} */
  const groups = new Map();
  spots.forEach((spot, index) => {
    const root = find(index);
    const list = groups.get(root);
    if (list) list.push(spot);
    else groups.set(root, [spot]);
  });
  return [...groups.values()].filter((group) => group.length > 1);
}

const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 };

export function chooseCanonicalSpot(spots) {
  return [...spots].sort((a, b) => {
    const confidence =
      (CONFIDENCE_RANK[b.confidence] ?? 0) -
      (CONFIDENCE_RANK[a.confidence] ?? 0);
    if (confidence !== 0) return confidence;
    const image = (b.imagePath ? 1 : 0) - (a.imagePath ? 1 : 0);
    if (image !== 0) return image;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  })[0];
}

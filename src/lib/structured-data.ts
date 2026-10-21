import { withPilgrimageLocale, type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { absoluteUrl } from "~/lib/seo";
import {
  AYIORA_ORGANIZATION,
  BRAND_NAME,
  resolveSiteUrl,
} from "~/lib/site-url";

export interface FilmingLocationInput {
  name: string;
  description: string;
  url: string;
  image?: string | null;
  latitude: number;
  longitude: number;
  area?: string | null;
  anime: string;
  episode?: string | null;
}

type JsonObject = Record<string, unknown>;

function seriesNode(anime: string): JsonObject {
  return { "@type": "TVSeries", name: anime };
}

function subjectOfNode(anime: string, episode?: string | null): JsonObject {
  const trimmed = episode?.trim();
  if (!trimmed) return seriesNode(anime);
  return {
    "@type": "TVEpisode",
    name: trimmed,
    partOfSeries: seriesNode(anime),
  };
}

/** TouristAttraction for one pilgrimage / filming-location page. */
export function buildTouristAttractionJsonLd(
  input: FilmingLocationInput,
): JsonObject {
  const data: JsonObject = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: input.name,
    description: input.description,
    url: input.url,
    geo: {
      "@type": "GeoCoordinates",
      latitude: input.latitude,
      longitude: input.longitude,
    },
    subjectOf: subjectOfNode(input.anime, input.episode),
  };
  if (input.image) data.image = input.image;
  const area = input.area?.trim();
  if (area) {
    data.containedInPlace = { "@type": "Place", name: area };
  }
  return data;
}

export function buildPlaceCollectionJsonLd(input: {
  name: string;
  description: string;
  url: string;
  latitude?: number | null;
  longitude?: number | null;
  places: FilmingLocationInput[];
}): JsonObject {
  const data: JsonObject = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: input.name,
    description: input.description,
    url: input.url,
    containsPlace: input.places.map((place) => {
      const attraction = buildTouristAttractionJsonLd(place);
      delete attraction["@context"];
      return attraction;
    }),
  };
  if (
    typeof input.latitude === "number" &&
    typeof input.longitude === "number"
  ) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: input.latitude,
      longitude: input.longitude,
    };
  }
  return data;
}

export function buildAnimeFilmingListJsonLd(input: {
  name: string;
  description: string;
  url: string;
  places: FilmingLocationInput[];
}): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    description: input.description,
    url: input.url,
    numberOfItems: input.places.length,
    itemListElement: input.places.map((place, index) => {
      const attraction = buildTouristAttractionJsonLd(place);
      delete attraction["@context"];
      return {
        "@type": "ListItem",
        position: index + 1,
        item: attraction,
      };
    }),
  };
}

export function buildHomeStructuredData(locale: PilgrimageLocale): JsonObject {
  const siteUrl = resolveSiteUrl();
  const pageUrl = absoluteUrl(withPilgrimageLocale("/", locale));
  const organizationId = `${AYIORA_ORGANIZATION.url}/#organization`;
  const inLanguage = locale === "zh-tw" ? "zh-Hant" : locale;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: AYIORA_ORGANIZATION.name,
        url: AYIORA_ORGANIZATION.url,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: BRAND_NAME,
        url: pageUrl,
        inLanguage,
        publisher: { "@id": organizationId },
      },
      {
        "@type": ["VideoGame", "WebApplication"],
        name: BRAND_NAME,
        url: pageUrl,
        applicationCategory: "Game",
        operatingSystem: "Web",
        browserRequirements: "Requires a modern web browser.",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: { "@id": organizationId },
        publisher: { "@id": organizationId },
        inLanguage: ["en", "ja", "zh"],
      },
    ],
  };
}

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonObject;
}

function typesOf(node: JsonObject): string[] {
  const raw = node["@type"];
  if (typeof raw === "string") return [raw];
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function requireString(
  errors: string[],
  node: JsonObject,
  key: string,
  path: string,
) {
  const value = node[key];
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${path}.${key} must be a non-empty string`);
  }
}

function validateGeo(errors: string[], node: JsonObject, path: string) {
  const geo = asObject(node.geo);
  if (!geo) {
    errors.push(`${path}.geo is required`);
    return;
  }
  if (geo["@type"] !== "GeoCoordinates") {
    errors.push(`${path}.geo.@type must be GeoCoordinates`);
  }
  for (const key of ["latitude", "longitude"] as const) {
    if (typeof geo[key] !== "number" || Number.isNaN(geo[key])) {
      errors.push(`${path}.geo.${key} must be a number`);
    }
  }
}

function validateNode(errors: string[], value: unknown, path: string) {
  const node = asObject(value);
  if (!node) {
    errors.push(`${path} must be an object`);
    return;
  }
  const types = typesOf(node);
  if (types.length === 0) errors.push(`${path}.@type is required`);

  if (types.includes("Organization")) {
    requireString(errors, node, "name", path);
    requireString(errors, node, "url", path);
  }
  if (types.includes("WebSite")) {
    requireString(errors, node, "name", path);
    requireString(errors, node, "url", path);
  }
  if (types.includes("VideoGame") || types.includes("WebApplication")) {
    requireString(errors, node, "name", path);
    requireString(errors, node, "url", path);
    const free = node.isAccessibleForFree === true;
    const offer = asObject(node.offers);
    const freeOffer = offer?.price === "0" || offer?.price === 0;
    if (!free && !freeOffer) {
      errors.push(
        `${path} must be free via isAccessibleForFree or Offer.price`,
      );
    }
    if (offer) {
      if (offer["@type"] !== "Offer") {
        errors.push(`${path}.offers.@type must be Offer`);
      }
      if (offer.price !== "0" && offer.price !== 0) {
        errors.push(`${path}.offers.price must be 0`);
      }
    }
  }
  if (types.includes("TouristAttraction")) {
    requireString(errors, node, "name", path);
    requireString(errors, node, "url", path);
    validateGeo(errors, node, path);
    const subject = asObject(node.subjectOf);
    if (!subject) errors.push(`${path}.subjectOf is required`);
    else if (typeof subject.name !== "string" || subject.name.trim() === "") {
      errors.push(`${path}.subjectOf.name is required`);
    }
  }
  if (types.includes("Place") && !types.includes("TouristAttraction")) {
    requireString(errors, node, "name", path);
    requireString(errors, node, "url", path);
  }
  if (types.includes("ItemList")) {
    requireString(errors, node, "name", path);
    if (!Array.isArray(node.itemListElement)) {
      errors.push(`${path}.itemListElement must be an array`);
    }
  }
  if (types.includes("TVEpisode")) {
    requireString(errors, node, "name", path);
    const series = asObject(node.partOfSeries);
    if (series?.["@type"] !== "TVSeries") {
      errors.push(`${path}.partOfSeries must be a TVSeries`);
    }
  }

  if (Array.isArray(node.containsPlace)) {
    node.containsPlace.forEach((child, index) => {
      validateNode(errors, child, `${path}.containsPlace[${index}]`);
    });
  }
  if (Array.isArray(node.itemListElement)) {
    node.itemListElement.forEach((child, index) => {
      const item = asObject(child);
      if (!item) {
        errors.push(`${path}.itemListElement[${index}] must be an object`);
        return;
      }
      validateNode(errors, item.item, `${path}.itemListElement[${index}].item`);
    });
  }
  const subject = asObject(node.subjectOf);
  if (subject) validateNode(errors, subject, `${path}.subjectOf`);
}

/** Returns schema shape errors. An empty list means the JSON-LD is usable. */
export function validateJsonLd(value: unknown): string[] {
  const errors: string[] = [];
  const node = asObject(value);
  if (!node) return ["root must be an object"];
  if (node["@context"] !== "https://schema.org") {
    errors.push('@context must be "https://schema.org"');
  }
  if (Array.isArray(node["@graph"])) {
    if (node["@graph"].length === 0) errors.push("@graph must not be empty");
    node["@graph"].forEach((child, index) => {
      validateNode(errors, child, `@graph[${index}]`);
    });
    return errors;
  }
  validateNode(errors, node, "$");
  return errors;
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

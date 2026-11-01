import type { Map as MapLibreMap } from "maplibre-gl";
import type { HomeMapLabel } from "~/lib/home-map-labels";
import type { HomeLocale } from "~/lib/home-locale";
import {
  areaBadgeAriaLabel,
  areaBadgeLocationHref,
  areaBadgeSizeTier,
  areaBadgeTooltip,
  formatAreaBadgeCount,
  homeMapAreaBadgeZoomBand,
  placeAreaBadgeCenters,
  placePrefectureBadgeCenters,
  type HomeMapAreaBadgeKind,
  type AxisRect,
} from "~/lib/home-map-area-badge-format";
import {
  attachHomeMapBadgeUiObstacleWatch,
  resolveHomeMapAreaBadgeUiObstacles,
  resolveHomeMapPrefectureBadgeUiObstacles,
} from "~/lib/home-map-badge-ui-obstacles";

export interface HomeMapAreaBadgeOverlayOptions {
  locale: HomeLocale;
  obstacleSelectors: readonly string[];
  getLabels: () => readonly HomeMapLabel[];
  onPrefectureZoom: (label: HomeMapLabel) => void;
}

type BadgeElement = HTMLAnchorElement | HTMLButtonElement;

function containerRect(map: MapLibreMap): AxisRect {
  const node = map.getContainer();
  const rect = node.getBoundingClientRect();
  return {
    left: 0,
    top: 0,
    right: rect.width,
    bottom: rect.height,
  };
}

function appendBadgeContent(
  element: BadgeElement,
  label: HomeMapLabel,
  locale: HomeLocale,
): void {
  element.setAttribute("aria-label", areaBadgeAriaLabel(label, locale));
  const count = document.createElement("span");
  count.className = "ag-b-count";
  count.textContent = formatAreaBadgeCount(label.count);
  element.append(count);
  const tip = document.createElement("span");
  tip.className = "ag-tip";
  tip.textContent = areaBadgeTooltip(label, locale);
  tip.setAttribute("aria-hidden", "true");
  element.append(tip);
}

function badgeClassName(label: HomeMapLabel): string {
  return `ag-b ${areaBadgeSizeTier(label.count)} ${label.major ? "major" : "minor"}`;
}

function createBadgeElement(
  label: HomeMapLabel,
  locale: HomeLocale,
  kind: HomeMapAreaBadgeKind,
  x: number,
  y: number,
  onPrefectureZoom: (label: HomeMapLabel) => void,
): BadgeElement {
  const className = badgeClassName(label);
  if (kind === "pref") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
    button.dataset.badgeKind = "pref";
    appendBadgeContent(button, label, locale);
    let activateFromPointer = false;
    button.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" || event.pointerType === "touch") {
        activateFromPointer = true;
      }
    });
    button.addEventListener("click", () => {
      onPrefectureZoom(label);
      if (activateFromPointer) {
        button.blur();
        activateFromPointer = false;
      }
    });
    return button;
  }
  const href = areaBadgeLocationHref(label, "area", locale);
  const link = document.createElement("a");
  link.href = href ?? "#";
  link.className = className;
  link.style.left = `${x}px`;
  link.style.top = `${y}px`;
  link.dataset.badgeKind = "area";
  appendBadgeContent(link, label, locale);
  return link;
}

function updateBadgeElement(
  element: BadgeElement,
  label: HomeMapLabel,
  locale: HomeLocale,
  kind: HomeMapAreaBadgeKind,
  x: number,
  y: number,
): void {
  const left = `${x}px`;
  const top = `${y}px`;
  if (element.style.left !== left) element.style.left = left;
  if (element.style.top !== top) element.style.top = top;
  const className = badgeClassName(label);
  if (element.className !== className) element.className = className;
  if (element.dataset.badgeKind !== kind) element.dataset.badgeKind = kind;
  const aria = areaBadgeAriaLabel(label, locale);
  if (element.getAttribute("aria-label") !== aria) {
    element.setAttribute("aria-label", aria);
  }
  if (element instanceof HTMLAnchorElement) {
    const href = areaBadgeLocationHref(label, "area", locale);
    if (href && element.getAttribute("href") !== href) {
      element.setAttribute("href", href);
    }
  }
  const countText = formatAreaBadgeCount(label.count);
  const countNode = element.querySelector(".ag-b-count");
  if (countNode && countNode.textContent !== countText) {
    countNode.textContent = countText;
  }
  const tipText = areaBadgeTooltip(label, locale);
  const tipNode = element.querySelector(".ag-tip");
  if (tipNode && tipNode.textContent !== tipText) {
    tipNode.textContent = tipText;
  }
}

function badgeKindForElement(element: BadgeElement): HomeMapAreaBadgeKind | null {
  const kind = element.dataset.badgeKind;
  if (kind === "pref" || kind === "area") return kind;
  return element instanceof HTMLButtonElement ? "pref" : "area";
}

export class HomeMapAreaBadgeOverlay {
  private readonly map: MapLibreMap;
  private readonly locale: HomeLocale;
  private readonly obstacleSelectors: readonly string[];
  private readonly onPrefectureZoom: (label: HomeMapLabel) => void;
  private readonly root: HTMLDivElement;
  private readonly getLabels: () => readonly HomeMapLabel[];
  private readonly pool = new Map<string, BadgeElement>();
  private readonly onMove = (): void => {
    this.sync();
  };
  private detachObstacleWatch: (() => void) | null = null;
  private syncDepth = 0;
  private lastSyncKey = "";

  constructor(map: MapLibreMap, options: HomeMapAreaBadgeOverlayOptions) {
    this.map = map;
    this.locale = options.locale;
    this.obstacleSelectors = options.obstacleSelectors;
    this.getLabels = options.getLabels;
    this.onPrefectureZoom = options.onPrefectureZoom;
    this.root = document.createElement("div");
    this.root.className = "home-map-area-badges";
    map.getContainer().append(this.root);
    map.on("moveend", this.onMove);
    map.on("zoomend", this.onMove);
    map.on("resize", this.onMove);
    const watchRoot =
      map.getContainer().closest(".home-map") ?? map.getContainer();
    this.detachObstacleWatch = attachHomeMapBadgeUiObstacleWatch(
      watchRoot,
      this.onMove,
    );
  }

  setLabels(_labels: readonly HomeMapLabel[]): void {
    this.sync();
  }

  sync(): void {
    if (this.syncDepth > 0) return;
    this.syncDepth += 1;
    try {
      this.syncInner();
    } finally {
      this.syncDepth -= 1;
    }
  }

  private syncInner(): void {
    const labels = this.getLabels();
    if (!labels.length) {
      this.lastSyncKey = "";
      this.root.replaceChildren();
      this.pool.clear();
      return;
    }
    const band = homeMapAreaBadgeZoomBand(this.map.getZoom());
    if (band === "none") {
      this.lastSyncKey = "";
      this.root.replaceChildren();
      this.pool.clear();
      return;
    }
    const kind: HomeMapAreaBadgeKind = band;

    const viewport = containerRect(this.map);
    const margin = 4;
    const viewportInset: AxisRect = {
      left: margin,
      top: margin,
      right: viewport.right - margin,
      bottom: viewport.bottom - margin,
    };
    const obstacles =
      kind === "pref"
        ? resolveHomeMapPrefectureBadgeUiObstacles(
            this.map,
            this.obstacleSelectors,
          )
        : resolveHomeMapAreaBadgeUiObstacles(this.map, this.obstacleSelectors);

    const candidates = labels
      .map((label) => {
        const point = this.map.project([label.lng, label.lat]);
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
        return {
          id: label.id,
          count: label.count,
          x: point.x,
          y: point.y,
          label,
        };
      })
      .filter((value): value is NonNullable<typeof value> => value !== null);

    const placed =
      kind === "pref"
        ? placePrefectureBadgeCenters(
            candidates.map(({ id, count, x, y }) => ({ id, count, x, y })),
            obstacles,
            viewportInset,
          )
        : placeAreaBadgeCenters(
            candidates.map(({ id, count, x, y }) => ({ id, count, x, y })),
            obstacles,
            viewportInset,
          );
    const placedIds = new Set(placed.map((item) => item.id));
    const syncKey = `${kind}:${[...placedIds].sort().join(",")}:${placed.map((p) => `${p.id}@${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("|")}`;
    if (syncKey === this.lastSyncKey) {
      return;
    }
    this.lastSyncKey = syncKey;

    const labelById = new Map(candidates.map((item) => [item.id, item.label]));

    for (const [id, element] of this.pool) {
      if (!placedIds.has(id)) {
        element.remove();
        this.pool.delete(id);
      }
    }

    for (const item of placed) {
      const label = labelById.get(item.id);
      if (!label) continue;
      let element = this.pool.get(item.id);
      if (!element || badgeKindForElement(element) !== kind) {
        element?.remove();
        element = createBadgeElement(
          label,
          this.locale,
          kind,
          item.x,
          item.y,
          this.onPrefectureZoom,
        );
        this.pool.set(item.id, element);
        this.root.append(element);
      } else {
        updateBadgeElement(element, label, this.locale, kind, item.x, item.y);
      }
    }
  }

  destroy(): void {
    this.map.off("moveend", this.onMove);
    this.map.off("zoomend", this.onMove);
    this.map.off("resize", this.onMove);
    this.detachObstacleWatch?.();
    this.detachObstacleWatch = null;
    this.root.remove();
    this.pool.clear();
  }
}

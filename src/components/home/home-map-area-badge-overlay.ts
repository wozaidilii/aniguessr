import type { Map as MapLibreMap } from "maplibre-gl";
import type { HomeMapLabel } from "~/lib/home-map-labels";
import type { HomeLocale } from "~/lib/home-locale";
import {
  areaBadgeAriaLabel,
  areaBadgeHref,
  areaBadgeSizeTier,
  areaBadgeTooltip,
  formatAreaBadgeCount,
  homeMapAreaBadgeZoomBand,
  placeAreaBadgeCenters,
  type AxisRect,
} from "~/lib/home-map-area-badge-format";

export interface HomeMapAreaBadgeOverlayOptions {
  locale: HomeLocale;
  obstacleSelectors: readonly string[];
  getLabels: () => readonly HomeMapLabel[];
}

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

function obstacleRects(
  map: MapLibreMap,
  selectors: readonly string[],
): AxisRect[] {
  const container = map.getContainer().getBoundingClientRect();
  const rects: AxisRect[] = [];
  for (const selector of selectors) {
    for (const node of document.querySelectorAll(selector)) {
      if (!(node instanceof HTMLElement)) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      rects.push({
        left: rect.left - container.left,
        top: rect.top - container.top,
        right: rect.right - container.left,
        bottom: rect.bottom - container.top,
      });
    }
  }
  return rects;
}

function badgeElement(
  label: HomeMapLabel,
  locale: HomeLocale,
  x: number,
  y: number,
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.href = areaBadgeHref(label.id, locale);
  link.className = `ag-b ${areaBadgeSizeTier(label.count)} ${label.major ? "major" : "minor"}`;
  link.style.left = `${x}px`;
  link.style.top = `${y}px`;
  link.setAttribute("aria-label", areaBadgeAriaLabel(label, locale));
  const count = document.createElement("span");
  count.className = "ag-b-count";
  count.textContent = formatAreaBadgeCount(label.count);
  link.append(count);
  const tip = document.createElement("span");
  tip.className = "ag-tip";
  tip.textContent = areaBadgeTooltip(label, locale);
  tip.setAttribute("aria-hidden", "true");
  link.append(tip);
  return link;
}

export class HomeMapAreaBadgeOverlay {
  private readonly map: MapLibreMap;
  private readonly locale: HomeLocale;
  private readonly obstacleSelectors: readonly string[];
  private readonly root: HTMLDivElement;
  private readonly getLabels: () => readonly HomeMapLabel[];
  private readonly pool = new Map<string, HTMLAnchorElement>();
  private readonly onMove = (): void => this.sync();

  constructor(map: MapLibreMap, options: HomeMapAreaBadgeOverlayOptions) {
    this.map = map;
    this.locale = options.locale;
    this.obstacleSelectors = options.obstacleSelectors;
    this.getLabels = options.getLabels;
    this.root = document.createElement("div");
    this.root.className = "home-map-area-badges";
    map.getContainer().append(this.root);
    map.on("moveend", this.onMove);
    map.on("zoomend", this.onMove);
    map.on("resize", this.onMove);
  }

  setLabels(_labels: readonly HomeMapLabel[]): void {
    this.sync();
  }

  sync(): void {
    const labels = this.getLabels();
    if (!labels.length) {
      this.root.replaceChildren();
      this.pool.clear();
      return;
    }
    const band = homeMapAreaBadgeZoomBand(this.map.getZoom());
    if (band === "none") {
      this.root.replaceChildren();
      this.pool.clear();
      return;
    }

    const viewport = containerRect(this.map);
    const margin = 4;
    const viewportInset: AxisRect = {
      left: margin,
      top: margin,
      right: viewport.right - margin,
      bottom: viewport.bottom - margin,
    };
    const obstacles = obstacleRects(this.map, this.obstacleSelectors);

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

    const placed = placeAreaBadgeCenters(
      candidates.map(({ id, count, x, y }) => ({ id, count, x, y })),
      obstacles,
      viewportInset,
    );
    const placedIds = new Set(placed.map((item) => item.id));
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
      if (!element) {
        element = badgeElement(label, this.locale, item.x, item.y);
        this.pool.set(item.id, element);
        this.root.append(element);
      } else {
        element.style.left = `${item.x}px`;
        element.style.top = `${item.y}px`;
        element.className = `ag-b ${areaBadgeSizeTier(label.count)} ${label.major ? "major" : "minor"}`;
        element.href = areaBadgeHref(label.id, this.locale);
        element.setAttribute("aria-label", areaBadgeAriaLabel(label, this.locale));
        const countNode = element.querySelector(".ag-b-count");
        if (countNode) countNode.textContent = formatAreaBadgeCount(label.count);
        const tipNode = element.querySelector(".ag-tip");
        if (tipNode) tipNode.textContent = areaBadgeTooltip(label, this.locale);
      }
    }
  }

  destroy(): void {
    this.map.off("moveend", this.onMove);
    this.map.off("zoomend", this.onMove);
    this.map.off("resize", this.onMove);
    this.root.remove();
    this.pool.clear();
  }
}

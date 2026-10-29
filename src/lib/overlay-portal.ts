import { isPointerOutsideRoot } from "~/lib/menu-dismiss";

export interface AnchoredOverlayRect {
  top: number;
  left: number;
  width: number;
}

export function anchorBelowTriggerRight(
  trigger: HTMLElement,
  menuWidth: number,
  gap = 8,
): AnchoredOverlayRect {
  const rect = trigger.getBoundingClientRect();
  const left = Math.min(
    Math.max(8, rect.right - menuWidth),
    window.innerWidth - menuWidth - 8,
  );
  return {
    top: rect.bottom + gap,
    left,
    width: menuWidth,
  };
}

export function isOutsideOverlayNodes(
  nodes: Array<Element | null | undefined>,
  target: EventTarget | null,
): boolean {
  for (const node of nodes) {
    if (node && !isPointerOutsideRoot(node, target)) return false;
  }
  return true;
}

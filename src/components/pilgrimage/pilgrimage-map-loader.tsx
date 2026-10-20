"use client";

import dynamic from "next/dynamic";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";

const PilgrimageMap = dynamic(
  () =>
    import("~/components/pilgrimage/pilgrimage-map").then(
      (mod) => mod.PilgrimageMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-pink-100/60">
        …
      </div>
    ),
  },
);

export function PilgrimageMapLoader({
  locale,
  subjectId,
  locationSlug,
}: {
  locale: PilgrimageLocale;
  subjectId?: string;
  locationSlug?: string;
}) {
  return (
    <PilgrimageMap
      locale={locale}
      subjectId={subjectId}
      locationSlug={locationSlug}
    />
  );
}

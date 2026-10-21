"use client";

import dynamic from "next/dynamic";
import type { HomeLocale } from "~/lib/home-locale";

const HomeMap = dynamic(
  () => import("~/components/home/home-map").then((mod) => mod.HomeMap),
  { ssr: false },
);

export function HomeMapLoader({ locale }: { locale: HomeLocale }) {
  return <HomeMap locale={locale} />;
}

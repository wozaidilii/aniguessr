import { type Metadata } from "next";
import { GAME_HUB_INDEXABLE } from "~/lib/index-quality";
import { gameNoindexMetadata } from "~/lib/seo";

export function generateMetadata(): Metadata {
  if (GAME_HUB_INDEXABLE) return {};
  return gameNoindexMetadata();
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

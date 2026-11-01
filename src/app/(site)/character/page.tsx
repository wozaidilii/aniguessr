import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { gameNoindexMetadata } from "~/lib/seo";

export const metadata: Metadata = gameNoindexMetadata();

export default function CharacterPage() {
  redirect("/game");
}

import { NextResponse } from "next/server";
import {
  getAnimeGuessrRemoteImageUrl,
  readLocalAnimeGuessrImage,
} from "~/server/anime-guessr-images";

export const runtime = "nodejs";

const IMAGE_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  const relativePath = segments.join("/");
  const local = await readLocalAnimeGuessrImage(relativePath);

  if (local) {
    return new NextResponse(local.body, {
      headers: {
        "Content-Type": local.contentType,
        "Cache-Control": IMAGE_CACHE_CONTROL,
        "CDN-Cache-Control": IMAGE_CACHE_CONTROL,
        "Vercel-CDN-Cache-Control": IMAGE_CACHE_CONTROL,
      },
    });
  }

  const remoteUrl = getAnimeGuessrRemoteImageUrl(relativePath);
  if (remoteUrl) {
    return NextResponse.redirect(remoteUrl, {
      status: 307,
      headers: {
        "Cache-Control": IMAGE_CACHE_CONTROL,
        "CDN-Cache-Control": IMAGE_CACHE_CONTROL,
        "Vercel-CDN-Cache-Control": IMAGE_CACHE_CONTROL,
      },
    });
  }

  return NextResponse.json({ error: "Image not found" }, { status: 404 });
}

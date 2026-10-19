import { type AnimeLocale } from "~/lib/anime-locale";
import {
  buildHomeStructuredData,
  serializeJsonLd,
} from "~/lib/structured-data";

export function HomeStructuredData({ locale }: { locale: AnimeLocale }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(buildHomeStructuredData(locale)),
      }}
    />
  );
}

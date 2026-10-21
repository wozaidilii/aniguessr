import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import {
  buildHomeStructuredData,
  serializeJsonLd,
} from "~/lib/structured-data";

export function HomeStructuredData({ locale }: { locale: PilgrimageLocale }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(buildHomeStructuredData(locale)),
      }}
    />
  );
}

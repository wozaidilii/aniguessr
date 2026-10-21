import { RootDocument } from "~/app/root-document";
import { SiteNotFound } from "~/components/site/site-not-found";

export default function NotFound() {
  return (
    <RootDocument locale="ja">
      <SiteNotFound chrome />
    </RootDocument>
  );
}

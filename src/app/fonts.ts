import { Noto_Sans_JP, Sora } from "next/font/google";

export const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

export const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
  display: "swap",
  preload: false,
});

export const soraFontClassName = sora.variable;
export const notoFontClassName = notoSansJp.variable;
export const rootFontClassName = `${soraFontClassName} ${notoFontClassName}`;

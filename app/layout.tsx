import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "2BOOK 百萬藏書公開索引";
const description = "臻品齋書店的實體中文語料與數位化合作網站，提供超過 11 萬筆已發布官網商品搜尋及百萬藏書索引。";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : "https://2book.tw";
  const image = `${origin}/og.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "zh_TW",
      siteName: "2BOOK 臻品齋書店",
      images: [{ url: image, width: 1733, height: 909, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-4D0LDDL01P" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-4D0LDDL01P');`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

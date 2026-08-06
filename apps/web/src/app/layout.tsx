import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "한국어 Hot and Cold",
  description: "공유 가능한 시드의 비밀 단어를 의미 순위로 찾아가는 한국어 게임",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

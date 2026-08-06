import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "한국어 Hot and Cold",
  description: "의미적으로 가까운 한국어 단어를 따라 오늘의 정답을 찾는 게임",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JLPT N3 – Luyện đề",
  description: "Làm đề thi JLPT N3 các năm trực tiếp trên web",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

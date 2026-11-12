import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luyện thi tiếng Nhật N3 | N3 Study Practice",
  description:
    "Nền tảng luyện tập tiếng Nhật trình độ N3.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi">
      <body>
        {children}
        <footer className="site-disclaimer">
          <p>
            Trang web này không thuộc, không liên kết, không được chứng thực hoặc bảo trợ bởi đơn vị tổ chức kỳ thi JLPT. 
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}

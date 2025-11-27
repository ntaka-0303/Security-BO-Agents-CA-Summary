import type { Metadata } from "next";
import { AntdProvider } from "./providers";
import "antd/dist/reset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "CA Summary Control Tower",
  description: "CA通知の要約・レビュー・配信を一元管理する PoC UI",
};

// SSG を無効化し、動的レンダリングを強制
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AntdProvider>
          <div className="app-shell">{children}</div>
        </AntdProvider>
      </body>
    </html>
  );
}


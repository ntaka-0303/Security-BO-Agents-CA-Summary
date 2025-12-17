"use client";

import { ConfigProvider, theme } from "antd";
import jaJP from "antd/locale/ja_JP";

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={jaJP}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#63dcfa",
          colorBgContainer: "#151c2c",
          colorBgElevated: "#1f2937",
          colorBorder: "rgba(148, 163, 184, 0.12)",
          colorText: "#f0f4f8",
          colorTextSecondary: "#94a3b8",
          borderRadius: 10,
          fontSize: 14,
          fontFamily: "'IBM Plex Sans JP', system-ui, -apple-system, sans-serif",
        },
        components: {
          Layout: {
            headerBg: "rgba(17, 24, 39, 0.8)",
            siderBg: "#111827",
            bodyBg: "#0a0e1a",
          },
          Menu: {
            darkItemBg: "transparent",
            darkSubMenuItemBg: "transparent",
            darkItemSelectedBg: "rgba(99, 220, 250, 0.15)",
            darkItemSelectedColor: "#63dcfa",
            darkItemHoverBg: "rgba(99, 220, 250, 0.08)",
            darkItemHoverColor: "#63dcfa",
          },
          Card: {
            colorBgContainer: "#151c2c",
          },
          Table: {
            colorBgContainer: "transparent",
            headerBg: "#1f2937",
          },
          Button: {
            primaryColor: "#0a0e1a",
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

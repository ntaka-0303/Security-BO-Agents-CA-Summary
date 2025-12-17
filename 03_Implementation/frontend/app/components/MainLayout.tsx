"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Layout, Menu, Typography, Flex, Badge, Avatar, Tooltip } from "antd";
import {
  HomeOutlined,
  BellOutlined,
  FileTextOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";

const { Sider, Header, Content } = Layout;

type Props = {
  children: React.ReactNode;
};

const menuItems = [
  {
    key: "/",
    icon: <HomeOutlined />,
    label: "ダッシュボード",
  },
  {
    key: "/notices",
    icon: <BellOutlined />,
    label: "CA通知取込",
  },
  {
    key: "/ai",
    icon: <RobotOutlined />,
    label: "AI生成",
  },
  {
    key: "/drafts",
    icon: <FileTextOutlined />,
    label: "ドラフトレビュー",
  },
  {
    key: "/approvals",
    icon: <CheckCircleOutlined />,
    label: "承認・配信",
  },
];

export function MainLayout({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  const currentPage = menuItems.find((item) => item.key === pathname);

  return (
    <Layout className="main-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        className="main-sider"
        width={240}
        collapsedWidth={72}
      >
        <div className="logo-container">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          {!collapsed && (
            <div className="logo-text">
              <span className="logo-title">CA Summary</span>
              <span className="logo-subtitle">Control Tower</span>
            </div>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="main-menu"
        />

        <div className="sider-footer">
          <Tooltip title="設定" placement="right">
            <div className="settings-btn">
              <SettingOutlined />
            </div>
          </Tooltip>
        </div>
      </Sider>

      <Layout>
        <Header className="main-header">
          <Flex align="center" justify="space-between" style={{ width: "100%" }}>
            <Flex align="center" gap={16}>
              <button
                className="collapse-btn"
                onClick={() => setCollapsed(!collapsed)}
                aria-label="Toggle sidebar"
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
              <div className="breadcrumb">
                <Typography.Text className="breadcrumb-current">
                  {currentPage?.label ?? "ダッシュボード"}
                </Typography.Text>
              </div>
            </Flex>

            <Flex align="center" gap={20}>
              <Tooltip title="通知">
                <Badge count={3} size="small">
                  <BellOutlined className="header-icon" />
                </Badge>
              </Tooltip>
              <div className="user-info">
                <Avatar className="user-avatar" size={36}>
                  担
                </Avatar>
                <div className="user-details">
                  <Typography.Text className="user-name">担当者</Typography.Text>
                  <Typography.Text className="user-role">オペレーター</Typography.Text>
                </div>
              </div>
            </Flex>
          </Flex>
        </Header>

        <Content className="main-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}


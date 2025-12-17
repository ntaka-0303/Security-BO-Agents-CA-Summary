"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import {
  Card,
  Col,
  Flex,
  Row,
  Statistic,
  Typography,
  Space,
  Progress,
  Tabs,
  Badge,
  Empty,
} from "antd";
import {
  BellOutlined,
  RobotOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import Link from "next/link";

import { api } from "@/lib/apiClient";
import { WorkflowStats } from "@/lib/types";

const tiles = [
  {
    title: "通知管理",
    description: "CA通知の取込・一覧・詳細確認",
    href: "/notices",
    icon: <BellOutlined />,
    iconClass: "notices",
    gradient: "linear-gradient(135deg, rgba(99, 220, 250, 0.12), rgba(99, 220, 250, 0.03))",
  },
  {
    title: "AI生成ワークベンチ",
    description: "AIによる要約・ドラフト自動生成",
    href: "/ai",
    icon: <RobotOutlined />,
    iconClass: "ai",
    gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(168, 85, 247, 0.03))",
  },
  {
    title: "ドラフト編集",
    description: "生成ドラフトの確認・修正・承認依頼",
    href: "/drafts",
    icon: <FileTextOutlined />,
    iconClass: "drafts",
    gradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.03))",
  },
  {
    title: "承認ワークフロー",
    description: "上長承認と顧客向け配信の実行",
    href: "/approvals",
    icon: <CheckCircleOutlined />,
    iconClass: "approvals",
    gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.03))",
  },
];

interface WorkflowStep {
  step: number;
  label: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  count: number;
  statusColor: string;
  actionLabel?: string;
}

export default function HomePage() {
  const { data: workflowStats } = useSWR("workflowStats", api.getWorkflowStats);
  const { data: notices } = useSWR("notices", api.listNotices);
  const { data: pendingDrafts } = useSWR("pendingDrafts", api.listPendingDrafts);

  const [stats, setStats] = useState<WorkflowStats>({
    intake_count: 0,
    draft_count: 0,
    review_waiting_count: 0,
    approval_waiting_count: 0,
    approved_count: 0,
    rejected_count: 0,
    high_risk_count: 0,
  });

  useEffect(() => {
    if (workflowStats) {
      setStats(workflowStats);
    }
  }, [workflowStats]);

  const totalNotices = notices?.length ?? 0;
  const totalProcessed = stats.approved_count;
  const completionRate = totalNotices > 0
    ? Math.round((totalProcessed / totalNotices) * 100)
    : 0;

  // ワークフロー手順の定義
  const workflowSteps: WorkflowStep[] = [
    {
      step: 1,
      label: "通知取込",
      desc: "CA原文を登録",
      href: "/notices",
      icon: <BellOutlined />,
      count: totalNotices,
      statusColor: "#63dcfa",
      actionLabel: "通知を確認",
    },
    {
      step: 2,
      label: "ドラフト作成",
      desc: "AIによる要約・ドラフト",
      href: "/ai",
      icon: <RobotOutlined />,
      count: stats.draft_count,
      statusColor: "#a855f7",
      actionLabel: "AI生成を実行",
    },
    {
      step: 3,
      label: "レビュー",
      desc: "内容確認・修正",
      href: "/drafts",
      icon: <FileTextOutlined />,
      count: stats.review_waiting_count,
      statusColor: "#22c55e",
      actionLabel: "レビューを実行",
    },
    {
      step: 4,
      label: "承認",
      desc: "上長による確認",
      href: "/approvals",
      icon: <CheckCircleOutlined />,
      count: stats.approval_waiting_count,
      statusColor: "#f59e0b",
      actionLabel: "承認を実行",
    },
    {
      step: 5,
      label: "配信完了",
      desc: "顧客への送信済み",
      href: "/approvals",
      icon: <CheckOutlined />,
      count: stats.approved_count,
      statusColor: "#10b981",
      actionLabel: "履歴を確認",
    },
  ];

  return (
    <Flex vertical gap={32}>
      {/* Hero Section */}
      <div style={{ marginBottom: 8 }}>
        <Space direction="vertical" size={4}>
          <Typography.Title level={2} style={{ marginBottom: 0, fontWeight: 700 }}>
            ダッシュボード
          </Typography.Title>
          <Typography.Text style={{ fontSize: 15, color: "var(--color-text-secondary)" }}>
            業務フロー全体の進行状況を一目で確認。各ステータスをクリックして詳細作業へ移動
          </Typography.Text>
        </Space>
      </div>

      {/* Main Workflow Guide - 改善版 */}
      <Card
        title={
          <Flex align="center" gap={12}>
            <ThunderboltOutlined style={{ color: "#63dcfa" }} />
            <span>業務フロー</span>
          </Flex>
        }
        style={{ background: "linear-gradient(135deg, #151c2c 0%, #111827 100%)" }}
      >
        <Flex gap={0} wrap="wrap">
          {workflowSteps.map((item) => (
            <Link
              key={item.step}
              href={item.href}
              style={{
                flex: 1,
                minWidth: 160,
              }}
            >
              <Card
                hoverable
                style={{
                  background: "transparent",
                  border:
                    item.count > 0
                      ? `2px solid ${item.statusColor}`
                      : "1px solid rgba(99, 220, 250, 0.1)",
                  margin: "8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                }}
                styles={{ body: { padding: "16px" } }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = item.statusColor;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 4px 12px ${item.statusColor}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    item.count > 0 ? item.statusColor : "rgba(99, 220, 250, 0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Flex vertical gap={12}>
                  {/* ステップ番号と件数バッジ */}
                  <Flex align="center" justify="space-between">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${item.statusColor}, ${item.statusColor}dd)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {item.step}
                    </div>
                    {item.count > 0 && (
                      <Badge
                        count={item.count}
                        style={{
                          backgroundColor: item.statusColor,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Flex>

                  {/* ステップ情報 */}
                  <Space direction="vertical" size={4}>
                    <Flex align="center" gap={8}>
                      <Typography.Text strong style={{ fontSize: 14 }}>
                        {item.label}
                      </Typography.Text>
                    </Flex>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {item.desc}
                    </Typography.Text>
                  </Space>

                  {/* 件数と行動喚起 */}
                  <Flex vertical gap={8}>
                    <Flex align="center" gap={6}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: item.statusColor,
                        }}
                      />
                      <Typography.Text
                        style={{
                          fontSize: 16,
                          color: item.statusColor,
                          fontWeight: 700,
                        }}
                      >
                        {item.count}件
                      </Typography.Text>
                    </Flex>
                    <Typography.Text
                      style={{
                        fontSize: 12,
                        color: item.statusColor,
                        fontWeight: 500,
                      }}
                    >
                      {item.actionLabel}
                    </Typography.Text>
                  </Flex>
                </Flex>
              </Card>
            </Link>
          ))}
        </Flex>
      </Card>

      {/* Stats Grid */}
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: "統計情報",
            children: (
              <Row gutter={[20, 20]}>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: "linear-gradient(135deg, #151c2c 0%, #1a2234 100%)",
                      border: "1px solid rgba(99, 220, 250, 0.2)",
                    }}
                  >
                    <Statistic
                      title={
                        <Flex align="center" gap={8}>
                          <BellOutlined style={{ color: "#63dcfa" }} />
                          <span>登録済み通知</span>
                        </Flex>
                      }
                      value={totalNotices}
                      suffix="件"
                      valueStyle={{ color: "#63dcfa", fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: "linear-gradient(135deg, #151c2c 0%, #1a2234 100%)",
                      border: "1px solid rgba(168, 85, 247, 0.2)",
                    }}
                  >
                    <Statistic
                      title={
                        <Flex align="center" gap={8}>
                          <ClockCircleOutlined style={{ color: "#a855f7" }} />
                          <span>ドラフト作成中</span>
                        </Flex>
                      }
                      value={stats.draft_count}
                      suffix="件"
                      valueStyle={{ color: "#a855f7", fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: "linear-gradient(135deg, #151c2c 0%, #1a2234 100%)",
                      border: "1px solid rgba(34, 197, 94, 0.2)",
                    }}
                  >
                    <Statistic
                      title={
                        <Flex align="center" gap={8}>
                          <FileTextOutlined style={{ color: "#22c55e" }} />
                          <span>レビュー待ち</span>
                        </Flex>
                      }
                      value={stats.review_waiting_count}
                      suffix="件"
                      valueStyle={{ color: "#22c55e", fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: "linear-gradient(135deg, #151c2c 0%, #1a2234 100%)",
                      border: "1px solid rgba(245, 158, 11, 0.2)",
                    }}
                  >
                    <Statistic
                      title={
                        <Flex align="center" gap={8}>
                          <ThunderboltOutlined style={{ color: "#f59e0b" }} />
                          <span>承認待ち</span>
                        </Flex>
                      }
                      value={stats.approval_waiting_count}
                      suffix="件"
                      valueStyle={{ color: "#f59e0b", fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: "linear-gradient(135deg, #151c2c 0%, #1a2234 100%)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    <Statistic
                      title={
                        <Flex align="center" gap={8}>
                          <CheckOutlined style={{ color: "#10b981" }} />
                          <span>承認完了</span>
                        </Flex>
                      }
                      value={stats.approved_count}
                      suffix="件"
                      valueStyle={{ color: "#10b981", fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: "linear-gradient(135deg, #151c2c 0%, #1a2234 100%)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <Statistic
                      title={
                        <Flex align="center" gap={8}>
                          <CloseOutlined style={{ color: "#ef4444" }} />
                          <span>却下</span>
                        </Flex>
                      }
                      value={stats.rejected_count}
                      suffix="件"
                      valueStyle={{ color: "#ef4444", fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: "linear-gradient(135deg, #151c2c 0%, #1a2234 100%)",
                      border:
                        stats.high_risk_count > 0
                          ? "1px solid rgba(239, 68, 68, 0.4)"
                          : "1px solid rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    <Statistic
                      title={
                        <Flex align="center" gap={8}>
                          <WarningOutlined
                            style={{
                              color:
                                stats.high_risk_count > 0 ? "#ef4444" : "#10b981",
                            }}
                          />
                          <span>高リスク案件</span>
                        </Flex>
                      }
                      value={stats.high_risk_count}
                      suffix="件"
                      valueStyle={{
                        color:
                          stats.high_risk_count > 0 ? "#ef4444" : "#10b981",
                        fontWeight: 700,
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "2",
            label: "進捗率",
            children: (
              <Row gutter={[20, 20]}>
                <Col xs={24} lg={12}>
                  <Card
                    style={{
                      background: "linear-gradient(135deg, #151c2c 0%, #111827 100%)",
                      height: "100%",
                    }}
                  >
                    <Flex vertical gap={16} style={{ height: "100%" }}>
                      <Space direction="vertical" size={4}>
                        <Typography.Text style={{ fontSize: 16, fontWeight: 600 }}>
                          処理完了率
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          全通知のうち、承認・配信完了した案件の割合
                        </Typography.Text>
                      </Space>
                      <Flex align="center" justify="center">
                        <Progress
                          type="circle"
                          percent={completionRate}
                          size={120}
                          strokeColor={{
                            "0%": "#63dcfa",
                            "100%": "#3ecbf6",
                          }}
                          trailColor="rgba(99, 220, 250, 0.1)"
                          format={(percent) => (
                            <span
                              style={{
                                color: "#63dcfa",
                                fontWeight: 700,
                                fontSize: 20,
                              }}
                            >
                              {percent}%
                            </span>
                          )}
                        />
                      </Flex>
                      <Space direction="vertical" size={8}>
                        <Flex align="center" gap={8}>
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 3,
                              background: "#10b981",
                            }}
                          />
                          <Typography.Text>
                            完了: {stats.approved_count}件
                          </Typography.Text>
                        </Flex>
                        <Flex align="center" gap={8}>
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 3,
                              background: "#f59e0b",
                            }}
                          />
                          <Typography.Text>
                            進行中: {totalNotices - stats.approved_count - stats.rejected_count}件
                          </Typography.Text>
                        </Flex>
                        <Flex align="center" gap={8}>
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 3,
                              background: "#ef4444",
                            }}
                          />
                          <Typography.Text>却下: {stats.rejected_count}件</Typography.Text>
                        </Flex>
                      </Space>
                    </Flex>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card
                    style={{
                      background: "linear-gradient(135deg, #151c2c 0%, #111827 100%)",
                      height: "100%",
                    }}
                  >
                    <Flex vertical gap={16}>
                      <Typography.Text style={{ fontSize: 16, fontWeight: 600 }}>
                        業務フロー状況
                      </Typography.Text>
                      <Space direction="vertical" size={16} style={{ width: "100%" }}>
                        {[
                          {
                            label: "通知登録",
                            current: totalNotices,
                            total: totalNotices,
                            color: "#63dcfa",
                          },
                          {
                            label: "ドラフト作成",
                            current: stats.draft_count,
                            total: totalNotices,
                            color: "#a855f7",
                          },
                          {
                            label: "レビュー待ち",
                            current: stats.review_waiting_count,
                            total: totalNotices,
                            color: "#22c55e",
                          },
                          {
                            label: "承認待ち",
                            current: stats.approval_waiting_count,
                            total: totalNotices,
                            color: "#f59e0b",
                          },
                          {
                            label: "完了",
                            current: stats.approved_count,
                            total: totalNotices,
                            color: "#10b981",
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <Flex justify="space-between" style={{ marginBottom: 8 }}>
                              <Typography.Text>{item.label}</Typography.Text>
                              <Typography.Text style={{ color: item.color, fontWeight: 600 }}>
                                {item.current}/{item.total}件
                              </Typography.Text>
                            </Flex>
                            <Progress
                              percent={
                                item.total > 0
                                  ? Math.round((item.current / item.total) * 100)
                                  : 0
                              }
                              strokeColor={item.color}
                              trailColor="rgba(255,255,255,0.1)"
                            />
                          </div>
                        ))}
                      </Space>
                    </Flex>
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      {/* Quick Access Tiles */}
      <div>
        <Typography.Title level={4} style={{ marginBottom: 20 }}>
          詳細機能
        </Typography.Title>
        <Row gutter={[20, 20]}>
          {tiles.map((tile) => (
            <Col xs={24} sm={12} lg={6} key={tile.title}>
              <Link href={tile.href} style={{ display: "block" }}>
                <Card
                  hoverable
                  className="dashboard-card"
                  style={{
                    height: "100%",
                    background: tile.gradient,
                    cursor: "pointer",
                  }}
                  styles={{ body: { padding: 24 } }}
                >
                  <Flex vertical gap={16}>
                    <div className={`dashboard-icon ${tile.iconClass}`}>
                      {tile.icon}
                    </div>
                    <div>
                      <Typography.Title level={5} style={{ marginBottom: 8, fontWeight: 600 }}>
                        {tile.title}
                      </Typography.Title>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 13, lineHeight: 1.5 }}
                      >
                        {tile.description}
                      </Typography.Text>
                    </div>
                    <Flex align="center" gap={6} style={{ marginTop: 8 }}>
                      <Typography.Text
                        style={{
                          color: "#63dcfa",
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        開く
                      </Typography.Text>
                      <ArrowRightOutlined style={{ color: "#63dcfa", fontSize: 12 }} />
                    </Flex>
                  </Flex>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
    </Flex>
  );
}

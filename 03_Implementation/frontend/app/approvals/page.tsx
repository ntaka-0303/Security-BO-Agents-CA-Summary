"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Form,
  Input,
  message,
  Radio,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tabs,
  Timeline,
  Typography,
  Empty,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  FileTextOutlined,
  RocketOutlined,
  MailOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

import { api } from "@/lib/apiClient";
import type { ApprovalListResponse, DistributionListResponse, Draft } from "@/lib/types";

type ApprovalFormValues = {
  decision: "approved" | "rejected";
  comment?: string;
};

const APPROVER_ID = "approver.teamlead";

export default function ApprovalsPage() {
  const { data: pendingDrafts, isLoading, mutate } = useSWR("pendingDrafts", api.listPendingDrafts, {
    dedupingInterval: 5_000,
  });
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [form] = Form.useForm<ApprovalFormValues>();

  const { data: approvals, mutate: mutateApprovals } = useSWR<ApprovalListResponse>(
    selectedDraft ? ["approvals", selectedDraft.draft_id] : null,
    () => api.listApprovals(selectedDraft!.draft_id),
  );

  const { data: distributions, mutate: mutateDistributions } = useSWR<DistributionListResponse>(
    selectedDraft ? ["distributions", selectedDraft.draft_id] : null,
    () => api.listDistributions(selectedDraft!.draft_id),
  );

  useEffect(() => {
    if (selectedDraft) {
      form.setFieldsValue({
        decision: "approved",
        comment: "",
      });
    } else {
      form.resetFields();
    }
  }, [selectedDraft, form]);

  const summary = useMemo(() => {
    const drafts = pendingDrafts ?? [];
    const highRisk = drafts.filter((draft) => draft.risk_flag === "Y").length;
    const overdue = drafts.filter((draft) => {
      const updated = new Date(draft.updated_at);
      const diffHours = (Date.now() - updated.getTime()) / 3_600_000;
      return diffHours > 24;
    }).length;
    return {
      total: drafts.length,
      highRisk,
      overdue,
    };
  }, [pendingDrafts]);

  const columns: ColumnsType<Draft> = [
    {
      title: "通知ID",
      dataIndex: "ca_notice_id",
      ellipsis: true,
      render: (id: string) => (
        <Typography.Text
          style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
        >
          {id}
        </Typography.Text>
      ),
    },
    {
      title: "Ver",
      dataIndex: "version_no",
      width: 60,
      align: "center",
      render: (value: number) => (
        <Tag style={{ margin: 0 }}>v{value}</Tag>
      ),
    },
    {
      title: "リスク",
      dataIndex: "risk_flag",
      width: 80,
      align: "center",
      render: (value: string) => (
        <Tag
          style={{
            background: value === "Y" ? "#ef444420" : "#10b98120",
            borderColor: value === "Y" ? "#ef4444" : "#10b981",
            color: value === "Y" ? "#ef4444" : "#10b981",
            margin: 0,
          }}
        >
          {value === "Y" ? <WarningOutlined /> : <CheckCircleOutlined />}
        </Tag>
      ),
    },
    {
      title: "更新",
      dataIndex: "updated_at",
      width: 100,
      render: (value: string) => {
        const date = new Date(value);
        const diffHours = (Date.now() - date.getTime()) / 3_600_000;
        const isOverdue = diffHours > 24;
        return (
          <Typography.Text
            type={isOverdue ? "danger" : "secondary"}
            style={{ fontSize: 11 }}
          >
            {date.toLocaleDateString("ja-JP")}
          </Typography.Text>
        );
      },
    },
  ];

  const handleApprove = async () => {
    if (!selectedDraft) {
      message.warning("承認対象を選択してください");
      return;
    }
    try {
      const values = await form.validateFields();
      if (values.decision === "rejected" && (!values.comment || values.comment.length < 50)) {
        message.error("差戻し時は50文字以上のコメントが必須です。");
        return;
      }
      const response = await api.decideApproval(selectedDraft.draft_id, {
        approver_id: APPROVER_ID,
        decision: values.decision,
        comment: values.comment,
      });
      message.success(`ドラフト ${response.draft_id} を${values.decision === "approved" ? "承認" : "差戻し"}しました`);
      mutate();
      mutateApprovals();
      setSelectedDraft(response);
    } catch (error) {
      message.error((error as Error).message || "承認操作に失敗しました");
    }
  };

  const handleSendDistribution = async () => {
    if (!selectedDraft) {
      return;
    }
    try {
      await api.sendDistribution(selectedDraft.draft_id, {
        channel_type: "email",
        requested_by: APPROVER_ID,
      });
      message.success("配信をキューに投入しました");
      mutateDistributions();
    } catch (error) {
      message.error((error as Error).message || "配信に失敗しました");
    }
  };

  return (
    <Flex vertical gap={24}>
      {/* Header */}
      <Space direction="vertical" size={4}>
        <Typography.Title level={3} style={{ marginBottom: 0, fontWeight: 700 }}>
          承認・配信コントロール
        </Typography.Title>
        <Typography.Text type="secondary">
          上長承認と顧客向け通知配信を管理
        </Typography.Text>
      </Space>

      {/* Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: "linear-gradient(135deg, rgba(99, 220, 250, 0.08), transparent)",
              borderColor: "rgba(99, 220, 250, 0.2)",
            }}
          >
            <Statistic
              title={
                <Flex align="center" gap={8}>
                  <ClockCircleOutlined style={{ color: "#63dcfa" }} />
                  <span>承認待ち</span>
                </Flex>
              }
              value={summary.total}
              suffix="件"
              valueStyle={{ color: "#63dcfa", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08), transparent)",
              borderColor: summary.highRisk > 0 ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.2)",
            }}
          >
            <Statistic
              title={
                <Flex align="center" gap={8}>
                  <WarningOutlined style={{ color: "#ef4444" }} />
                  <span>高リスク</span>
                </Flex>
              }
              value={summary.highRisk}
              suffix="件"
              valueStyle={{ color: "#ef4444", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), transparent)",
              borderColor: summary.overdue > 0 ? "rgba(245, 158, 11, 0.4)" : "rgba(245, 158, 11, 0.2)",
            }}
          >
            <Statistic
              title={
                <Flex align="center" gap={8}>
                  <ThunderboltOutlined style={{ color: "#f59e0b" }} />
                  <span>期限超過 (24h+)</span>
                </Flex>
              }
              value={summary.overdue}
              suffix="件"
              valueStyle={{ color: "#f59e0b", fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={20}>
        {/* Left Panel - Queue */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <ClockCircleOutlined style={{ color: "#63dcfa" }} />
                <span>承認キュー</span>
                <Tag style={{ marginLeft: 8 }}>{pendingDrafts?.length ?? 0}件</Tag>
              </Flex>
            }
            styles={{ body: { padding: 0 } }}
          >
            <Table
              rowKey="draft_id"
              loading={isLoading}
              columns={columns}
              dataSource={pendingDrafts}
              size="small"
              pagination={false}
              scroll={{ y: 400 }}
              onRow={(record) => ({
                onClick: () => setSelectedDraft(record),
                style: {
                  cursor: "pointer",
                  background: record.draft_id === selectedDraft?.draft_id
                    ? "var(--color-accent-muted)"
                    : "transparent",
                },
              })}
            />
          </Card>
        </Col>

        {/* Right Panel - Approval Details */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <CheckCircleOutlined style={{ color: "#10b981" }} />
                <span>承認詳細</span>
              </Flex>
            }
          >
            {selectedDraft ? (
              <Space direction="vertical" size={20} style={{ width: "100%" }}>
                {/* Draft Info */}
                <Descriptions
                  size="small"
                  column={{ xs: 1, sm: 2 }}
                  style={{
                    background: "var(--color-bg-tertiary)",
                    padding: 16,
                    borderRadius: 10,
                  }}
                >
                  <Descriptions.Item label="ドラフトID">
                    <Typography.Text code style={{ fontSize: 11 }}>
                      {selectedDraft.draft_id}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="CA通知ID">
                    <Typography.Text code style={{ fontSize: 11 }}>
                      {selectedDraft.ca_notice_id}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="バージョン">
                    v{selectedDraft.version_no}
                  </Descriptions.Item>
                  <Descriptions.Item label="リスク">
                    <Tag
                      style={{
                        background: selectedDraft.risk_flag === "Y" ? "#ef444420" : "#10b98120",
                        borderColor: selectedDraft.risk_flag === "Y" ? "#ef4444" : "#10b981",
                        color: selectedDraft.risk_flag === "Y" ? "#ef4444" : "#10b981",
                      }}
                    >
                      {selectedDraft.risk_flag === "Y" ? (
                        <>
                          <WarningOutlined /> 高リスク
                        </>
                      ) : (
                        <>
                          <CheckCircleOutlined /> 通常
                        </>
                      )}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>

                {/* Tabs */}
                <Tabs
                  items={[
                    {
                      key: "draft",
                      label: (
                        <Flex align="center" gap={6}>
                          <FileTextOutlined />
                          ドラフト本文
                        </Flex>
                      ),
                      children: (
                        <Card
                          size="small"
                          style={{
                            background: "var(--color-bg-tertiary)",
                            maxHeight: 200,
                            overflow: "auto",
                          }}
                        >
                          <Typography.Paragraph
                            style={{ marginBottom: 0, whiteSpace: "pre-wrap", lineHeight: 1.8 }}
                          >
                            {selectedDraft.edited_text}
                          </Typography.Paragraph>
                        </Card>
                      ),
                    },
                    {
                      key: "history",
                      label: (
                        <Flex align="center" gap={6}>
                          <HistoryOutlined />
                          承認履歴
                        </Flex>
                      ),
                      children: approvals ? (
                        approvals.items.length > 0 ? (
                          <Timeline
                            items={approvals.items.map((item) => ({
                              color: item.decision === "approved" ? "#10b981" : "#ef4444",
                              dot: item.decision === "approved" ? (
                                <CheckCircleOutlined style={{ fontSize: 14 }} />
                              ) : (
                                <CloseCircleOutlined style={{ fontSize: 14 }} />
                              ),
                              children: (
                                <Space direction="vertical" size={2}>
                                  <Flex align="center" gap={8}>
                                    <Tag
                                      style={{
                                        background: item.decision === "approved" ? "#10b98120" : "#ef444420",
                                        borderColor: item.decision === "approved" ? "#10b981" : "#ef4444",
                                        color: item.decision === "approved" ? "#10b981" : "#ef4444",
                                      }}
                                    >
                                      {item.decision === "approved" ? "承認" : "差戻し"}
                                    </Tag>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                      {item.approver_id}
                                    </Typography.Text>
                                  </Flex>
                                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                    {new Date(item.decision_at).toLocaleString("ja-JP")}
                                  </Typography.Text>
                                  {item.approval_comment && (
                                    <Typography.Text style={{ fontSize: 12 }}>
                                      {item.approval_comment}
                                    </Typography.Text>
                                  )}
                                </Space>
                              ),
                            }))}
                          />
                        ) : (
                          <Empty description="承認履歴はありません" />
                        )
                      ) : (
                        <Typography.Text type="secondary">読み込み中…</Typography.Text>
                      ),
                    },
                    {
                      key: "distribution",
                      label: (
                        <Flex align="center" gap={6}>
                          <MailOutlined />
                          配信ログ
                        </Flex>
                      ),
                      children: distributions ? (
                        distributions.items.length > 0 ? (
                          <Space direction="vertical" style={{ width: "100%" }} size={12}>
                            {distributions.items.map((item) => (
                              <Card
                                key={item.distribution_id}
                                size="small"
                                style={{
                                  background: "var(--color-bg-tertiary)",
                                }}
                              >
                                <Flex align="center" justify="space-between">
                                  <Flex align="center" gap={8}>
                                    <MailOutlined style={{ color: "#63dcfa" }} />
                                    <Typography.Text>
                                      {item.channel_type}
                                    </Typography.Text>
                                    <Tag
                                      style={{
                                        background: item.distribution_status === "sent" ? "#10b98120" : "#f59e0b20",
                                        borderColor: item.distribution_status === "sent" ? "#10b981" : "#f59e0b",
                                        color: item.distribution_status === "sent" ? "#10b981" : "#f59e0b",
                                      }}
                                    >
                                      {item.distribution_status}
                                    </Tag>
                                  </Flex>
                                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                    {item.sent_at
                                      ? new Date(item.sent_at).toLocaleString("ja-JP")
                                      : "未送信"}
                                  </Typography.Text>
                                </Flex>
                                {item.result_detail && (
                                  <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
                                    {item.result_detail}
                                  </Typography.Text>
                                )}
                              </Card>
                            ))}
                          </Space>
                        ) : (
                          <Empty description="配信ログはありません" />
                        )
                      ) : (
                        <Typography.Text type="secondary">読み込み中…</Typography.Text>
                      ),
                    },
                  ]}
                />

                {/* Approval Form */}
                <Card
                  size="small"
                  title={
                    <Typography.Text style={{ fontSize: 14 }}>
                      承認アクション
                    </Typography.Text>
                  }
                  style={{ background: "var(--color-bg-tertiary)" }}
                >
                  <Form form={form} layout="vertical">
                    <Form.Item
                      name="decision"
                      label="決裁"
                      rules={[{ required: true, message: "承認/差戻しを選択してください" }]}
                    >
                      <Radio.Group size="large">
                        <Radio.Button value="approved">
                          <CheckCircleOutlined style={{ marginRight: 4, color: "#10b981" }} />
                          承認
                        </Radio.Button>
                        <Radio.Button value="rejected">
                          <CloseCircleOutlined style={{ marginRight: 4, color: "#ef4444" }} />
                          差戻し
                        </Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item
                      name="comment"
                      label="コメント"
                      extra="差戻し時は50文字以上が必須"
                    >
                      <Input.TextArea
                        rows={3}
                        maxLength={2000}
                        placeholder="承認理由や差戻しの指摘事項を記載"
                      />
                    </Form.Item>
                  </Form>
                </Card>

                {/* Action Buttons */}
                <Flex gap={12}>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    size="large"
                    onClick={handleApprove}
                  >
                    承認／差戻しを登録
                  </Button>
                  <Button
                    icon={<RocketOutlined />}
                    size="large"
                    disabled={selectedDraft.approval_status !== "approved"}
                    onClick={handleSendDistribution}
                  >
                    配信を送信
                  </Button>
                </Flex>

                {selectedDraft.approval_status !== "approved" && (
                  <Alert
                    type="info"
                    message="配信は承認済みのドラフトのみ実行できます"
                    showIcon
                    style={{
                      background: "rgba(99, 220, 250, 0.1)",
                      borderColor: "rgba(99, 220, 250, 0.3)",
                    }}
                  />
                )}
              </Space>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size={4}>
                    <Typography.Text type="secondary">
                      左の一覧から案件を選択してください
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      選択後、承認・差戻し・配信が可能です
                    </Typography.Text>
                  </Space>
                }
                style={{ padding: 80 }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </Flex>
  );
}

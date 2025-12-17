"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  message,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Timeline,
  Typography,
  Empty,
  Spin,
  Alert,
} from "antd";
import {
  RobotOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  HistoryOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SendOutlined,
  ReloadOutlined,
  UserOutlined,
  BankOutlined,
  TagOutlined,
} from "@ant-design/icons";

import { api } from "@/lib/apiClient";
import type { AIResponse, Notice } from "@/lib/types";

type AiFormValues = {
  template_type: string;
  customer_segment: string;
  instructions?: string;
};

const templateOptions = [
  { value: "standard", label: "標準", icon: <FileTextOutlined />, color: "#63dcfa" },
  { value: "urgent", label: "至急", icon: <ThunderboltOutlined />, color: "#f59e0b" },
  { value: "premium", label: "プレミアム", icon: <CheckCircleOutlined />, color: "#a855f7" },
];

const segmentOptions = [
  { value: "retail", label: "リテール", icon: <UserOutlined />, desc: "個人投資家向け" },
  { value: "HNWI", label: "富裕層(HNWI)", icon: <BankOutlined />, desc: "高純資産層向け" },
  { value: "institutional", label: "機関投資家", icon: <BankOutlined />, desc: "法人・機関向け" },
];

const CREATED_BY = "demo.operator";

export default function AiWorkbenchPage() {
  const { data: notices, isLoading: noticesLoading } = useSWR("notices", api.listNotices, {
    dedupingInterval: 10_000,
  });
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [form] = Form.useForm<AiFormValues>();
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: drafts } = useSWR(
    selectedNotice ? ["drafts", selectedNotice.ca_notice_id] : null,
    () => api.listDrafts(selectedNotice!.ca_notice_id),
  );

  const sortedNotices = useMemo(() => {
    return (notices ?? []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [notices]);

  const handleSelectNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    setAiResult(null);
    form.resetFields();
  };

  const handleGenerate = async () => {
    if (!selectedNotice) {
      message.warning("左ペインからCA通知を選択してください");
      return;
    }
    try {
      const values = await form.validateFields();
      setLoading(true);
      const result = await api.createAIRequest({
        ca_notice_id: selectedNotice.ca_notice_id,
        template_type: values.template_type,
        customer_segment: values.customer_segment,
        instructions: values.instructions,
        created_by: CREATED_BY,
      });
      setAiResult(result);
      message.success("AI生成が完了しました");
    } catch (error) {
      if ((error as Error).message) {
        message.error((error as Error).message);
      } else {
        message.error("AIリクエストに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex vertical gap={24}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
        <Space direction="vertical" size={4}>
          <Typography.Title level={3} style={{ marginBottom: 0, fontWeight: 700 }}>
            AI生成ワークベンチ
          </Typography.Title>
          <Typography.Text type="secondary">
            CA通知から要約・顧客向けドラフトを自動生成
          </Typography.Text>
        </Space>
        {selectedNotice && (
          <Tag
            style={{
              padding: "8px 16px",
              fontSize: 14,
              background: "var(--color-accent-muted)",
              borderColor: "var(--color-accent)",
              color: "var(--color-accent)",
            }}
          >
            <BankOutlined style={{ marginRight: 8 }} />
            {selectedNotice.security_name}
          </Tag>
        )}
      </Flex>

      <Row gutter={20}>
        {/* Left Panel - Notice List */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <FileTextOutlined style={{ color: "#63dcfa" }} />
                <span>CA通知一覧</span>
                <Tag style={{ marginLeft: 8 }}>{sortedNotices.length}件</Tag>
              </Flex>
            }
            loading={noticesLoading}
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ maxHeight: 440, overflow: "auto" }}>
              {sortedNotices.length > 0 ? (
                sortedNotices.map((notice) => {
                  const active = selectedNotice?.ca_notice_id === notice.ca_notice_id;
                  return (
                    <div
                      key={notice.ca_notice_id}
                      onClick={() => handleSelectNotice(notice)}
                      style={{
                        padding: "16px 20px",
                        cursor: "pointer",
                        background: active ? "var(--color-accent-muted)" : "transparent",
                        borderLeft: active ? "3px solid var(--color-accent)" : "3px solid transparent",
                        borderBottom: "1px solid var(--color-border-subtle)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        <Flex align="center" justify="space-between">
                          <Typography.Text strong>{notice.security_name}</Typography.Text>
                          <Badge
                            status={notice.notice_status === "ai-generated" ? "success" : "processing"}
                            text={
                              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                {notice.notice_status}
                              </Typography.Text>
                            }
                          />
                        </Flex>
                        <Flex align="center" gap={8}>
                          <Tag
                            style={{
                              background: "rgba(99, 220, 250, 0.1)",
                              borderColor: "rgba(99, 220, 250, 0.3)",
                              color: "#63dcfa",
                              fontSize: 11,
                            }}
                          >
                            <TagOutlined style={{ marginRight: 4 }} />
                            {notice.ca_event_type}
                          </Tag>
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            {notice.security_code}
                          </Typography.Text>
                        </Flex>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                        >
                          {notice.ca_notice_id}
                        </Typography.Text>
                      </Space>
                    </div>
                  );
                })
              ) : (
                <Empty
                  description="CA通知が登録されていません"
                  style={{ padding: 48 }}
                />
              )}
            </div>
          </Card>

          {/* Generation History */}
          <Card
            title={
              <Flex align="center" gap={8}>
                <HistoryOutlined style={{ color: "#a855f7" }} />
                <span>生成履歴</span>
              </Flex>
            }
            style={{ marginTop: 20 }}
            styles={{ body: { maxHeight: 200, overflow: "auto" } }}
          >
            {selectedNotice ? (
              drafts && drafts.length > 0 ? (
                <Timeline
                  items={drafts.slice(0, 5).map((draft) => ({
                    color: draft.risk_flag === "Y" ? "#ef4444" : "#10b981",
                    children: (
                      <Space direction="vertical" size={0}>
                        <Flex align="center" gap={8}>
                          <Typography.Text strong style={{ fontSize: 13 }}>
                            v{draft.version_no}
                          </Typography.Text>
                          <Tag
                            style={{
                              fontSize: 10,
                              background: draft.approval_status === "approved"
                                ? "#10b98120"
                                : "var(--color-bg-tertiary)",
                              borderColor: draft.approval_status === "approved"
                                ? "#10b981"
                                : "var(--color-border)",
                              color: draft.approval_status === "approved"
                                ? "#10b981"
                                : "var(--color-text-secondary)",
                            }}
                          >
                            {draft.approval_status}
                          </Tag>
                        </Flex>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {draft.editor_id} · {new Date(draft.updated_at).toLocaleString("ja-JP")}
                        </Typography.Text>
                      </Space>
                    ),
                  }))}
                />
              ) : (
                <Typography.Text type="secondary">履歴がありません</Typography.Text>
              )
            ) : (
              <Typography.Text type="secondary">通知を選択すると履歴が表示されます</Typography.Text>
            )}
          </Card>
        </Col>

        {/* Right Panel - AI Generation */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <RobotOutlined style={{ color: "#a855f7" }} />
                <span>AI条件設定</span>
              </Flex>
            }
            extra={
              selectedNotice && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {selectedNotice.ca_notice_id}
                </Typography.Text>
              )
            }
          >
            {selectedNotice ? (
              <Spin spinning={loading} tip="AI生成中...">
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{
                    template_type: "standard",
                    customer_segment: "retail",
                  }}
                >
                  <Form.Item
                    name="template_type"
                    label={
                      <Flex align="center" gap={6}>
                        <FileTextOutlined />
                        テンプレート種別
                      </Flex>
                    }
                    rules={[{ required: true }]}
                  >
                    <Select
                      size="large"
                      options={templateOptions.map((opt) => ({
                        value: opt.value,
                        label: (
                          <Flex align="center" gap={8}>
                            <span style={{ color: opt.color }}>{opt.icon}</span>
                            {opt.label}
                          </Flex>
                        ),
                      }))}
                    />
                  </Form.Item>

                  <Form.Item
                    name="customer_segment"
                    label={
                      <Flex align="center" gap={6}>
                        <UserOutlined />
                        顧客セグメント
                      </Flex>
                    }
                    rules={[{ required: true }]}
                  >
                    <Radio.Group size="large" style={{ width: "100%" }}>
                      <Flex gap={12} wrap="wrap">
                        {segmentOptions.map((opt) => (
                          <Radio.Button
                            key={opt.value}
                            value={opt.value}
                            style={{ flex: 1, minWidth: 120, textAlign: "center", height: 48 }}
                          >
                            <Flex vertical align="center" justify="center" style={{ height: "100%" }}>
                              <span>{opt.label}</span>
                            </Flex>
                          </Radio.Button>
                        ))}
                      </Flex>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    name="instructions"
                    label={
                      <Flex align="center" gap={6}>
                        <ThunderboltOutlined />
                        追加指示（オプション）
                      </Flex>
                    }
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="例: 重要な日付を1行目に明記してください"
                      maxLength={2000}
                    />
                  </Form.Item>

                  <Flex gap={12}>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      size="large"
                      onClick={handleGenerate}
                      loading={loading}
                    >
                      AI生成を実行
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      size="large"
                      onClick={() => form.resetFields()}
                      disabled={loading}
                    >
                      条件リセット
                    </Button>
                  </Flex>
                </Form>
              </Spin>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size={4}>
                    <Typography.Text type="secondary">
                      左のリストからCA通知を選択してください
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      選択後、AI生成条件を設定できます
                    </Typography.Text>
                  </Space>
                }
                style={{ padding: 60 }}
              />
            )}
          </Card>

          {/* AI Result */}
          {aiResult && (
            <Card
              title={
                <Flex align="center" gap={8}>
                  <CheckCircleOutlined style={{ color: "#10b981" }} />
                  <span>AI生成結果</span>
                </Flex>
              }
              style={{ marginTop: 20 }}
              extra={
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  モデル: {aiResult.model_version} / Draft v{aiResult.draft_version}
                </Typography.Text>
              }
            >
              <Space direction="vertical" size={20} style={{ width: "100%" }}>
                {/* Risk Assessment */}
                <Alert
                  type={aiResult.risk_flag === "Y" ? "error" : "success"}
                  icon={aiResult.risk_flag === "Y" ? <WarningOutlined /> : <CheckCircleOutlined />}
                  message={
                    <Flex align="center" justify="space-between">
                      <span>リスク判定: {aiResult.risk_flag === "Y" ? "高リスク" : "低リスク"}</span>
                      <Flex gap={8}>
                        {(aiResult.risk_tokens?.split(",") ?? [])
                          .filter((token) => token.trim())
                          .map((token) => (
                            <Tag key={token} color="error">
                              {token.trim()}
                            </Tag>
                          ))}
                        {(!aiResult.risk_tokens || !aiResult.risk_tokens.trim()) && (
                          <Tag color="success">リスク検出なし</Tag>
                        )}
                      </Flex>
                    </Flex>
                  }
                  showIcon
                  style={{
                    background: aiResult.risk_flag === "Y" ? "#ef444410" : "#10b98110",
                    border: `1px solid ${aiResult.risk_flag === "Y" ? "#ef444440" : "#10b98140"}`,
                  }}
                />

                <Divider style={{ margin: "8px 0" }} />

                {/* Internal Summary */}
                <div>
                  <Typography.Title level={5} style={{ marginBottom: 12 }}>
                    <FileTextOutlined style={{ marginRight: 8, color: "#63dcfa" }} />
                    社内要約
                  </Typography.Title>
                  <Card
                    size="small"
                    style={{
                      background: "var(--color-bg-tertiary)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <Typography.Paragraph style={{ marginBottom: 0, lineHeight: 1.8 }}>
                      {aiResult.internal_summary}
                    </Typography.Paragraph>
                  </Card>
                </div>

                <Divider style={{ margin: "8px 0" }} />

                {/* Customer Draft */}
                <div>
                  <Typography.Title level={5} style={{ marginBottom: 12 }}>
                    <UserOutlined style={{ marginRight: 8, color: "#a855f7" }} />
                    顧客向けドラフト
                  </Typography.Title>
                  <Card
                    size="small"
                    style={{
                      background: "var(--color-bg-tertiary)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <Typography.Paragraph
                      style={{ marginBottom: 0, lineHeight: 1.8, whiteSpace: "pre-wrap" }}
                    >
                      {aiResult.customer_draft}
                    </Typography.Paragraph>
                  </Card>
                </div>
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </Flex>
  );
}

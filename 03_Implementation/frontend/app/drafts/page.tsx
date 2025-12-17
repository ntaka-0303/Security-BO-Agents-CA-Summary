"use client";

import { useEffect, useState } from "react";
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
  Tag,
  Typography,
  Empty,
  Tooltip,
} from "antd";
import {
  FileTextOutlined,
  HistoryOutlined,
  SaveOutlined,
  SendOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EditOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

import { api } from "@/lib/apiClient";
import type { Draft } from "@/lib/types";

type DraftFormValues = {
  edited_text: string;
  risk_flag: "N" | "Y";
  review_comment?: string;
};

const EDITOR_ID = "drafter.user";
const SUBMITTER_ID = "drafter.user";

export default function DraftsPage() {
  const {
    data: reviewDrafts,
    isLoading,
    mutate: mutateReviewDrafts,
  } = useSWR("reviewDrafts", () => api.listPendingDrafts({ includeDrafts: true }), {
    dedupingInterval: 5_000,
  });
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [form] = Form.useForm<DraftFormValues>();
  const { data: history, mutate: mutateHistory } = useSWR(
    selectedDraft ? ["draftHistory", selectedDraft.ca_notice_id] : null,
    () => api.listDrafts(selectedDraft!.ca_notice_id),
  );

  useEffect(() => {
    if (selectedDraft) {
      form.setFieldsValue({
        edited_text: selectedDraft.edited_text,
        risk_flag: selectedDraft.risk_flag,
        review_comment: selectedDraft.review_comment ?? "",
      });
    } else {
      form.resetFields();
    }
  }, [selectedDraft, form]);

  const handleSelect = (draft: Draft) => {
    setSelectedDraft(draft);
  };

  const handleSave = async () => {
    if (!selectedDraft) {
      message.warning("ドラフトを選択してください。");
      return;
    }
    try {
      const values = await form.validateFields();
      if (values.risk_flag === "Y" && !values.review_comment) {
        message.error("高リスク時はレビューコメントが必須です。");
        return;
      }
      const response = await api.saveDraft(selectedDraft.ca_notice_id, {
        editor_id: EDITOR_ID,
        edited_text: values.edited_text,
        ai_output_id: selectedDraft.ai_output_id ?? undefined,
        risk_flag: values.risk_flag,
        review_comment: values.review_comment,
      });
      message.success(`ドラフト v${response.version_no} を保存しました`);
      mutateReviewDrafts();
      mutateHistory();
      setSelectedDraft(response);
    } catch (error) {
      message.error((error as Error).message || "保存に失敗しました");
    }
  };

  const handleSubmit = async () => {
    if (!selectedDraft) {
      message.warning("ドラフトを選択してください。");
      return;
    }
    try {
      const values = await form.validateFields();
      if (values.risk_flag === "Y" && !values.review_comment) {
        message.error("高リスク時はレビューコメントが必須です。");
        return;
      }
      const response = await api.submitDraft(selectedDraft.draft_id, {
        submitted_by: SUBMITTER_ID,
        risk_flag: values.risk_flag,
        comment: values.review_comment,
      });
      message.success("承認依頼を送信しました");
      mutateReviewDrafts();
      mutateHistory();
      setSelectedDraft(response);
    } catch (error) {
      message.error((error as Error).message || "承認依頼に失敗しました");
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      draft: { color: "#63dcfa", icon: <EditOutlined />, label: "編集中" },
      pending: { color: "#f59e0b", icon: <ClockCircleOutlined />, label: "承認待ち" },
      approved: { color: "#10b981", icon: <CheckCircleOutlined />, label: "承認済み" },
      rejected: { color: "#ef4444", icon: <WarningOutlined />, label: "差戻し" },
    };
    return configs[status] ?? configs.draft;
  };

  return (
    <Flex vertical gap={24}>
      {/* Header */}
      <Space direction="vertical" size={4}>
        <Typography.Title level={3} style={{ marginBottom: 0, fontWeight: 700 }}>
          ドラフトレビュー
        </Typography.Title>
        <Typography.Text type="secondary">
          AIドラフトを確認・修正し、承認依頼を送信
        </Typography.Text>
      </Space>

      <Row gutter={20}>
        {/* Left Panel - Draft List */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <FileTextOutlined style={{ color: "#63dcfa" }} />
                <span>要対応ドラフト</span>
                <Tag style={{ marginLeft: 8 }}>{reviewDrafts?.length ?? 0}件</Tag>
              </Flex>
            }
            loading={isLoading}
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ maxHeight: 480, overflow: "auto" }}>
              {(reviewDrafts ?? []).length > 0 ? (
                (reviewDrafts ?? []).map((draft) => {
                  const active = draft.draft_id === selectedDraft?.draft_id;
                  const statusConfig = getStatusConfig(draft.approval_status);
                  return (
                    <div
                      key={draft.draft_id}
                      onClick={() => handleSelect(draft)}
                      className={`list-item ${active ? "active" : ""}`}
                      style={{
                        padding: "16px 20px",
                        cursor: "pointer",
                        background: active ? "var(--color-accent-muted)" : "transparent",
                        borderLeft: active ? "3px solid var(--color-accent)" : "3px solid transparent",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        <Flex align="center" justify="space-between">
                          <Typography.Text strong style={{ fontSize: 14 }}>
                            {draft.ca_notice_id}
                          </Typography.Text>
                          <Tag
                            style={{
                              background: `${draft.risk_flag === "Y" ? "#ef4444" : "#10b981"}20`,
                              borderColor: draft.risk_flag === "Y" ? "#ef4444" : "#10b981",
                              color: draft.risk_flag === "Y" ? "#ef4444" : "#10b981",
                            }}
                          >
                            {draft.risk_flag === "Y" ? (
                              <>
                                <WarningOutlined /> 高リスク
                              </>
                            ) : (
                              "通常"
                            )}
                          </Tag>
                        </Flex>
                        <Flex align="center" gap={12}>
                          <Tag
                            style={{
                              background: `${statusConfig.color}20`,
                              borderColor: statusConfig.color,
                              color: statusConfig.color,
                            }}
                          >
                            {statusConfig.icon} {statusConfig.label}
                          </Tag>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            v{draft.version_no}
                          </Typography.Text>
                        </Flex>
                        <Typography.Paragraph
                          ellipsis={{ rows: 2 }}
                          style={{ marginBottom: 0, fontSize: 13, color: "var(--color-text-secondary)" }}
                        >
                          {draft.edited_text}
                        </Typography.Paragraph>
                      </Space>
                    </div>
                  );
                })
              ) : (
                <Empty
                  description="対応待ちのドラフトはありません"
                  style={{ padding: 48 }}
                />
              )}
            </div>
          </Card>

          {/* Version History */}
          <Card
            title={
              <Flex align="center" gap={8}>
                <HistoryOutlined style={{ color: "#a855f7" }} />
                <span>バージョン履歴</span>
              </Flex>
            }
            style={{ marginTop: 20 }}
            styles={{ body: { maxHeight: 240, overflow: "auto" } }}
          >
            {selectedDraft ? (
              history && history.length > 0 ? (
                <Space direction="vertical" style={{ width: "100%" }} size={0}>
                  {history.map((draft, index) => {
                    const statusConfig = getStatusConfig(draft.approval_status);
                    return (
                      <div
                        key={draft.draft_id}
                        style={{
                          padding: "12px 0",
                          borderBottom: index < history.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                        }}
                      >
                        <Flex align="center" justify="space-between">
                          <Flex align="center" gap={8}>
                            <Typography.Text strong>v{draft.version_no}</Typography.Text>
                            <Tag
                              style={{
                                background: `${statusConfig.color}20`,
                                borderColor: statusConfig.color,
                                color: statusConfig.color,
                                fontSize: 11,
                              }}
                            >
                              {statusConfig.label}
                            </Tag>
                          </Flex>
                          <Badge
                            status={draft.risk_flag === "Y" ? "error" : "processing"}
                            text={
                              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                {draft.risk_flag === "Y" ? "高リスク" : "通常"}
                              </Typography.Text>
                            }
                          />
                        </Flex>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {draft.editor_id} · {new Date(draft.updated_at).toLocaleString("ja-JP")}
                        </Typography.Text>
                      </div>
                    );
                  })}
                </Space>
              ) : (
                <Typography.Text type="secondary">履歴がありません</Typography.Text>
              )
            ) : (
              <Typography.Text type="secondary">ドラフトを選択してください</Typography.Text>
            )}
          </Card>
        </Col>

        {/* Right Panel - Draft Editor */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <EditOutlined style={{ color: "#10b981" }} />
                <span>ドラフト編集</span>
                {selectedDraft && (
                  <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
                    {selectedDraft.ca_notice_id}
                  </Typography.Text>
                )}
              </Flex>
            }
          >
            {selectedDraft ? (
              <Space direction="vertical" size={24} style={{ width: "100%" }}>
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
                    <Typography.Text code style={{ fontSize: 12 }}>
                      {selectedDraft.draft_id}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="バージョン">
                    v{selectedDraft.version_no}
                  </Descriptions.Item>
                  <Descriptions.Item label="AI出力ID">
                    {selectedDraft.ai_output_id ?? "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="最終更新">
                    {new Date(selectedDraft.updated_at).toLocaleString("ja-JP")}
                  </Descriptions.Item>
                </Descriptions>

                {/* Edit Form */}
                <Form form={form} layout="vertical">
                  <Form.Item
                    name="edited_text"
                    label={
                      <Flex align="center" gap={6}>
                        <FileTextOutlined />
                        顧客向けドラフト本文
                      </Flex>
                    }
                    rules={[
                      { required: true, message: "ドラフト本文は必須です" },
                      { min: 20, message: "20文字以上で入力してください" },
                    ]}
                  >
                    <Input.TextArea
                      rows={12}
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 14,
                        lineHeight: 1.7,
                      }}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="risk_flag"
                        label={
                          <Flex align="center" gap={6}>
                            <WarningOutlined />
                            リスク判定
                          </Flex>
                        }
                        rules={[{ required: true }]}
                      >
                        <Radio.Group size="large">
                          <Radio.Button value="N">
                            <CheckCircleOutlined style={{ marginRight: 4 }} />
                            通常
                          </Radio.Button>
                          <Radio.Button value="Y">
                            <WarningOutlined style={{ marginRight: 4 }} />
                            高リスク
                          </Radio.Button>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="review_comment"
                    label="レビューコメント"
                    extra="高リスク判定時は必須入力"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="修正理由やレビュー時の注意点を記載"
                      maxLength={1000}
                    />
                  </Form.Item>
                </Form>

                {/* Action Buttons */}
                <Flex gap={12}>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    size="large"
                    onClick={handleSave}
                  >
                    保存
                  </Button>
                  <Tooltip title="保存後に承認依頼を送信します">
                    <Button
                      icon={<SendOutlined />}
                      size="large"
                      onClick={handleSubmit}
                    >
                      承認依頼
                    </Button>
                  </Tooltip>
                </Flex>
              </Space>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size={4}>
                    <Typography.Text type="secondary">
                      左のリストからドラフトを選択してください
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      選択後、内容の確認・編集が可能です
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

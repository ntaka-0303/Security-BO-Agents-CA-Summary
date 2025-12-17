"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Badge,
  Button,
  DatePicker,
  Drawer,
  Flex,
  Form,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Card,
  Statistic,
  Row,
  Col,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BankOutlined,
  TagOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { api } from "@/lib/apiClient";
import type { Notice } from "@/lib/types";

const eventOptions = [
  "配当",
  "減配",
  "株式分割",
  "TOB",
  "償還",
  "新株発行",
  "優先株発行",
  "株式移転",
];

const eventColorMap: Record<string, string> = {
  配当: "#10b981",
  減配: "#ef4444",
  株式分割: "#a855f7",
  TOB: "#f59e0b",
  償還: "#3b82f6",
  新株発行: "#63dcfa",
  優先株発行: "#ec4899",
  株式移転: "#8b5cf6",
};

type NoticeFormValues = {
  ca_notice_id: string;
  security_code: string;
  security_name: string;
  ca_event_type: string;
  record_date: dayjs.Dayjs;
  payment_date?: dayjs.Dayjs;
  notice_text: string;
};

export default function NoticesPage() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<NoticeFormValues>();
  const { data, isLoading, mutate } = useSWR("notices", api.listNotices);

  const notices = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const total = notices.length;
    const pending = notices.filter((n) => n.notice_status === "pending").length;
    const generated = notices.filter((n) => n.notice_status === "ai-generated").length;
    return { total, pending, generated };
  }, [notices]);

  const columns: ColumnsType<Notice> = [
    {
      title: "CA通知ID",
      dataIndex: "ca_notice_id",
      width: 180,
      render: (id: string) => (
        <Typography.Text
          code
          copyable
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "#63dcfa",
          }}
        >
          {id}
        </Typography.Text>
      ),
    },
    {
      title: "銘柄",
      dataIndex: "security_name",
      render(_, record) {
        return (
          <Space direction="vertical" size={2}>
            <Flex align="center" gap={8}>
              <BankOutlined style={{ color: "var(--color-text-muted)" }} />
              <Typography.Text strong>{record.security_name}</Typography.Text>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 22 }}>
              {record.security_code}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: "イベント",
      dataIndex: "ca_event_type",
      width: 140,
      render: (value: string) => (
        <Tag
          style={{
            background: `${eventColorMap[value] ?? "#63dcfa"}20`,
            borderColor: eventColorMap[value] ?? "#63dcfa",
            color: eventColorMap[value] ?? "#63dcfa",
          }}
        >
          <TagOutlined style={{ marginRight: 4 }} />
          {value}
        </Tag>
      ),
    },
    {
      title: "重要日付",
      key: "dates",
      width: 200,
      render(_, record) {
        return (
          <Space direction="vertical" size={2}>
            <Flex align="center" gap={6}>
              <CalendarOutlined style={{ color: "#63dcfa", fontSize: 12 }} />
              <Typography.Text style={{ fontSize: 13 }}>
                権利確定: {record.record_date}
              </Typography.Text>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 18 }}>
              支払開始: {record.payment_date ?? "未定"}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: "ステータス",
      dataIndex: "notice_status",
      width: 150,
      render: (status: string) => {
        const config: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
          pending: { color: "#f59e0b", bg: "#f59e0b20", icon: <SyncOutlined spin /> },
          "ai-generated": { color: "#10b981", bg: "#10b98120", icon: <FileTextOutlined /> },
          "draft-updated": { color: "#a855f7", bg: "#a855f720", icon: <FileTextOutlined /> },
        };
        const { color, bg, icon } = config[status] ?? config.pending;
        return (
          <Tag
            style={{
              background: bg,
              borderColor: color,
              color: color,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {icon}
            {status}
          </Tag>
        );
      },
    },
    {
      title: "最終更新",
      dataIndex: "updated_at",
      width: 180,
      render: (value: string) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(value).toLocaleString("ja-JP")}
        </Typography.Text>
      ),
    },
  ];

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await api.createNotice({
        ca_notice_id: values.ca_notice_id.trim(),
        security_code: values.security_code.trim(),
        security_name: values.security_name.trim(),
        ca_event_type: values.ca_event_type,
        record_date: values.record_date.format("YYYY-MM-DD"),
        payment_date: values.payment_date?.format("YYYY-MM-DD"),
        notice_text: values.notice_text.trim(),
        source_channel: "manual",
      });
      message.success("CA通知を登録しました");
      setOpen(false);
      form.resetFields();
      mutate();
    } catch (error) {
      if ((error as Error).message) {
        message.error((error as Error).message);
      } else {
        message.error("登録に失敗しました");
      }
    }
  };

  return (
    <Flex vertical gap={24}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
        <Space direction="vertical" size={4}>
          <Typography.Title level={3} style={{ marginBottom: 0, fontWeight: 700 }}>
            CA通知一覧
          </Typography.Title>
          <Typography.Text type="secondary">
            原文取り込みとCA管理システム連携の管理画面
          </Typography.Text>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setOpen(true)}
        >
          通知を登録
        </Button>
      </Flex>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: "linear-gradient(135deg, rgba(99, 220, 250, 0.08), transparent)",
              borderColor: "rgba(99, 220, 250, 0.2)",
            }}
          >
            <Statistic
              title="登録済み通知"
              value={stats.total}
              suffix="件"
              valueStyle={{ color: "#63dcfa", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), transparent)",
              borderColor: "rgba(245, 158, 11, 0.2)",
            }}
          >
            <Statistic
              title="処理待ち"
              value={stats.pending}
              suffix="件"
              valueStyle={{ color: "#f59e0b", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), transparent)",
              borderColor: "rgba(16, 185, 129, 0.2)",
            }}
          >
            <Statistic
              title="AI生成完了"
              value={stats.generated}
              suffix="件"
              valueStyle={{ color: "#10b981", fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card
        style={{
          background: "var(--color-bg-card)",
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          rowKey="ca_notice_id"
          loading={isLoading}
          columns={columns}
          dataSource={notices}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `全 ${total} 件`,
          }}
          style={{ overflow: "hidden" }}
        />
      </Card>

      {/* Create Drawer */}
      <Drawer
        title={
          <Flex align="center" gap={12}>
            <PlusOutlined style={{ color: "#63dcfa" }} />
            <span>CA通知の登録</span>
          </Flex>
        }
        width={560}
        open={open}
        onClose={() => setOpen(false)}
        destroyOnClose
        styles={{
          body: { paddingTop: 24 },
        }}
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>キャンセル</Button>
            <Button type="primary" onClick={handleCreate}>
              登録
            </Button>
          </Space>
        }
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{
            ca_notice_id: `CA-${Date.now()}`,
            ca_event_type: "配当",
          }}
        >
          <Form.Item
            name="ca_notice_id"
            label="CA通知ID"
            rules={[{ required: true, message: "必須項目です" }]}
          >
            <Input placeholder="例: CA-20241001-001" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="security_code" label="銘柄コード" rules={[{ required: true }]}>
                <Input maxLength={10} placeholder="例: 800120" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="security_name" label="銘柄名" rules={[{ required: true }]}>
                <Input placeholder="例: 株式会社サンプル" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="ca_event_type" label="イベント種別" rules={[{ required: true }]}>
            <Select
              options={eventOptions.map((value) => ({
                value,
                label: (
                  <Flex align="center" gap={8}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: eventColorMap[value],
                      }}
                    />
                    {value}
                  </Flex>
                ),
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="record_date" label="権利確定日" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_date" label="支払開始日">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notice_text" label="原文テキスト" rules={[{ required: true }]}>
            <Input.TextArea placeholder="通知原文を貼り付け" rows={8} />
          </Form.Item>
        </Form>
      </Drawer>
    </Flex>
  );
}

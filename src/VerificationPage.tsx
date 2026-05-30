import { Button, Card, Input, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { listOrders, verifyOrder } from './api'
import { formatDateTime, getOrderStatusMeta, normalizeOrderStatus } from './orderStatus'
import type { OrderStatus, TravelOrder } from './types'

function currency(value: number) {
  return `¥${value.toFixed(2)}`
}

export default function VerificationPage() {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<TravelOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<OrderStatus | ''>('pending_travel')
  const [verifyingId, setVerifyingId] = useState('')

  async function load(
    nextPage = page,
    nextPageSize = pageSize,
    nextKeyword = keyword,
    nextStatus = status,
  ) {
    setLoading(true)
    try {
      const data = await listOrders({
        page: nextPage,
        pageSize: nextPageSize,
        keyword: nextKeyword || undefined,
        status: nextStatus,
      })
      setOrders(data.orderList)
      setTotal(data.total)
      setPage(nextPage)
      setPageSize(nextPageSize)
    } catch (error: any) {
      message.error(error.response?.data?.error || '加载核销订单失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1, pageSize, '', 'pending_travel')
  }, [])

  async function handleVerify(order: TravelOrder) {
    setVerifyingId(order.id)
    try {
      await verifyOrder(order.id, order.verificationCode)
      message.success('核销成功')
      await load(page, pageSize, keyword, status)
    } catch (error: any) {
      message.error(error.response?.data?.error || '核销失败')
    } finally {
      setVerifyingId('')
    }
  }

  return (
    <>
      <div className="page-heading">
        <h1>核销管理</h1>
        <p>按订单号、凭证码或用户搜索待出行订单，现场确认后可直接完成核销。</p>
      </div>

      <Card className="search-card">
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="按订单号、凭证码或用户搜索"
            style={{ width: 320 }}
            onSearch={(value) => {
              setKeyword(value)
              load(1, pageSize, value, status)
            }}
          />
          <Select
            value={status}
            style={{ width: 180 }}
            onChange={(value) => {
              setStatus(value)
              load(1, pageSize, keyword, value)
            }}
            options={[
              { label: '全部状态', value: '' },
              { label: '待出行', value: 'pending_travel' },
              { label: '已出行', value: 'completed' },
            ]}
          />
          <Tag color="blue">共 {total} 单</Tag>
        </Space>
      </Card>

      <Card className="content-card">
        <Table<TravelOrder>
          rowKey="id"
          loading={loading}
          dataSource={orders}
          expandable={{
            expandedRowRender: (record) => (
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={record.items}
                columns={[
                  { title: '商品', dataIndex: 'productTitle' },
                  { title: '数量', dataIndex: 'quantity', width: 80 },
                  {
                    title: '单价',
                    dataIndex: 'unitPrice',
                    width: 120,
                    render: (value: number) => currency(value),
                  },
                  {
                    title: '小计',
                    dataIndex: 'subtotalAmount',
                    width: 120,
                    render: (value: number) => currency(value),
                  },
                ]}
              />
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 单`,
            onChange: (nextPage, nextPageSize) => load(nextPage, nextPageSize, keyword, status),
          }}
          columns={[
            {
              title: '订单号',
              dataIndex: 'orderNo',
              width: 220,
              render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
            },
            {
              title: '凭证码',
              dataIndex: 'verificationCode',
              width: 220,
              render: (value: string) => value ? <Typography.Text copyable>{value}</Typography.Text> : '-',
            },
            {
              title: '用户',
              dataIndex: 'user',
              width: 220,
              render: (user: TravelOrder['user']) => (
                <div className="verification-user">
                  <Typography.Text strong>{user?.nickname || user?.username || '-'}</Typography.Text>
                  <Typography.Text type="secondary">{user?.username || '-'}</Typography.Text>
                </div>
              ),
            },
            {
              title: '订单金额',
              dataIndex: 'totalAmount',
              width: 140,
              render: (value: number) => currency(value),
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 120,
              render: (value: OrderStatus) => {
                const meta = getOrderStatusMeta(value)
                return <Tag color={meta.color}>{meta.text}</Tag>
              },
            },
            {
              title: '支付时间',
              dataIndex: 'paidAt',
              width: 190,
              render: (value: string | null) => formatDateTime(value),
            },
            {
              title: '核销时间',
              dataIndex: 'verifiedAt',
              width: 190,
              render: (value: string | null) => formatDateTime(value),
            },
            {
              title: '操作',
              width: 150,
              render: (_, record) =>
                normalizeOrderStatus(record.status) === 'pending_travel' ? (
                  <Popconfirm
                    title="确认完成核销？"
                    description={`凭证码 ${record.verificationCode || '未生成'}`}
                    onConfirm={() => handleVerify(record)}
                  >
                    <Button type="primary" loading={verifyingId === record.id}>
                      核销
                    </Button>
                  </Popconfirm>
                ) : (
                  <Tag color="success">已核销</Tag>
                ),
            },
          ]}
        />
      </Card>
    </>
  )
}

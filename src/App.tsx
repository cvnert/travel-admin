import {
  AppstoreOutlined,
  LogoutOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  ConfigProvider,
  Form,
  Image,
  Input,
  InputNumber,
  Layout,
  Menu,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
  theme,
} from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import type {
  BannerStatus,
  HomeBanner,
  HomeBannerPayload,
  ProductPayload,
  ProductStatus,
  TravelProduct,
} from './types'
import {
  assetUrl,
  authUploadHeaders,
  clearToken,
  createHomeBanner,
  createProduct,
  getHomeBanner,
  getProduct,
  getToken,
  listHomeBanners,
  listProducts,
  login,
  setToken,
  signImageUrls,
  updateHomeBanner,
  updateHomeBannerStatus,
  updateProduct,
  updateProductStatus,
  uploadImageUrl,
} from './api'

const { Header, Sider, Content } = Layout

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    message.success('已复制')
  } catch {
    message.error('复制失败，请手动选中复制')
  }
}

function ProtectedRoute() {
  if (!getToken()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={216}>
        <div className="app-logo">
          <span className="app-logo-mark">
            <SendOutlined />
          </span>
          旅邦旅游后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname.startsWith('/banners') ? 'banners' : 'products']}
          items={[
            {
              key: 'banners',
              icon: <AppstoreOutlined />,
              label: <Link to="/banners">轮播图管理</Link>,
            },
            {
              key: 'products',
              icon: <AppstoreOutlined />,
              label: <Link to="/products">产品管理</Link>,
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Typography.Text strong>旅邦旅游小程序内容管理</Typography.Text>
          <Button
            icon={<LogoutOutlined />}
            onClick={() => {
              clearToken()
              navigate('/login', { replace: true })
            }}
          >
            退出登录
          </Button>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function onFinish(values: { username: string; password: string }) {
    setLoading(true)
    try {
      const data = await login(values.username, values.password)
      setToken(data.token)
      message.success('登录成功')
      navigate('/products', { replace: true })
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-title">
          <h1>旅邦旅游后台</h1>
          <p>维护首页轮播、旅游产品和详情内容</p>
        </div>
        <Card>
          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item label="账号" name="username" rules={[{ required: true, message: '请输入账号' }]}>
              <Input size="large" autoComplete="username" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password size="large" autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              登录
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  )
}

function ProductsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<TravelProduct[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  async function load(nextPage = page, nextPageSize = pageSize, nextKeyword = keyword) {
    setLoading(true)
    try {
      const data = await listProducts({
        page: nextPage,
        pageSize: nextPageSize,
        keyword: nextKeyword || undefined,
      })
      setProducts(data.productList)
      setTotal(data.total)
      const keys = data.productList.map((item) => item.coverImage).filter(Boolean)
      const urls = await signImageUrls(keys)
      setSignedUrls(urls)
      setPage(nextPage)
      setPageSize(nextPageSize)
    } catch (error: any) {
      message.error(error.response?.data?.error || '加载产品失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1, pageSize)
  }, [])

  async function changeStatus(id: string, status: ProductStatus) {
    try {
      await updateProductStatus(id, status)
      message.success('状态已更新')
      load()
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新状态失败')
    }
  }

  return (
    <>
      <div className="page-heading">
        <h1>产品管理</h1>
        <p>维护旅行线路、活动套餐和详情内容。产品 ID 可用于轮播图的关联跳转。</p>
      </div>
      <Card className="search-card">
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="按线路、产品或活动标题搜索"
            style={{ width: 320 }}
            onSearch={(value) => {
              setKeyword(value)
              load(1, pageSize, value)
            }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
            新增产品
          </Button>
        </Space>
      </Card>
      <Card className="content-card">
        <Table<TravelProduct>
          rowKey="id"
          loading={loading}
          dataSource={products}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (nextPage, nextPageSize) => load(nextPage, nextPageSize),
          }}
          columns={[
            {
              title: '首页卡片',
              dataIndex: 'title',
              width: 380,
              render: (_, record) => (
                <Space size={12}>
                  {record.coverImage ? (
                    <Image
                      src={record.coverImageUrl || signedUrls[record.coverImage] || assetUrl(record.coverImage)}
                      className="cover-preview"
                      preview={false}
                    />
                  ) : (
                    <div className="cover-preview" />
                  )}
                  <div className="product-cell-text">
                    <Typography.Text strong className="product-cell-title">
                      {record.title}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="product-cell-desc">
                      {record.shortDescription || record.summary || '未填写首页短文案'}
                    </Typography.Text>
                  </div>
                </Space>
              ),
            },
            {
              title: '产品 ID',
              dataIndex: 'id',
              width: 360,
              render: (value: string) => (
                <Space size={8} className="table-id-cell">
                  <Typography.Text className="table-id">{value}</Typography.Text>
                  <Button size="small" onClick={() => copyText(value)}>
                    复制
                  </Button>
                </Space>
              ),
            },
            {
              title: '价格',
              dataIndex: 'price',
              width: 120,
              render: (value: number) => `¥${value.toFixed(2)}`,
            },
            { title: '标签', dataIndex: 'tag', width: 120, render: (value: string) => value || '-' },
            { title: '排序', dataIndex: 'sortOrder', width: 90 },
            {
              title: '状态',
              dataIndex: 'status',
              width: 110,
              render: (status: ProductStatus) => <StatusTag status={status} />,
            },
            {
              title: '操作',
              width: 220,
              render: (_, record) => (
                <Space>
                  <Button type="link" onClick={() => navigate(`/products/${record.id}/edit`)}>
                    编辑
                  </Button>
                  {record.status === 'published' ? (
                    <Popconfirm title="确认下架该内容？" onConfirm={() => changeStatus(record.id, 'offline')}>
                      <Button type="link" danger>
                        下架
                      </Button>
                    </Popconfirm>
                  ) : (
                    <Button type="link" onClick={() => changeStatus(record.id, 'published')}>
                      上架
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </>
  )
}

function BannersPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [banners, setBanners] = useState<HomeBanner[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  async function load() {
    setLoading(true)
    try {
      const data = await listHomeBanners()
      setBanners(data)
      const keys = data.map((item) => item.image).filter(Boolean)
      setSignedUrls(await signImageUrls(keys))
    } catch (error: any) {
      message.error(error.response?.data?.error || '加载轮播图失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function changeStatus(id: string, status: BannerStatus) {
    try {
      await updateHomeBannerStatus(id, status)
      message.success('状态已更新')
      load()
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新状态失败')
    }
  }

  return (
    <>
      <div className="page-heading">
        <h1>轮播图管理</h1>
        <p>这里配置小程序首页顶部大图轮播。上架的轮播图会优先于产品轮播显示。</p>
      </div>
      <Card className="search-card">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/banners/new')}>
          新增轮播图
        </Button>
      </Card>
      <Card className="content-card">
        <Table<HomeBanner>
          rowKey="id"
          loading={loading}
          dataSource={banners}
          pagination={false}
          columns={[
            {
              title: '轮播图',
              dataIndex: 'title',
              width: 440,
              render: (_, record) => (
                <Space size={12}>
                  {record.image ? (
                    <Image
                      src={record.imageUrl || signedUrls[record.image] || assetUrl(record.image)}
                      className="banner-preview"
                      preview={false}
                    />
                  ) : (
                    <div className="banner-preview" />
                  )}
                  <div className="product-cell-text">
                    <Typography.Text strong className="product-cell-title">
                      {record.title}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="product-cell-desc">
                      {record.description || '未填写副标题'}
                    </Typography.Text>
                  </div>
                </Space>
              ),
            },
            { title: '标签', dataIndex: 'tag', width: 120, render: (value: string) => value || '-' },
            { title: '排序', dataIndex: 'sortOrder', width: 90 },
            {
              title: '状态',
              dataIndex: 'status',
              width: 110,
              render: (status: BannerStatus) => <StatusTag status={status} />,
            },
            {
              title: '操作',
              width: 220,
              render: (_, record) => (
                <Space>
                  <Button type="link" onClick={() => navigate(`/banners/${record.id}/edit`)}>
                    编辑
                  </Button>
                  {record.status === 'published' ? (
                    <Popconfirm title="确认下架该轮播图？" onConfirm={() => changeStatus(record.id, 'offline')}>
                      <Button type="link" danger>
                        下架
                      </Button>
                    </Popconfirm>
                  ) : (
                    <Button type="link" onClick={() => changeStatus(record.id, 'published')}>
                      上架
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </>
  )
}

function BannerFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form] = Form.useForm<HomeBannerPayload>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) {
      form.setFieldsValue({
        sortOrder: 0,
        status: 'draft',
      })
      return
    }

    setLoading(true)
    getHomeBanner(id)
      .then((banner) => form.setFieldsValue(banner))
      .catch((error: any) => message.error(error.response?.data?.error || '加载轮播图失败'))
      .finally(() => setLoading(false))
  }, [form, id])

  async function onFinish(values: HomeBannerPayload) {
    setLoading(true)
    try {
      const payload = {
        ...values,
        sortOrder: Number(values.sortOrder || 0),
        linkedProductId: values.linkedProductId || '',
      }
      if (id) {
        await updateHomeBanner(id, payload)
      } else {
        await createHomeBanner(payload)
      }
      message.success('保存成功')
      navigate('/banners')
    } catch (error: any) {
      message.error(error.response?.data?.error || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-heading">
        <h1>{isEdit ? '编辑轮播图' : '新增轮播图'}</h1>
        <p>建议上传横版大图。若填写关联产品 ID，用户点击轮播图会进入对应详情页。</p>
      </div>
      <Card loading={loading} className="content-card">
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
          <div className="form-section">
            <h2 className="form-section-title">轮播内容</h2>
            <div className="home-field-grid">
              <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="例如：滇西北深度旅行线路" />
              </Form.Item>
              <Form.Item label="标签" name="tag">
                <Input placeholder="例如：热卖、限时、推荐" />
              </Form.Item>
            </div>
            <Form.Item label="副标题" name="description">
              <Input placeholder="展示在首页轮播图上的短文案" />
            </Form.Item>
            <Form.Item label="轮播图片" name="image" rules={[{ required: true, message: '请上传轮播图片' }]}>
              <ImageUploader />
            </Form.Item>
            <div className="home-field-grid">
              <Form.Item label="关联产品 ID" name="linkedProductId">
                <Input placeholder="可选，点击轮播图跳转到该产品" />
              </Form.Item>
              <Form.Item label="排序值" name="sortOrder">
                <InputNumber precision={0} style={{ width: 180 }} />
              </Form.Item>
            </div>
            <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <Select
                style={{ width: 180 }}
                options={[
                  { label: '草稿', value: 'draft' },
                  { label: '上架', value: 'published' },
                  { label: '下架', value: 'offline' },
                ]}
              />
            </Form.Item>
          </div>

          <div className="form-actions">
            <Button onClick={() => navigate('/banners')}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
          </div>
        </Form>
      </Card>
    </>
  )
}

function ProductFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form] = Form.useForm<ProductPayload>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) {
      form.setFieldsValue({
        bannerImages: [],
        detailImages: [],
        price: 0,
        salesCount: 0,
        sortOrder: 0,
        status: 'draft',
      })
      return
    }

    setLoading(true)
    getProduct(id)
      .then((product) => form.setFieldsValue(product))
      .catch((error: any) => message.error(error.response?.data?.error || '加载产品失败'))
      .finally(() => setLoading(false))
  }, [form, id])

  async function onFinish(values: ProductPayload) {
    setLoading(true)
    try {
      const payload = {
        ...values,
        bannerImages: values.bannerImages || [],
        detailImages: values.detailImages || [],
        price: Number(values.price || 0),
        salesCount: Number(values.salesCount || 0),
        sortOrder: Number(values.sortOrder || 0),
      }
      if (id) {
        await updateProduct(id, payload)
      } else {
        await createProduct(payload)
      }
      message.success('保存成功')
      navigate('/products')
    } catch (error: any) {
      message.error(error.response?.data?.error || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-heading">
        <h1>{isEdit ? '编辑产品' : '新增产品'}</h1>
        <p>封面图、短文案和排序会直接影响小程序首页展示。</p>
      </div>
      <Card loading={loading} className="content-card">
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
          <div className="form-section">
            <h2 className="form-section-title">首页展示</h2>
            <div className="home-field-grid">
              <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="例如：滇西北深度旅行线路" />
              </Form.Item>
              <Form.Item label="标签" name="tag">
                <Input placeholder="例如：热卖、限时、推荐" />
              </Form.Item>
            </div>

            <Form.Item label="封面图" name="coverImage" rules={[{ required: true, message: '请上传封面图' }]}>
              <ImageUploader />
            </Form.Item>

            <Form.Item label="首页大轮播图" name="bannerImages">
              <MultiImageUploader />
            </Form.Item>

            <Form.Item label="首页短文案" name="shortDescription">
              <Input placeholder="展示在首页产品卡片上的一句话" />
            </Form.Item>

            <Space size={16} align="start" wrap>
              <Form.Item label="价格" name="price" rules={[{ required: true, message: '请输入价格' }]}>
                <InputNumber min={0} precision={2} prefix="¥" style={{ width: 180 }} />
              </Form.Item>
              <Form.Item label="销量" name="salesCount" rules={[{ required: true, message: '请输入销量' }]}>
                <InputNumber min={0} precision={0} style={{ width: 160 }} />
              </Form.Item>
              <Form.Item label="排序值" name="sortOrder">
                <InputNumber precision={0} style={{ width: 160 }} />
              </Form.Item>
              <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
                <Select
                  style={{ width: 160 }}
                  options={[
                    { label: '草稿', value: 'draft' },
                    { label: '上架', value: 'published' },
                    { label: '下架', value: 'offline' },
                  ]}
                />
              </Form.Item>
            </Space>
          </div>

          <div className="form-section">
            <h2 className="form-section-title">详情内容</h2>
            <Form.Item label="详情图片" name="detailImages">
              <MultiImageUploader />
            </Form.Item>
            <Form.Item label="产品概要" name="summary">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="行程介绍" name="itinerary" rules={[{ required: true, message: '请输入行程介绍' }]}>
              <Input.TextArea rows={6} />
            </Form.Item>
            <Form.Item label="费用说明" name="feeDescription" rules={[{ required: true, message: '请输入费用说明' }]}>
              <Input.TextArea rows={5} />
            </Form.Item>
            <Form.Item label="出行须知" name="travelNotice" rules={[{ required: true, message: '请输入出行须知' }]}>
              <Input.TextArea rows={5} />
            </Form.Item>
            <Form.Item label="退款/改期说明" name="refundPolicy">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item label="客服电话" name="customerServicePhone">
              <Input placeholder="例如：400-000-0000" />
            </Form.Item>
          </div>

          <div className="form-actions">
            <Button onClick={() => navigate('/products')}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
          </div>
        </Form>
      </Card>
    </>
  )
}

function StatusTag({ status }: { status: ProductStatus | BannerStatus }) {
  const map = {
    draft: { color: 'default', text: '草稿' },
    published: { color: 'success', text: '上架' },
    offline: { color: 'warning', text: '下架' },
  } as const
  const item = map[status] || map.draft
  return <Tag color={item.color}>{item.text}</Tag>
}

function ImageUploader({ value, onChange }: { value?: string; onChange?: (url: string) => void }) {
  const [fileList, setFileList] = useState<UploadFile[]>([])

  useEffect(() => {
    if (!value) {
      setFileList([])
      return
    }
    if (/^https?:\/\//i.test(value)) {
      setFileList([
        {
          uid: value,
          name: value.split('/').pop() || 'image',
          status: 'done',
          url: value,
        },
      ])
      return
    }
    signImageUrls([value])
      .then((urls) => {
        const url = urls[value] || ''
        setFileList([
          {
            uid: value,
            name: value.split('/').pop() || 'image',
            status: 'done',
            url: url || assetUrl(value),
          },
        ])
      })
      .catch(() => {
        setFileList([
          {
            uid: value,
            name: value.split('/').pop() || 'image',
            status: 'done',
            url: assetUrl(value),
          },
        ])
      })
  }, [value])

  const props: UploadProps = {
    name: 'file',
    action: uploadImageUrl(),
    headers: authUploadHeaders(),
    listType: 'picture-card',
    maxCount: 1,
    fileList,
    onChange(info) {
      const file = info.file
      const nextList = info.fileList.slice(-1).map((item) => {
        const key = item.response?.key || item.uid
        const url = item.response?.url || item.url || item.thumbUrl
        return {
          ...item,
          uid: key,
          url,
          thumbUrl: url,
        }
      })
      setFileList(nextList)
      if (file.status === 'done') {
        onChange?.(file.response?.key || file.response?.url)
      }
      if (file.status === 'removed') {
        setFileList([])
        onChange?.('')
      }
      if (file.status === 'error') {
        message.error(file.response?.error || '上传失败')
      }
    },
  }

  return (
    <Upload {...props}>
      {fileList.length >= 1 ? null : (
        <button type="button" style={{ border: 0, background: 'none' }}>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传</div>
        </button>
      )}
    </Upload>
  )
}

function MultiImageUploader({
  value,
  onChange,
}: {
  value?: string[]
  onChange?: (urls: string[]) => void
}) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    const keys = (value || []).filter((item) => !/^https?:\/\//i.test(item))
    signImageUrls(keys)
      .then(setSignedUrls)
      .catch(() => setSignedUrls({}))
  }, [value])

  const fileList = useMemo<UploadFile[]>(
    () =>
      (value || []).map((url) => ({
        uid: url,
        name: url.split('/').pop() || 'image',
        status: 'done',
        url: signedUrls[url] || assetUrl(url),
      })),
    [signedUrls, value],
  )

  const props: UploadProps = {
    name: 'file',
    action: uploadImageUrl(),
    headers: authUploadHeaders(),
    listType: 'picture-card',
    fileList,
    onChange(info) {
      if (info.file.status === 'done' && info.file.response?.key && info.file.response?.url) {
        setSignedUrls((current) => ({
          ...current,
          [info.file.response.key]: info.file.response.url,
        }))
      }
      const urls = info.fileList
        .map((file) => file.response?.key || file.response?.url || file.uid)
        .filter(Boolean)
        .map((url) => String(url))
      onChange?.(urls)
      if (info.file.status === 'error') {
        message.error(info.file.response?.error || '上传失败')
      }
    },
  }

  return (
    <Upload {...props}>
      <button type="button" style={{ border: 0, background: 'none' }}>
        <PlusOutlined />
        <div style={{ marginTop: 8 }}>上传</div>
      </button>
    </Upload>
  )
}

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 6,
          colorPrimary: '#8f7b4f',
        },
      }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/products" replace />} />
            <Route path="/banners" element={<BannersPage />} />
            <Route path="/banners/new" element={<BannerFormPage />} />
            <Route path="/banners/:id/edit" element={<BannerFormPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={<ProductFormPage />} />
            <Route path="/products/:id/edit" element={<ProductFormPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </ConfigProvider>
  )
}

export default App

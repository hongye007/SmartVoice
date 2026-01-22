import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Typography,
  Popconfirm,
  Empty,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { projectService } from '../services/project.service'
import type { Project, ProjectStatus } from '../types/api'

const { Title, Text } = Typography

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  PENDING: { label: '待解析', color: 'default' },
  PARSING: { label: '解析中', color: 'processing' },
  READY: { label: '就绪', color: 'success' },
  GENERATING: { label: '生成中', color: 'processing' },
  COMPLETED: { label: '已完成', color: 'success' },
  FAILED: { label: '失败', color: 'error' },
}

export function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [form] = Form.useForm()
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const data = await projectService.getProjects()
      setProjects(data)
    } catch (error: any) {
      message.error(error.message || '加载项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (values: { name: string; description?: string }) => {
    if (fileList.length === 0) {
      message.error('请上传文件')
      return
    }

    const file = fileList[0].originFileObj as File

    // 文件大小检查 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      message.error('文件大小不能超过 50MB')
      return
    }

    setCreating(true)
    try {
      await projectService.createProject(values.name, file)
      message.success('项目创建成功！')
      setModalOpen(false)
      form.resetFields()
      setFileList([])
      loadProjects()
    } catch (error: any) {
      message.error(error.message || '创建项目失败')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await projectService.deleteProject(id)
      message.success('删除成功')
      loadProjects()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Project) => (
        <Button type="link" onClick={() => navigate(`/projects/${record.id}`)}>
          {name}
        </Button>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProjectStatus) => {
        const config = STATUS_CONFIG[status]
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: '字数',
      dataIndex: 'totalWords',
      key: 'totalWords',
      render: (words: number) => words.toLocaleString(),
    },
    {
      title: '章节',
      key: 'chapters',
      render: (record: Project) => record._count?.chapters || 0,
    },
    {
      title: '角色',
      key: 'characters',
      render: (record: Project) => record._count?.characters || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Project) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/projects/${record.id}`)}
          >
            查看
          </Button>
          <Popconfirm
            title="确认删除此项目？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      <Card>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              我的项目
            </Title>
            <Text type="secondary">管理和创建您的有声内容项目</Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadProjects}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              新建项目
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个项目` }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <div>还没有项目</div>
                    <div style={{ marginTop: 8 }}>
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                        创建第一个项目
                      </Button>
                    </div>
                  </div>
                }
              />
            ),
          }}
        />
      </Card>

      <Modal
        title={
          <div>
            <div>新建项目</div>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
              上传您的文本文件，开始创作有声内容
            </Text>
          </div>
        }
        open={modalOpen}
        onCancel={() => {
          if (!creating) {
            setModalOpen(false)
            form.resetFields()
            setFileList([])
          }
        }}
        footer={null}
        width={560}
        maskClosable={!creating}
      >
        <Form
          form={form}
          onFinish={handleCreateProject}
          layout="vertical"
          disabled={creating}
        >
          <Form.Item
            label="项目名称"
            name="name"
            rules={[
              { required: true, message: '请输入项目名称' },
              { max: 50, message: '项目名称不能超过50个字符' },
            ]}
          >
            <Input
              placeholder="例如：我的第一本有声书"
              size="large"
              showCount
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            label="项目描述（可选）"
            name="description"
            rules={[{ max: 200, message: '描述不能超过200个字符' }]}
          >
            <Input.TextArea
              placeholder="简单描述一下这个项目..."
              rows={3}
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            label="上传文本文件"
            required
            help={
              <div style={{ marginTop: 8 }}>
                <div>• 支持 .txt 格式</div>
                <div>• 文件大小不超过 50MB</div>
                <div>• 建议使用 UTF-8 编码</div>
              </div>
            }
          >
            <Upload.Dragger
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={(file) => {
                if (file.size > 50 * 1024 * 1024) {
                  message.error('文件大小不能超过 50MB')
                  return false
                }
                if (!file.name.endsWith('.txt')) {
                  message.error('只支持 .txt 格式文件')
                  return false
                }
                return false
              }}
              accept=".txt"
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 .txt 格式，最大 50MB
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalOpen(false)} disabled={creating}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={creating}
              >
                {creating ? '创建中...' : '创建项目'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

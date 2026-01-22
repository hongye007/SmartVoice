import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Steps,
  Table,
  Tag,
  Space,
  message,
  Progress,
  Typography,
  Alert,
  Divider,
  Spin,
  Empty,
  Tooltip,
  Statistic,
  Row,
  Col,
} from 'antd'
import {
  FileTextOutlined,
  UserOutlined,
  SoundOutlined,
  PlayCircleOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { projectService } from '../services/project.service'
import type { Project, Chapter, Character, JobStatus } from '../types/api'

const { Title, Text } = Typography

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [parsing, setParsing] = useState(false)
  const [parseJob, setParseJob] = useState<JobStatus | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [generatingChapterId, setGeneratingChapterId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadAllData()
    }
  }, [id])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadProject(), loadChapters(), loadCharacters()])
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      await Promise.all([loadProject(), loadChapters(), loadCharacters()])
      message.success('刷新成功')
    } catch (error: any) {
      message.error('刷新失败')
    } finally {
      setRefreshing(false)
    }
  }

  const loadProject = async () => {
    try {
      const data = await projectService.getProject(id!)
      setProject(data)
    } catch (error: any) {
      message.error('加载项目失败')
    }
  }

  const loadChapters = async () => {
    try {
      const data = await projectService.getChapters(id!)
      setChapters(data)
    } catch (error: any) {
      console.error(error)
    }
  }

  const loadCharacters = async () => {
    try {
      const data = await projectService.getCharacters(id!)
      setCharacters(data)
    } catch (error: any) {
      console.error(error)
    }
  }

  const handleParse = async () => {
    setParsing(true)
    try {
      const { jobId } = await projectService.parseProject(id!, true)
      message.success('解析任务已开始')

      // 轮询任务状态
      const interval = setInterval(async () => {
        try {
          const status = await projectService.getJobStatus('text-parsing', jobId)
          setParseJob(status)

          if (status.state === 'completed') {
            clearInterval(interval)
            message.success('解析完成！')
            setParsing(false)
            loadProject()
            loadChapters()
            loadCharacters()
          } else if (status.state === 'failed') {
            clearInterval(interval)
            message.error('解析失败：' + status.failedReason)
            setParsing(false)
          }
        } catch (error) {
          clearInterval(interval)
          setParsing(false)
        }
      }, 2000)
    } catch (error: any) {
      message.error(error.message)
      setParsing(false)
    }
  }

  const handleGenerateAudio = async (chapterId: string) => {
    setGeneratingChapterId(chapterId)
    try {
      const { jobId } = await projectService.generateChapterAudio(chapterId)
      message.success('音频生成任务已开始，请稍后查看')

      setTimeout(() => {
        message.info('音频生成中，请稍后刷新查看状态')
        setGeneratingChapterId(null)
      }, 2000)
    } catch (error: any) {
      message.error(error.message || '生成任务启动失败')
      setGeneratingChapterId(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="加载项目信息..." />
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ padding: 24 }}>
        <Empty
          description="项目不存在或已被删除"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate('/projects')}>
            返回项目列表
          </Button>
        </Empty>
      </div>
    )
  }

  const currentStep =
    project.status === 'PENDING' ? 0 :
    project.status === 'PARSING' ? 0 :
    project.status === 'READY' ? 1 :
    project.status === 'GENERATING' ? 2 :
    project.status === 'COMPLETED' ? 3 : 0

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/projects')}
            size="large"
          >
            返回项目列表
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={refreshData}
            loading={refreshing}
          >
            刷新
          </Button>
        </div>

        {/* 项目信息卡片 */}
        <Card>
          <div style={{ marginBottom: 24 }}>
            <Title level={2} style={{ marginBottom: 8 }}>{project.name}</Title>
            {project.description && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                {project.description}
              </Text>
            )}
            <Text type="secondary">
              创建于 {new Date(project.createdAt).toLocaleString('zh-CN')}
            </Text>
          </div>

          {/* 统计信息 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总字数"
                  value={project.totalWords}
                  suffix="字"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="章节数"
                  value={chapters.length}
                  suffix="章"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="角色数"
                  value={characters.length}
                  suffix="个"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="完成章节"
                  value={chapters.filter(c => c.status === 'COMPLETED').length}
                  suffix={`/ ${chapters.length}`}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* 进度步骤 */}
          <Steps
            current={currentStep}
            items={[
              {
                title: '文本解析',
                icon: <FileTextOutlined />,
                description: project.status === 'PARSING' ? '解析中...' : undefined
              },
              {
                title: '角色识别',
                icon: <UserOutlined />,
                description: characters.length > 0 ? `${characters.length} 个角色` : undefined
              },
              {
                title: '音频生成',
                icon: <SoundOutlined />,
                description: chapters.filter(c => c.status === 'COMPLETED').length > 0
                  ? `${chapters.filter(c => c.status === 'COMPLETED').length} / ${chapters.length}`
                  : undefined
              },
              {
                title: '完成',
                icon: <PlayCircleOutlined />
              },
            ]}
          />

          {/* 解析进度 */}
          {parsing && parseJob && (
            <div style={{ marginTop: 24 }}>
              <Alert
                message="正在解析项目"
                description={
                  <div>
                    <Progress
                      percent={parseJob.progress?.percentage || 0}
                      status="active"
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">{parseJob.progress?.message}</Text>
                    </div>
                  </div>
                }
                type="info"
                showIcon
                icon={<ClockCircleOutlined />}
              />
            </div>
          )}

          {/* 解析失败 */}
          {project.status === 'FAILED' && (
            <Alert
              message="项目解析失败"
              description="您可以重新上传文件或联系客服支持"
              type="error"
              showIcon
              icon={<ExclamationCircleOutlined />}
              style={{ marginTop: 24 }}
            />
          )}

          {/* 待解析提示 */}
          {project.status === 'PENDING' && (
            <Alert
              message="项目待解析"
              description="点击下方按钮开始解析文本，识别章节和角色"
              type="info"
              showIcon
              style={{ marginTop: 24 }}
              action={
                <Button type="primary" onClick={handleParse} loading={parsing}>
                  {parsing ? '解析中...' : '开始解析'}
                </Button>
              }
            />
          )}
        </Card>

        {/* 章节列表 */}
        {chapters.length > 0 && (
          <Card title={<><FileTextOutlined /> 章节列表</>}>
            <Table
              dataSource={chapters}
              rowKey="id"
              pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 章` }}
              columns={[
                {
                  title: '序号',
                  key: 'index',
                  width: 80,
                  render: (_: any, __: any, index: number) => index + 1,
                },
                {
                  title: '标题',
                  dataIndex: 'title',
                  key: 'title',
                  ellipsis: { showTitle: true },
                  render: (title: string) => (
                    <Tooltip title={title}>
                      <Text strong>{title}</Text>
                    </Tooltip>
                  ),
                },
                {
                  title: '字数',
                  dataIndex: 'wordCount',
                  key: 'wordCount',
                  width: 120,
                  render: (v: number) => (
                    <Text type="secondary">{v.toLocaleString()} 字</Text>
                  ),
                  sorter: (a: Chapter, b: Chapter) => a.wordCount - b.wordCount,
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  width: 120,
                  render: (status: string) => {
                    if (status === 'COMPLETED') {
                      return <Tag icon={<CheckCircleOutlined />} color="success">已生成</Tag>
                    }
                    return <Tag icon={<ClockCircleOutlined />} color="default">待生成</Tag>
                  },
                  filters: [
                    { text: '已生成', value: 'COMPLETED' },
                    { text: '待生成', value: 'PENDING' },
                  ],
                  onFilter: (value: any, record: Chapter) => record.status === value,
                },
                {
                  title: '操作',
                  key: 'actions',
                  width: 150,
                  render: (record: Chapter) => (
                    <Button
                      type="primary"
                      size="small"
                      icon={<SoundOutlined />}
                      onClick={() => handleGenerateAudio(record.id)}
                      loading={generatingChapterId === record.id}
                      disabled={!!generatingChapterId && generatingChapterId !== record.id}
                    >
                      {record.status === 'COMPLETED' ? '重新生成' : '生成音频'}
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        )}

        {/* 角色列表 */}
        {characters.length > 0 && (
          <Card title={<><UserOutlined /> 角色列表</>}>
            <Table
              dataSource={characters}
              rowKey="id"
              pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个角色` }}
              columns={[
                {
                  title: '角色名',
                  dataIndex: 'name',
                  key: 'name',
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: '性别',
                  dataIndex: 'gender',
                  key: 'gender',
                  width: 100,
                  render: (gender: string) => {
                    const config = {
                      MALE: { label: '男', color: 'blue' },
                      FEMALE: { label: '女', color: 'pink' },
                      UNKNOWN: { label: '未知', color: 'default' },
                    }[gender] || { label: '未知', color: 'default' }
                    return <Tag color={config.color}>{config.label}</Tag>
                  },
                  filters: [
                    { text: '男', value: 'MALE' },
                    { text: '女', value: 'FEMALE' },
                    { text: '未知', value: 'UNKNOWN' },
                  ],
                  onFilter: (value: any, record: Character) => record.gender === value,
                },
                {
                  title: '对话数',
                  dataIndex: 'dialogueCount',
                  key: 'dialogueCount',
                  width: 120,
                  render: (count: number) => (
                    <Text type="secondary">{count} 句</Text>
                  ),
                  sorter: (a: Character, b: Character) => a.dialogueCount - b.dialogueCount,
                },
                {
                  title: '音色',
                  dataIndex: 'voiceId',
                  key: 'voiceId',
                  width: 150,
                  render: (voiceId: string | null) => (
                    voiceId ? (
                      <Tag color="green">{voiceId}</Tag>
                    ) : (
                      <Text type="secondary">未设置</Text>
                    )
                  ),
                },
              ]}
            />
          </Card>
        )}
      </Space>
    </div>
  )
}

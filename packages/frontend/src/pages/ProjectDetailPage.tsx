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
import { socketService } from '../services/socket.service'
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
  const [audioJobs, setAudioJobs] = useState<Map<string, JobStatus>>(new Map())

  useEffect(() => {
    if (id) {
      loadAllData()

      // 连接 WebSocket
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const token = localStorage.getItem('token') || ''

      if (user.id && token) {
        socketService.connect(user.id, token)
        socketService.subscribeToProject(id)

        // 监听音频生成进度
        const unsubscribeProgress = socketService.onAudioProgress((data) => {
          if (data.projectId === id) {
            setAudioJobs((prev) => {
              const newMap = new Map(prev)
              newMap.set(data.chapterId, {
                jobId: data.jobId,
                queueName: 'audio-generation',
                state: 'active',
                progress: data.progress,
                failedReason: undefined,
                attemptsMade: 0,
                data: {},
                createdAt: data.timestamp,
              })
              return newMap
            })
          }
        })

        // 监听音频生成完成
        const unsubscribeComplete = socketService.onAudioComplete((data) => {
          if (data.projectId === id) {
            setAudioJobs((prev) => {
              const newMap = new Map(prev)
              newMap.delete(data.chapterId)
              return newMap
            })
            setGeneratingChapterId(null)
            message.success('音频生成完成！')
            loadProject()  // 刷新项目状态
            loadChapters() // 刷新章节列表
          }
        })

        // 监听音频生成失败
        const unsubscribeFailed = socketService.onAudioFailed((data) => {
          if (data.projectId === id) {
            setAudioJobs((prev) => {
              const newMap = new Map(prev)
              newMap.delete(data.chapterId)
              return newMap
            })
            setGeneratingChapterId(null)
            message.error('音频生成失败：' + data.error)
          }
        })

        // 清理函数
        return () => {
          unsubscribeProgress()
          unsubscribeComplete()
          unsubscribeFailed()
          socketService.unsubscribeFromProject(id)
        }
      }
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
      message.success('音频生成任务已开始，实时进度将通过 WebSocket 推送')

      // WebSocket 会实时推送进度更新，无需轮询
      // 初始化任务状态
      setAudioJobs((prev) => {
        const newMap = new Map(prev)
        newMap.set(chapterId, {
          jobId,
          queueName: 'audio-generation',
          state: 'waiting',
          progress: {
            percentage: 0,
            message: '等待处理',
          },
          failedReason: undefined,
          attemptsMade: 0,
          data: {},
          createdAt: new Date().toISOString(),
        })
        return newMap
      })
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

          {/* 音频生成进度提示 */}
          {audioJobs.size > 0 && (
            <Alert
              message="音频生成中"
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>正在生成 {audioJobs.size} 个章节的音频...</Text>
                  </div>
                  {Array.from(audioJobs.entries()).map(([chapterId, job]) => {
                    const chapter = chapters.find(c => c.id === chapterId)
                    if (!chapter || job.state !== 'active') return null

                    // 估算剩余时间：基于 Coqui TTS CPU 模式约 5 字符/秒的速度
                    const progress = job.progress?.percentage || 0
                    const remainingChars = chapter.wordCount * (100 - progress) / 100
                    const estimatedSeconds = Math.ceil(remainingChars / 5)

                    return (
                      <div key={chapterId} style={{ marginBottom: 12 }}>
                        <div style={{ marginBottom: 4 }}>
                          <Text strong>{chapter.title}</Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            ({chapter.wordCount} 字)
                          </Text>
                        </div>
                        <Progress
                          percent={job.progress?.percentage || 0}
                          size="small"
                          status="active"
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                        />
                        {job.progress?.message && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {job.progress.message}
                            </Text>
                          </div>
                        )}
                        {progress > 0 && progress < 100 && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              预计剩余时间: {estimatedSeconds > 60
                                ? `${Math.ceil(estimatedSeconds / 60)} 分钟`
                                : `${estimatedSeconds} 秒`}
                            </Text>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              }
              type="info"
              showIcon
              icon={<SoundOutlined spin />}
              style={{ marginTop: 24 }}
            />
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
                  width: 200,
                  render: (status: string, record: Chapter) => {
                    const job = audioJobs.get(record.id)

                    // 显示生成进度
                    if (job && (job.state === 'active' || job.state === 'waiting')) {
                      return (
                        <div>
                          <div style={{ marginBottom: 4 }}>
                            <Tag icon={<ClockCircleOutlined />} color="processing">
                              生成中...
                            </Tag>
                          </div>
                          {job.progress && (
                            <Progress
                              percent={job.progress.percentage || 0}
                              size="small"
                              status="active"
                              strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                              }}
                            />
                          )}
                          {job.progress?.message && (
                            <div style={{ marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {job.progress.message}
                              </Text>
                            </div>
                          )}
                        </div>
                      )
                    }

                    // 显示完成状态
                    if (status === 'COMPLETED') {
                      return <Tag icon={<CheckCircleOutlined />} color="success">已生成</Tag>
                    }

                    // 待生成状态
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
                  render: (record: Chapter) => {
                    const job = audioJobs.get(record.id)
                    const isGenerating = job && (job.state === 'active' || job.state === 'waiting')

                    return (
                      <Button
                        type="primary"
                        size="small"
                        icon={<SoundOutlined />}
                        onClick={() => handleGenerateAudio(record.id)}
                        loading={generatingChapterId === record.id || isGenerating}
                        disabled={!!generatingChapterId && generatingChapterId !== record.id}
                      >
                        {isGenerating
                          ? `生成中 ${job?.progress?.percentage ? `${Math.round(job.progress.percentage)}%` : ''}`
                          : record.status === 'COMPLETED'
                            ? '重新生成'
                            : '生成音频'}
                      </Button>
                    )
                  },
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

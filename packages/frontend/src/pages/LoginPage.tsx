import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Tabs, message, Typography, Alert } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useAuthStore } from '../stores/auth.store'

const { Title, Text } = Typography

export function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const { login, register, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (values: { email: string; password: string }) => {
    setErrorMsg('')
    try {
      await login(values.email, values.password)
      message.success('登录成功！正在跳转...')
      navigate('/projects')
    } catch (error: any) {
      const msg = error.message || '登录失败，请检查用户名和密码'
      setErrorMsg(msg)
      message.error(msg)
    }
  }

  const handleRegister = async (values: {
    email: string
    username: string
    password: string
  }) => {
    setErrorMsg('')
    try {
      await register(values.email, values.username, values.password)
      message.success('注册成功！正在跳转...')
      navigate('/projects')
    } catch (error: any) {
      const msg = error.message || '注册失败，请稍后重试'
      setErrorMsg(msg)
      message.error(msg)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            🎙️ SmartVoice
          </Title>
          <Text type="secondary">智能多角色有声内容创作平台</Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as 'login' | 'register')
            setErrorMsg('')
          }}
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form onFinish={handleLogin} layout="vertical" size="large">
                  {errorMsg && (
                    <Alert
                      message={errorMsg}
                      type="error"
                      showIcon
                      closable
                      onClose={() => setErrorMsg('')}
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <Form.Item
                    name="email"
                    label="用户名 / 邮箱"
                    rules={[
                      { required: true, message: '请输入用户名或邮箱' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="请输入用户名或邮箱"
                      autoComplete="username"
                      disabled={loading}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入密码"
                      autoComplete="current-password"
                      disabled={loading}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      {loading ? '登录中...' : '登录'}
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form onFinish={handleRegister} layout="vertical" size="large">
                  {errorMsg && (
                    <Alert
                      message={errorMsg}
                      type="error"
                      showIcon
                      closable
                      onClose={() => setErrorMsg('')}
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="请输入邮箱"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </Form.Item>

                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[
                      { required: true, message: '请输入用户名' },
                      { min: 2, message: '用户名至少2个字符' },
                      { max: 20, message: '用户名最多20个字符' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="请输入用户名（2-20个字符）"
                      autoComplete="username"
                      disabled={loading}
                      showCount
                      maxLength={20}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 6, message: '密码至少6位' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入密码（至少6位）"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      {loading ? '注册中...' : '注册'}
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

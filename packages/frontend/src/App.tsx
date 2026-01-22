import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout, Button, Space, Avatar, Dropdown } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAuthStore } from './stores/auth.store'
import { LoginPage } from './pages/LoginPage'
import { ProjectListPage } from './pages/ProjectListPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import './App.css'

const { Header, Content, Footer } = Layout

// 路由保护组件
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// 带导航的布局
function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#001529',
          padding: '0 24px',
        }}
      >
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
          🎙️ SmartVoice
        </div>
        {user && (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'user',
                  label: user.username,
                  icon: <UserOutlined />,
                  disabled: true,
                },
                {
                  key: 'divider',
                  type: 'divider',
                },
                {
                  key: 'logout',
                  label: '退出登录',
                  icon: <LogoutOutlined />,
                  danger: true,
                  onClick: () => {
                    logout()
                    window.location.href = '/login'
                  },
                },
              ],
            }}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<Avatar size="small" icon={<UserOutlined />} />}
              style={{ color: 'white' }}
            >
              {user.username}
            </Button>
          </Dropdown>
        )}
      </Header>
      <Content style={{ backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 134px)' }}>
        {children}
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        SmartVoice ©2026 - 让文字生动起来
      </Footer>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页面 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 受保护的路由 */}
        <Route
          path="/projects"
          element={
            <PrivateRoute>
              <AppLayout>
                <ProjectListPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <PrivateRoute>
              <AppLayout>
                <ProjectDetailPage />
              </AppLayout>
            </PrivateRoute>
          }
        />

        {/* 默认路由 */}
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

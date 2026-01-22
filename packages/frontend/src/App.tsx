import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import './App.css'

const { Header, Content, Footer } = Layout

function App() {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#001529'
        }}>
          <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
            🎙️ SmartVoice
          </div>
        </Header>
        <Content style={{ padding: '24px' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          SmartVoice ©2026 - 让文字生动起来
        </Footer>
      </Layout>
    </BrowserRouter>
  )
}

function HomePage() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px',
      backgroundColor: 'white',
      borderRadius: '8px'
    }}>
      <h1>欢迎使用 SmartVoice</h1>
      <p>智能多角色有声内容创作平台</p>
      <p style={{ color: '#666', marginTop: '24px' }}>
        前端脚手架已搭建完成 ✅
      </p>
    </div>
  )
}

export default App

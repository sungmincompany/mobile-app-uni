// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TappingProcessWork from './pages/TappingProcessWork';
import Header from './components/Header';
import AlarmHistory from './pages/AlarmHistory';
import Maintainance from './pages/Maintainance';
import DB_Inquiry from './pages/DB_Inquiry';
import WB_Inquiry from './pages/WB_Inquiry';
import Mold_Inquiry from './pages/Mold_Inquiry';
import Test_Inquiry from './pages/Test_Inquiry';
import VI_Inquiry from './pages/VI_Inquiry';
import Test_Result from './pages/Test_Result';
import './App.css';

import { Layout } from 'antd';
import 'antd/dist/reset.css';

const { Header: AntHeader, Sider, Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}> {/* 여백 제거 */}
        <AntHeader style={{ padding: 0, border: 'none', height: '48px' }}>
          <Header collapsed={collapsed} toggleCollapsed={toggleCollapsed} s />
        </AntHeader>

        <Layout>
          <Sider
            collapsed={collapsed}
            width="100vw"  // 전체 너비로 설정
            collapsedWidth="100vw"
            style={{
              backgroundColor: '#fff',
              position: 'fixed',
              left: 0,
              top: '48px',
              height: '100%',
              zIndex: 10,
              transition: 'transform 0.25s ease', // Smooth slide-in/out
              transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
            }}
          >
            <Sidebar collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
          </Sider>

          <Content style={{ backgroundColor: 'white' }} >
            <Routes>
              <Route path="/Maintainance" element={<Maintainance />} />
              <Route path="/AlarmHistory" element={<AlarmHistory />} />
              <Route path="/DB_Inquiry" element={<DB_Inquiry />} />
              <Route path="/WB_Inquiry" element={<WB_Inquiry />} />
              <Route path="/Mold_Inquiry" element={<Mold_Inquiry />} />
              <Route path="/Test_Inquiry" element={<Test_Inquiry />} />
              <Route path="/VI_Inquiry" element={<VI_Inquiry />} />
              <Route path="/Test_Result" element={<Test_Result />} />
              <Route path="/TappingProcessWork" element={<TappingProcessWork />} />

            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;

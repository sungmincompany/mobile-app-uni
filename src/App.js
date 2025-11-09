// src/App.js (수정됨)
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TappingProcessWork from './pages/TappingProcessWork';
import Header from './components/Header';
import AlarmHistory from './pages/AlarmHistory';
import Maintainance from './pages/Maintainance';

// 📌 [수정] import 이름에서 '_' 제거 (예: DB_Inquiry -> DbInquiry)
import DbInquiry from './pages/DB_Inquiry';
import WbInquiry from './pages/WB_Inquiry';
import MoldInquiry from './pages/Mold_Inquiry';
import TestInquiry from './pages/Test_Inquiry';
import ViInquiry from './pages/VI_Inquiry';
import TestResult from './pages/Test_Result'; // 📌 Test_Result -> TestResult

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
      <Layout style={{ minHeight: '100vh' }}>
        <AntHeader style={{ padding: 0, border: 'none', height: '48px' }}>
          <Header collapsed={collapsed} toggleCollapsed={toggleCollapsed} s />
        </AntHeader>

        <Layout>
          <Sider
            collapsed={collapsed}
            width="100vw"
            collapsedWidth="100vw"
            style={{
              backgroundColor: '#fff',
              position: 'fixed',
              left: 0,
              top: '48px',
              height: '100%',
              zIndex: 10,
              transition: 'transform 0.25s ease',
              transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
            }}
          >
            <Sidebar collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
          </Sider>

          <Content style={{ backgroundColor: 'white' }} >
            <Routes>
              <Route path="/Maintainance" element={<Maintainance />} />
              <Route path="/AlarmHistory" element={<AlarmHistory />} />
              
              {/* 📌 [수정] element={} 안의 컴포넌트 이름에서 '_' 제거 */}
              <Route path="/DB_Inquiry" element={<DbInquiry />} />
              <Route path="/WB_Inquiry" element={<WbInquiry />} />
              <Route path="/Mold_Inquiry" element={<MoldInquiry />} />
              <Route path="/Test_Inquiry" element={<TestInquiry />} />
              <Route path="/VI_Inquiry" element={<ViInquiry />} />
              <Route path="/Test_Result" element={<TestResult />} />
              
              <Route path="/TappingProcessWork" element={<TappingProcessWork />} />

            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;
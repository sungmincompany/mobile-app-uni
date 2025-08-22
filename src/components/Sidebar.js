// src/components/Sidebar.js
import React from 'react';
import { Menu } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ toggleCollapsed }) => {
  const navigate = useNavigate();

  const handleMenuClick = (path) => {
    navigate(path);
    toggleCollapsed(); // 메뉴 클릭 시 사이드바 접기
  };

  return (
    <Menu theme="light" mode="inline">
      <Menu.Item key="1" icon={<EditOutlined />} onClick={() => handleMenuClick('/Maintainance')}>
        설비 점검주기 조회
      </Menu.Item>
      <Menu.Item key="2" icon={<EditOutlined />} onClick={() => handleMenuClick('/AlarmHistory')}>
        설비 알람발생 조회
      </Menu.Item>
      <Menu.Item key="3" icon={<EditOutlined />} onClick={() => handleMenuClick('/DB_Inquiry')}>
        D/B 실적조회
      </Menu.Item>
      <Menu.Item key="4" icon={<EditOutlined />} onClick={() => handleMenuClick('/WB_Inquiry')}>
        W/B 실적조회
      </Menu.Item>
      <Menu.Item key="5" icon={<EditOutlined />} onClick={() => handleMenuClick('/Mold_Inquiry')}>
        Mold 실적조회
      </Menu.Item>
      <Menu.Item key="6" icon={<EditOutlined />} onClick={() => handleMenuClick('/Test_Inquiry')}>
        Test 실적조회
      </Menu.Item>
      <Menu.Item key="7" icon={<EditOutlined />} onClick={() => handleMenuClick('/VI_Inquiry')}>
        V/I 실적조회
      </Menu.Item>
      <Menu.Item key="8" icon={<EditOutlined />} onClick={() => handleMenuClick('/Test_Result')}>
        Test 공정 결과조회
      </Menu.Item>
      <Menu.Item key="9" icon={<EditOutlined />} onClick={() => handleMenuClick('/TappingProcessWork')}>
        Tapping 공정 작업실적 등록
      </Menu.Item>
    </Menu>
  );
};

export default Sidebar;

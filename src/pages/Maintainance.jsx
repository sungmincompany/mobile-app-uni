// src/pages/Maintainance.js
import React, { useState, useEffect } from 'react';
import { Table, message } from 'antd';
import './Maintainance.css';

const Maintainance = () => {
  const [maintenanceData, setMaintenanceData] = useState([]);
  // v_db 값은 실제 사용하는 스키마명으로 설정 (예: "25_DO")
  const v_db = "16_UR";

  // 설비 점검내역 API 호출 함수
  const fetchMaintenanceData = async () => {
    try {
      const response = await fetch(`/api/select/equip/inspect?v_db=${v_db}`);
      const data = await response.json();
      // 테이블에 key 값을 추가합니다.
      const formattedData = data.map((item, index) => ({ ...item, key: index }));
      setMaintenanceData(formattedData);
    } catch (error) {
      console.error("설비 점검 데이터 로드 실패:", error);
      message.error("설비 점검 데이터를 로드하는 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  // yyyymmdd 형태의 날짜를 "yy-MM-dd" 형식으로 변환하는 함수
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '최근점검내역없음') {
      return dateStr;
    }
    if (dateStr.length === 8) {
      return dateStr.substring(2, 4) + '-' + dateStr.substring(4, 6) + '-' + dateStr.substring(6, 8);
    }
    return dateStr;
  };

  // 테이블 컬럼 정의 (설비코드, 설비명, 최근점검일자, 점검 경과일수)
  const columns = [
    {
      title: "설비코드",
      dataIndex: "equip_cd",
      key: "equip_cd",
      align: "center",
    },
    {
      title: "설비명",
      dataIndex: "equip_nm",
      key: "equip_nm",
      align: "center",
    },
    {
      title: "최근점검일자",
      dataIndex: "equip_dt",
      key: "equip_dt",
      align: "center",
      render: (text) => formatDate(text),
    },
    {
      title: "점검 경과일수",
      dataIndex: "diff_dt",
      key: "diff_dt",
      align: "center",
    },
  ];

  return (
    <div className="Maintainance-container">
      <h2>설비 점검주기 조회</h2>
      <Table
        dataSource={maintenanceData}
        columns={columns}
        pagination={false}
        size="small"
        bordered={false}
        scroll={{ y: '73vh' }}
        style={{ boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px', borderRadius: '10px' }}
      />
    </div>
  );
};

export default Maintainance;

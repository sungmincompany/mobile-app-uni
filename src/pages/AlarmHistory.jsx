import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
// 백엔드 통신을 위해 fetch 또는 axios 사용 가능. 여기서는 fetch 사용 예시.
// import axios from 'axios';
import './AlarmHistory.css';

/**
 * AlarmHistory 컴포넌트
 * - 백엔드의 스마트 로그(smart-log) API를 호출하여
 *   데이터를 가져온 뒤 테이블 형태로 렌더링하는 컴포넌트.
 */
const AlarmHistory = () => {
  // 1) 테이블에 표시할 데이터를 저장하기 위한 state
  const [tableData, setTableData] = useState([]);

  /**
   * 2) 컴포넌트가 마운트될 때(처음 렌더링될 때)
   *    백엔드 API를 호출하여 데이터를 가져오는 역할을 수행.
   *    이 예시에서는 v_db 파라미터를 'MyDB'라고 가정했으나,
   *    실제 사용 시에는 필요한 DB 이름을 할당해야 함.
   */
  // DB 스키마
  const v_db = '16_UR';

  useEffect(() => {
    // fetch를 통해 백엔드로부터 JSON 데이터를 가져옴
    fetch(`http://118.43.32.5:8999/api/select/smart/smart-log?v_db=${v_db}`)
      .then((response) => response.json())
      .then((data) => {
        // 받아온 데이터에 key를 부여(테이블 고유 key)
        const withKey = data.map((item, index) => ({
          ...item,
          key: index, // key로 index 값을 사용(고유성 보장)
        }));
        setTableData(withKey);
      })
      .catch((error) => {
        console.error('데이터 가져오기 실패:', error);
      });
  }, []);

  /**
   * 3) 테이블 컬럼 정의
   *    - title : 컬럼 헤더명
   *    - dataIndex : 데이터 객체에서 가져올 필드명
   *    - key : 리액트에서 식별자 용도
   *    - render : 표시 형식을 커스터마이징
   */
  const columns = [
    {
      // auto_id 필드를 표시
      title: '알람 ID',
      dataIndex: 'auto_id',
      key: 'auto_id',
      width: '90px',
      align: 'center',
    },
    {
      // ymdhhmm 필드를 표시(YYYYMMDDhhmm 형태로 넘어올 것으로 가정)
      // 날짜/시간을 구분해서 보여주거나, 원하시는 포맷으로 처리 가능
      title: '발생일시',
      dataIndex: 'ymdhhmm',
      key: 'ymdhhmm',
      align: 'center',
      render: (text) => {
        // 예: '202304011230' => '2023-04-01 12:30' 형태로 변환
        if (!text || text.length < 12) return text;

        const year = text.slice(0, 4);
        const month = text.slice(4, 6);
        const day = text.slice(6, 8);
        const hour = text.slice(8, 10);
        const minute = text.slice(10, 12);

        return (
          <div>
            <div>{`${year}-${month}-${day}`}</div>
            <div>{`${hour}:${minute}`}</div>
          </div>
        );
      },
    },
    {
      // col_1 필드를 표시
      title: 'col_1',
      dataIndex: 'col_1',
      key: 'col_1',
      align: 'center',
    },
    {
      // col_2 필드를 표시
      title: 'col_2',
      dataIndex: 'col_2',
      key: 'col_2',
      align: 'center',
    },
    {
      // col_3 필드를 표시
      title: 'col_3',
      dataIndex: 'col_3',
      key: 'col_3',
      align: 'center',
    },
    {
      // col_4 필드를 표시
      title: 'col_4',
      dataIndex: 'col_4',
      key: 'col_4',
      align: 'center',
    },
  ];

  /**
   * 4) 확장 행(확장 패널)에 표시할 내용 정의
   *    - bigo 필드를 알람 메시지처럼 표시.
   */
  const expandedRowRender = (record) => (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#fafafa',
        textAlign: 'center',
      }}
    >
      <strong>알람 메시지:</strong> {record.bigo}
    </div>
  );

  return (
    <div className="alarm-history-container">
      {/* 상단 타이틀 */}
      <h2>설비 알람발생 조회</h2>

      {/* antd Table 컴포넌트 */}
      <Table
        columns={columns}
        dataSource={tableData}                  // 백엔드에서 받아온 데이터
        pagination={false}                     // 페이지네이션 비활성화
        rowClassName="alarm-history-row"       // 커스텀 row 스타일
        bordered={false}                       // 테두리 사용 여부
        expandedRowRender={expandedRowRender}  // 확장 행 내용
        expandIconColumnIndex={columns.length} // 확장 아이콘을 오른쪽 끝에 배치
        scroll={{ y: '74vh' }}                 // 스크롤 설정(필요시 높이 조절)
        style={{ 
          boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px', 
          borderRadius: '10px' 
        }}
      />
    </div>
  );
};

export default AlarmHistory;

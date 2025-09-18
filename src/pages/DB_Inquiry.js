// src/pages/DB_Inquiry.js (다이본드 DB 실적조회)
import React, { useState, useEffect } from 'react';
import { Table, DatePicker, message } from 'antd';
import dayjs from 'dayjs';

const DB_Inquiry = () => {
  const [data, setData] = useState([]);
  const [fromDt, setFromDt] = useState(dayjs().startOf('month'));
  const [toDt, setToDt] = useState(dayjs());

  // prg_cd = 110 (다이본드), DB 스키마 = "16_UR" (예시)
  const v_db = "16_UR";
  const prg_cd = "110";

  const fetchData = async () => {
    try {
      const fromParam = fromDt ? fromDt.format("YYYYMMDD") : "19990101";
      const toParam = toDt ? toDt.format("YYYYMMDD") : "20991231";

      const response = await fetch(
        `/api/select/segsan/process?v_db=${v_db}&prg_cd=${prg_cd}&from_dt=${fromParam}&to_dt=${toParam}`
      );
      if (!response.ok) throw new Error("서버 응답 에러");
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("실적 조회 실패:", err);
      message.error("실적 조회 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    // 날짜가 변경될 때마다 조회
    fetchData();
  }, [fromDt, toDt]);

  const columns = [
    /*
    {
      title: "제품코드",
      dataIndex: "jepum_cd",
      key: "jepum_cd",
      align: "center",
    },*/
    {
      title: "제품명",
      dataIndex: "jepum_nm",
      key: "jepum_nm",
      align: "center",
    },
    {
      title: "생산일자",
      dataIndex: "segsan_dt",
      key: "segsan_dt",
      align: "center",
    },
    {
      title: "수량",
      dataIndex: "amt",
      key: "amt",
      align: "center",
    },
    {
      title: "LOT NO",
      dataIndex: "lot_no",
      key: "lot_no",
      align: "center",
    },
  ];

  return (
    <div style={{ padding: 10 }}>
      <h2>D/B 실적조회</h2>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <DatePicker value={fromDt} onChange={setFromDt} format="YYYY-MM-DD" />
        <span style={{ margin: '0 8px' }}>~</span>
        <DatePicker value={toDt} onChange={setToDt} format="YYYY-MM-DD" />
      </div>
      <Table
        dataSource={data.map((item, idx) => ({ ...item, key: idx }))}
        columns={columns}
        pagination={false}
        size="small"
        style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.24)', borderRadius: 10 }}
      />
    </div>
  );
};

export default DB_Inquiry;

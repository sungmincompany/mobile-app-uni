// src/pages/VI_Inquiry.js (수정됨)
import React, { useState, useEffect, useCallback } from 'react'; // 📌 useCallback 추가
import { Table, DatePicker, message } from 'antd';
import dayjs from 'dayjs';

// 📌 [수정] 컴포넌트 이름 변경 (DB_Inquiry -> ViInquiry)
const ViInquiry = () => {
  const [data, setData] = useState([]);
  const [fromDt, setFromDt] = useState(dayjs().startOf('month'));
  const [toDt, setToDt] = useState(dayjs());

  const v_db = "16_UR";
  const prg_cd = "160";

  // 📌 [수정] fetchData 함수를 useCallback으로 감싸줍니다.
  const fetchData = useCallback(async () => {
    try {
      const fromParam = fromDt ? fromDt.format("YYYYMMDD") : "19990101";
      const toParam   = toDt   ? toDt.format("YYYYMMDD")   : "20991231";

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
  }, [fromDt, toDt, v_db, prg_cd]); // 📌 fetchData가 의존하는 값들

  useEffect(() => {
    fetchData();
  }, [fetchData]); // 📌 [수정] 의존성 배열에 fetchData 추가

  const columns = [
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
      <h2>V/I 실적조회</h2>
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

// 📌 [수정] export default 이름 변경
export default ViInquiry;
import React, { useState, useEffect, useRef } from 'react';
import {
  Tabs, Form, Input, Button, DatePicker, message, Row, Col, Table, Modal, Select, Popover, Switch, Space, AutoComplete
} from 'antd';
import dayjs from 'dayjs';
import { QRCodeSVG } from 'qrcode.react';

const { TabPane } = Tabs;
const { confirm } = Modal;
const { Option } = Select;

// ------------------------------------------------------------------
// LabelToPrint 컴포넌트 (📌 1번 짤림 문제 수정: 3열 기반 + flex 레이아웃)
// ------------------------------------------------------------------
const LabelToPrint = ({ data }) => {
  if (!data) return null;

  const labelStyle = {
    width: '50mm',
    height: '30mm',
    padding: '0', 
    boxSizing: 'border-box',
    fontFamily: 'Malgun Gothic, Arial, sans-serif',
    fontSize: '7pt', 
    lineHeight: 1.2,
    position: 'relative', 
    border: '1px dashed #999', 
    backgroundColor: 'white',
    color: 'black',
    overflow: 'hidden', 
  };

  // 📌 [수정] table-layout: fixed 추가
  const tableStyle = { 
    width: '100%', 
    height: '100%', 
    borderCollapse: 'collapse',
    tableLayout: 'fixed', // 📌 1-1. 렌더링 문제 해결을 위해 fixed 레이아웃 사용
  };
  
  // 📌 [수정] 첫 번째 열(TH) 너비 고정
  const thStyle = { 
    border: '1px solid #333', 
    padding: '0.5mm 1mm', 
    fontSize: '8pt',      
    whiteSpace: 'nowrap',   
    textAlign: 'left', 
    width: '20%', // 📌 1-2. 첫 번째 열(TH) 너비 고정
    backgroundColor: '#eee' 
  };
  
  // 📌 [수정] 두 번째 열(TD) 너비 고정
  const tdStyle = { 
    border: '1px solid #333', 
    padding: '0.5mm 1mm', 
    fontSize: '9pt',        
    wordBreak: 'break-all', 
    verticalAlign: 'middle',
    width: '45%', // 📌 1-3. 두 번째 열(TD) 너비 고정
  };

  // 📌 [신규] 짤림 방지용 TD 스타일 (폰트 줄임, 줄바꿈 방지)
  const tdNowrapStyle = {
    ...tdStyle,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '8pt', 
  };

  // 📌 [신규] QR 코드 셀 스타일 (너비 고정)
  const qrTdStyle = {
    ...tdStyle,
    width: '35%', // 📌 1-4. 세 번째 열(QR) 너비 고정
    padding: '0.5mm',
    textAlign: 'center',
    verticalAlign: 'middle',
  };

  const qrCellContentStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', 
    height: '100%',
  };

  // 3자리 콤마 포맷 적용
  const formattedAmt = data.amt ? Number(data.amt).toLocaleString('en-US') : '0';

  return (
    <div style={labelStyle} className="label-print-container-class">
      {/* 📌 [수정] 3열 구조 (TH, TD, QR-TD) */}
      <table style={tableStyle}>
        <tbody>
          {/* 1, 2, 3 행 */}
          <tr>
            <th style={thStyle}>LOT</th>
            {/* 📌 1-5. 짤림 방지를 위해 tdNowrapStyle 적용 */}
            <td style={tdNowrapStyle}>{data.lot_no}</td>
            <td rowSpan="3" style={qrTdStyle}> {/* QR 셀 */}
              <div style={qrCellContentStyle}>
                <QRCodeSVG
                  value={data.lot_no || 'N/A'}
                  size={50} 
                  style={{ width: '13mm', height: '13mm' }}
                  level="M"
                />
              </div>
            </td>
          </tr>
          <tr>
            <th style={thStyle}>상위</th>
            <td style={tdNowrapStyle}>{data.lot_no2}</td>
          </tr>
          <tr>
            <th style={thStyle}>제품</th>
            <td style={{...tdStyle, fontSize: '8pt'}}>{data.jepum_nm}</td> {/* 제품명은 짤릴 수 있으므로 폰트만 조정 */}
          </tr>

          {/* 📌 [수정] 4행 (수량 + 장비) - colSpan=2 사용 */}
          <tr>
            <th style={thStyle}>수량</th>
            <td style={{...tdStyle, padding: 0, colSpan: 2}} colSpan={2}>
              {/* 📌 1-6. 내부에 flex를 사용하여 4열처럼 보이게 함 */}
              <div style={{ display: 'flex', height: '100%', width: '100%' }}>
                {/* 수량 데이터 (너비: 45%) */}
                <div style={{ ...tdNowrapStyle, width: 'calc(45% + 0.5px)', border: 'none', borderRight: '1px solid #333' }}>
                  {formattedAmt}
                </div>
                {/* 장비 TH (너비: 20%) */}
                <div style={{ ...thStyle, width: '20%', border: 'none', borderRight: '1px solid #333', borderTop: '1px solid #333' }}>
                  장비
                </div>
                {/* 장비 데이터 (너비: 35%) */}
                <div style={{ ...tdNowrapStyle, width: '35%', border: 'none', borderTop: '1px solid #333' }}>
                  {data.dev_no || ''}
                </div>
              </div>
            </td>
          </tr>

          {/* 📌 [수정] 5행 (작업 + BIN) - colSpan=2 사용 */}
          <tr>
            <th style={thStyle}>작업</th>
            <td style={{...tdStyle, padding: 0, colSpan: 2}} colSpan={2}>
              {/* 📌 1-7. 내부에 flex를 사용하여 4열처럼 보이게 함 */}
              <div style={{ display: 'flex', height: '100%', width: '100%' }}>
                {/* 작업 데이터 (너비: 45%) */}
                <div style={{ ...tdNowrapStyle, width: 'calc(45% + 0.5px)', border: 'none', borderRight: '1px solid #333' }}>
                  {data.man_cd}
                </div>
                {/* BIN TH (너비: 20%) */}
                <div style={{ ...thStyle, width: '20%', border: 'none', borderRight: '1px solid #333', borderTop: '1px solid #333' }}>
                  BIN
                </div>
                {/* BIN 데이터 (너비: 35%) */}
                <div style={{ ...tdNowrapStyle, width: '35%', border: 'none', borderTop: '1px solid #333' }}>
                  {data.bin_no || ''}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
// ------------------------------------------------------------------
// (이하 TestResult 컴포넌트)
// ------------------------------------------------------------------


// 컴포넌트 이름 (PascalCase)
const TestResult = () => {
  const [form] = Form.useForm();
  const [productList, setProductList] = useState([]);
  const [workerList, setWorkerList] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [fromDt, setFromDt] = useState(dayjs().startOf('month'));
  const [toDt, setToDt] = useState(dayjs());
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('1');
  const v_db = '16_UR'; 
  const [isVirtualKeyboardOn, setIsVirtualKeyboardOn] = useState(false);
  const [barcodeScanOn, setBarcodeScanOn] = useState(true);
  const barcodeInputRef = useRef(null);
  const [idleCountdown, setIdleCountdown] = useState(10);
  const idleTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const [barcodeInputValue, setBarcodeInputValue] = useState('');
  const [isProductSelectReady, setIsProductSelectReady] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  const [printableData, setPrintableData] = useState(null);
  const [modalTitle, setModalTitle] = useState('등록/수정 완료');
  const [openPopoverKey, setOpenPopoverKey] = useState(null);

  // 브라우저 기본 인쇄 기능 호출
  const handleSimplePrint = () => {
    window.print();
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setPrintableData(null); 
    if (editingRecord) {
      setActiveTab('2');
      setEditingRecord(null); 
    }
  };

  // 재인쇄 버튼 클릭 핸들러
  const handleRePrint = (record) => {
    const product = productList.find(p => p.jepum_cd === record.jepum_cd);
    const jepum_nm = product ? product.jepum_nm : record.jepum_cd;
    let displayDate = record.work_dt;
    if (record.work_dt && record.work_dt.length === 8) {
      displayDate = `${record.work_dt.slice(0, 4)}-${record.work_dt.slice(4, 6)}-${record.work_dt.slice(6, 8)}`;
    }
    setModalTitle('라벨 재인쇄');
    setPrintableData({ 
      lot_no: record.lot_no,
      lot_no2: record.lot_no2,
      jepum_nm: jepum_nm, 
      amt: record.amt,
      man_cd: record.man_cd,
      work_dt: displayDate,
      dev_no: record.dev_no,   // (이전 수정에서 추가됨)
      bin_no: record.bigo_1, // (이전 수정에서 추가됨)
    });
  };

  // Popover 열기/닫기 핸들러
  const handlePopoverChange = (visible, key) => {
    setOpenPopoverKey(visible ? key : null);
  };
  
  // '장비번호' 필드의 onBlur(포커스 아웃) 이벤트 핸들러
  const handleDevNoBlur = () => {
    const allValues = form.getFieldsValue();
    const newDevNo = allValues.dev_no;
    const changedValues = { dev_no: newDevNo }; 
    handleValuesChange(changedValues, allValues);
  };

  // Form 값이 변경될 때마다 호출되는 핸들러
  const handleValuesChange = (changedValues, allValues) => {
    if (changedValues.hasOwnProperty('dev_no')) {
      const newDevNo = changedValues.dev_no;
      if (newDevNo && !allValues.lot_no) {
        const now = dayjs();
        const mmdd = now.format('MMDD'); 
        const hhmm = now.format('HHMM'); 
        const generatedLotNo = `${mmdd}-${hhmm}-${newDevNo}`;
        form.setFieldsValue({ lot_no: generatedLotNo });
      }
    }
  };

  // --- 유휴 상태 감지 및 자동 포커스 로직 ---
  useEffect(() => {
    const resetIdleTimer = () => {
      clearTimeout(idleTimerRef.current);
      clearInterval(countdownTimerRef.current);
      if (!barcodeScanOn || activeTab !== '1') return;
      setIdleCountdown(10); 
      countdownTimerRef.current = setInterval(() => {
        setIdleCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      idleTimerRef.current = setTimeout(() => {
        if (barcodeInputRef.current && document.activeElement !== barcodeInputRef.current.input) {
          barcodeInputRef.current.focus();
        }
      }, 10000); 
    };
    if (barcodeScanOn && activeTab === '1') {
      const events = ['mousedown', 'touchstart', 'keydown'];
      events.forEach(event => window.addEventListener(event, resetIdleTimer));
      resetIdleTimer();
      return () => {
        events.forEach(event => window.removeEventListener(event, resetIdleTimer));
        clearTimeout(idleTimerRef.current);
        clearInterval(countdownTimerRef.current);
      };
    } else {
      clearTimeout(idleTimerRef.current);
      clearInterval(countdownTimerRef.current);
    }
  }, [barcodeScanOn, activeTab]);

  // --- 바코드 스캔 처리 핸들러 ---
  const handleBarcodeScan = async (e) => {
    const barcodeValue = barcodeInputValue.trim();
    if (barcodeValue) {
      const regexPlus = /^(.*?)\+(.*?)\((.*?)\+(.*?)\)$/;
      const regexSingle = /^(.*)\((lot_no2|dev_no|bin_no)\)$/;
      const matchPlus = barcodeValue.match(regexPlus);
      const matchSingle = barcodeValue.match(regexSingle);
      const fieldNames = { lot_no2: '상위 LOT No', dev_no: '장비번호', bin_no: 'BIN No' };
      let changedData = {};
      let allData = form.getFieldsValue(); 

      if (matchPlus) {
        let value1 = matchPlus[1], value2 = matchPlus[2]; 
        const field1 = matchPlus[3], field2 = matchPlus[4];
        const fieldName1 = fieldNames[field1] || field1, fieldName2 = fieldNames[field2] || field2;
        if (field1 === 'lot_no2') {
          value1 = await fetchProductInfoByLotNo2(value1); 
          message.success(`${fieldName2} '${value2}' (으)로 설정되었습니다.`);
        } else if (field2 === 'lot_no2') {
          value2 = await fetchProductInfoByLotNo2(value2);
          message.success(`${fieldName1} '${value1}' (으)로 설정되었습니다.`);
        } else {
          message.success(`${fieldName1} '${value1}', ${fieldName2} '${value2}' (으)로 설정되었습니다.`);
        }
        changedData = { [field1]: value1, [field2]: value2 };
      } else if (matchSingle) {
        const valueToSet = matchSingle[1], fieldToSet = matchSingle[2];
        const fieldName = fieldNames[fieldToSet];
        if (fieldToSet === 'lot_no2') {
          const finalValue = await fetchProductInfoByLotNo2(valueToSet);
          changedData = { [fieldToSet]: finalValue };
        } else {
          message.success(`${fieldName}가 '${valueToSet}' (으)로 설정되었습니다.`);
          changedData = { [fieldToSet]: valueToSet };
        }
      } else {
        const finalValue = await fetchProductInfoByLotNo2(barcodeValue);
        changedData = { lot_no2: finalValue };
      }

      form.setFieldsValue(changedData);
      allData = form.getFieldsValue(); 
      if (changedData.hasOwnProperty('dev_no')) {
        handleValuesChange(changedData, allData);
      }
      setBarcodeInputValue('');
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
    }
  };

  // --- 상위 LOT No로 제품 정보 조회 ---
  const fetchProductInfoByLotNo2 = async (lotNo2Value) => {
    if (!lotNo2Value) return lotNo2Value;
    try {
      const res = await fetch(`/api/select/etc/lot_no_inform?v_db=${v_db}&lot_no2=${lotNo2Value}`);
      if (!res.ok) throw new Error(`서버 응답 오류: ${res.status}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const product = data[0]; 
        if (product.jepum_cd) {
          form.setFieldsValue({ jepum_cd: product.jepum_cd });
          message.success(`제품 '${product.jepum_nm || product.jepum_cd}'이(가) 자동 설정되었습니다.`);
        } else {
          message.warning(`상위 LOT(${lotNo2Value})에 해당하는 제품 코드가 없습니다.`);
        }
        if (product.bigo39 && product.bigo40) {
          const combinedLotNo2 = `${product.bigo39}-${product.bigo40}`;
          message.info(`상위 LOT No가 '${combinedLotNo2}'(으)로 자동 설정되었습니다.`);
          return combinedLotNo2;
        }
        message.success(`상위 LOT No가 '${lotNo2Value}' (으)로 설정되었습니다.`);
        return lotNo2Value;
      } else {
        message.warning(`상위 LOT(${lotNo2Value})에 해당하는 제품 정보가 없습니다.`);
        return lotNo2Value;
      }
    } catch (err) {
      console.error('fetchProductInfoByLotNo2 에러:', err);
      message.error('제품 정보 조회 중 오류가 발생했습니다.');
      return lotNo2Value;
    }
  };

  // 2) 제품 목록 불러오기
  useEffect(() => {
    fetch(`/api/select/jepum/jepum?v_db=${v_db}`)
      .then((res) => res.json())
      .then((data) => setProductList(data))
      .catch((err) => console.error('제품 목록 에러:', err));
  }, [v_db]);

  // 작업자 목록 불러오기
  useEffect(() => {
    const fetchWorkerList = async () => {
      try {
        const res = await fetch(`/api/select/etc/test_man_cd?v_db=${v_db}&dept_cd=P0503`);
        if (!res.ok) throw new Error('작업자 목록 조회 오류');
        const data = await res.json();
        const formattedList = data.map(worker => ({ value: worker.emp_nmk, label: worker.emp_nmk }));
        setWorkerList(formattedList);
      } catch (err) {
        console.error('fetchWorkerList 에러:', err);
        message.error('작업자 목록을 불러오는 데 실패했습니다.');
      }
    };
    fetchWorkerList();
  }, [v_db]); 

  // 3) Test Result 조회
  // 📌 2-1. [확인] 이 함수가 호출하는 API가 'dev_no'와 'lot_no2'를 반환하는지 확인해야 합니다.
  const fetchTestResults = async (startDate, endDate) => {
    try {
      const fromParam = startDate ? startDate.format('YYYYMMDD') : '19990101';
      const toParam = endDate ? endDate.format('YYYYMMDD') : '20991231';
      const res = await fetch(`/api/select/etc/test-result?v_db=${v_db}&from_dt=${fromParam}&to_dt=${toParam}`);
      if (!res.ok) throw new Error('TEST 실적 조회 오류');
      const data = await res.json();
      data.forEach((item, idx) => { item.key = idx; });
      setTestResults(data);
    } catch (err) {
      console.error('fetchTestResults 에러:', err);
      message.error('TEST 실적 조회 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchTestResults(fromDt, toDt);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDt, toDt]);

  // 4) 등록/수정 처리
  const onFinish = async (values) => {
    try {
      const work_dt = values.work_dt ? values.work_dt.format('YYYY-MM-DD') : null;
      const bodyPayload = {
        lot_no: values.lot_no, lot_no2: values.lot_no2, dev_no: values.dev_no,
        jepum_cd: values.jepum_cd, amt: Number(values.amt) || 0, man_cd: values.man_cd,
        bin_no: values.bin_no, work_dt,
      };

      const product = productList.find(p => p.jepum_cd === values.jepum_cd);
      
      const dataForPrint = {
        ...values, 
        work_dt: work_dt, 
        jepum_nm: product ? product.jepum_nm : values.jepum_cd,
      };

      if (!editingRecord) { // 신규 등록
        const response = await fetch(`/api/insert/etc/test-result?v_db=${v_db}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyPayload),
        });
        const resData = await response.json();
        if (resData.error) {
          message.error(`등록 실패: ${resData.error}`);
        } else {
          message.success('등록 성공!'); 
          fetchTestResults(fromDt, toDt); // 📌 2-2. [확인] 등록 후 데이터를 다시 불러옵니다.
          setModalTitle('등록 완료'); 
          setPrintableData(dataForPrint); // 모달 열기
          form.resetFields(); 
          form.setFieldsValue({ work_dt: dayjs(), amt: 20500 }); 
        }
      } else { // 수정
        const response = await fetch(`/api/update/etc/test-result?v_db=${v_db}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyPayload),
        });
        const resData = await response.json();
        if (resData.error) {
          message.error(`수정 실패: ${resData.error}`);
        } else {
          message.success('수정 성공!');
          fetchTestResults(fromDt, toDt); // 📌 2-3. [확인] 수정 후 데이터를 다시 불러옵니다.
          setModalTitle('수정 완료');
          setPrintableData(dataForPrint); // 모달 열기
          form.resetFields(); 
          form.setFieldsValue({ work_dt: dayjs(), amt: 20500 });
        }
      }
    } catch (error) {
      console.error('onFinish 에러:', error);
      message.error('등록/수정 중 오류가 발생했습니다.');
    }
  };

  const onFinishFailed = (errorInfo) => {
    message.error('모든 항목을 올바르게 입력해주세요!');
  };

  // 5) 수정
  // 📌 2-4. [확인] 'record'에 dev_no, lot_no2가 있어야 폼에 채워집니다.
  const handleEdit = (record) => {
    setEditingRecord(record);
    let workDtObj = null;
    if (record.work_dt && record.work_dt.length === 8) {
      const year = record.work_dt.slice(0, 4), month = record.work_dt.slice(4, 6), day = record.work_dt.slice(6, 8);
      workDtObj = dayjs(`${year}-${month}-${day}`, 'YYYY-MM-DD');
    }
    form.setFieldsValue({
      lot_no: record.lot_no, 
      lot_no2: record.lot_no2, // 📌 이 값이 API 응답에 없으면 폼이 비워집니다.
      dev_no: record.dev_no,   // 📌 이 값이 API 응답에 없으면 폼이 비워집니다.
      jepum_cd: record.jepum_cd, 
      amt: record.amt, 
      man_cd: record.man_cd,
      bin_no: record.bigo_1, // (BIN No는 bigo_1 필드를 사용)
      work_dt: workDtObj,
    });
    setActiveTab('1');
  };

  // 6) 삭제
  const handleDelete = (record) => {
    confirm({
      title: '해당 실적을 삭제하시겠습니까?', okText: '예', cancelText: '아니오',
      onOk: async () => {
        try {
          const url = `/api/delete/etc/test-result?v_db=${v_db}&lot_no=${record.lot_no}`;
          const res = await fetch(url, { method: 'DELETE' });
          const resData = await res.json();
          if (resData.error) {
            message.error(`삭제 실패: ${resData.error}`);
          } else {
            message.success('삭제 성공!');
            fetchTestResults(fromDt, toDt);
          }
        } catch (err) {
          console.error('삭제 에러:', err);
          message.error('삭제 중 오류가 발생했습니다.');
        }
      },
    });
  };

  // 7) 테이블 컬럼
  const columns = [
    {
      title: '작업일자', dataIndex: 'work_dt', key: 'work_dt', align: 'center', width: 100,
      render: (text) => (text && text.length === 8) ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}` : text,
    },
    {
      title: 'LOT 정보', dataIndex: 'lot_no', key: 'lot_info', align: 'center', width: 120,
      // 📌 2-5. [확인] 'record.lot_no2'를 사용하도록 설정되어 있습니다.
      render: (value, record) => (<><div>{value}</div><div style={{ color: 'gray' }}>{record.lot_no2}</div></>),
    },
    {
      title: '제품', dataIndex: 'jepum_cd', key: 'jepum_cd', align: 'center', width: 140,
      render: (code) => {
        const prod = productList.find((p) => p.jepum_cd === code);
        return prod ? prod.jepum_nm : code;
      },
    },
    {
      title: '작업정보', dataIndex: 'amt', key: 'work_info', align: 'center', width: 140,
      // 📌 2-6. [확인] 'record.dev_no'를 사용하도록 설정되어 있습니다.
      render: (value, record) => (<>
        <div>수량: {value}</div>
        <div>장비: {record.dev_no}</div>
        <div>작업자: {record.man_cd}</div>
        <div>BIN: {record.bigo_1}</div>
      </>),
    },
    {
      title: '작업', key: 'action', align: 'center', width: 80,
      render: (_, record) => {
        const popoverContent = (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <Button type="link" onClick={() => { handleEdit(record); setOpenPopoverKey(null); }}>
              수정
            </Button>
            <Button type="link" onClick={() => { handleRePrint(record); setOpenPopoverKey(null); }}>
              재인쇄
            </Button>
            <Button type="link" danger onClick={() => { setOpenPopoverKey(null); handleDelete(record); }}>
              삭제
            </Button>
          </div>
        );
        return (
          <Popover
            content={popoverContent}
            trigger="click"
            open={openPopoverKey === record.key}
            onOpenChange={(visible) => handlePopoverChange(visible, record.key)}
          >
            <Button>+</Button>
          </Popover>
        );
      },
    },
  ];

  // 8) 화면 렌더링
  return (
    <div style={{ padding: 16 }} id="test-result-container">
      {/* --- 1. 메인 화면 (no-print 유지) --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }} className="no-print">
        <h2>TEST 공정 결과조회</h2>
        <Space>
          <span style={{ fontSize: '0.9em', color: '#555' }}>가상키보드</span>
          <Switch
            checkedChildren="ON"
            unCheckedChildren="OFF"
            checked={isVirtualKeyboardOn}
            onChange={setIsVirtualKeyboardOn}
          />
        </Space>
      </div>

      {/* --- 2. 탭 (no-print 유지) --- */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="no-print">
        
        <TabPane tab="등록" key="1">
          <div className="no-print">
            <Form.Item label="바코드 스캔">
              <Row gutter={8} align="middle" wrap={false}>
                <Col flex="auto">
                  <Input
                    ref={barcodeInputRef}
                    placeholder="바코드를 스캔하세요"
                    onPressEnter={handleBarcodeScan}
                    value={barcodeInputValue}
                    onChange={(e) => setBarcodeInputValue(e.target.value)}
                    inputMode={isVirtualKeyboardOn ? 'text' : 'none'}
                  />
                </Col>
                <Col flex="none">
                  <Space>
                    <Switch
                      checkedChildren="ON"
                      unCheckedChildren="OFF"
                      checked={barcodeScanOn}
                      onChange={setBarcodeScanOn}
                    />
                    {barcodeScanOn && <span style={{ color: '#1677ff', fontWeight: 'bold', whiteSpace: 'nowrap' }}>({idleCountdown}초)</span>}
                  </Space>
                </Col>
              </Row>
            </Form.Item>
            <Form
              form={form} layout="vertical" onFinish={onFinish} onFinishFailed={onFinishFailed}
              initialValues={{ amt: 20500, work_dt: dayjs() }} style={{ maxWidth: 600 }}
            >
              <Form.Item label="작업일자" name="work_dt" rules={[{ required: true, message: '작업일자를 선택하세요.' }]}>
                <DatePicker placeholder="작업일자" style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item label="LOT No" name="lot_no" rules={[{ required: true, message: 'LOT No를 입력하세요.' }]}>
                <Input name="lot_no" placeholder="LOT No" inputMode={isVirtualKeyboardOn ? 'text' : 'none'} />
              </Form.Item>

              <Form.Item label="상위 LOT No" name="lot_no2">
                <Input name="lot_no2" placeholder="상위 LOT No" inputMode={isVirtualKeyboardOn ? 'text' : 'none'} />
              </Form.Item>

              <Form.Item label="제품" name="jepum_cd" rules={[{ required: true, message: '제품을 선택하세요.' }]}>
                <Select
                  showSearch placeholder="제품 검색" optionFilterProp="children"
                  open={isProductDropdownOpen}
                  onFocus={() => { if (!isProductSelectReady) setIsProductSelectReady(true); else setIsProductDropdownOpen(true); }}
                  onSearch={(value) => { if (value && !isProductDropdownOpen) setIsProductDropdownOpen(true); }}
                  onBlur={() => { setIsProductDropdownOpen(false); setIsProductSelectReady(false); }}
                  onSelect={() => { setIsProductDropdownOpen(false); setIsProductSelectReady(false); }}
                  filterOption={(input, option) => (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                >
                  {productList.map((p) => (
                    <Option key={p.jepum_cd} value={p.jepum_cd}>{p.jepum_nm} ({p.jepum_cd})</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="장비번호" name="dev_no">
                <Input name="dev_no" placeholder="장비번호" inputMode={isVirtualKeyboardOn ? 'text' : 'none'} onBlur={handleDevNoBlur} />
              </Form.Item>

              <Form.Item label="수량" name="amt"
                rules={[
                  { required: true, message: '수량을 입력하거나 선택하세요.' },
                  { validator: (_, value) => {
                      const num = Number(value);
                      if (!value) return Promise.resolve();
                      if (isNaN(num)) return Promise.reject(new Error('수량은 숫자여야 합니다.'));
                      if (num < 1) return Promise.reject(new Error('수량은 1 이상이어야 합니다.'));
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <AutoComplete
                  options={[{ value: '3050' }, { value: '20500' }]}
                  filterOption={(inputValue, option) => option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
                >
                  <Input placeholder="수량을 입력하거나 선택하세요" inputMode="numeric" onFocus={() => form.setFieldsValue({ amt: '' })} />
                </AutoComplete>
              </Form.Item>

              <Form.Item label="BIN No" name="bin_no" rules={[{ required: true, message: 'BIN No를 입력하세요.' }]}>
                <Input name="bin_no" placeholder="BIN No" inputMode={isVirtualKeyboardOn ? 'text' : 'none'} />
              </Form.Item>

              <Form.Item label="작업자" name="man_cd" rules={[{ required: true, message: '작업자를 선택하세요.' }]}>
                <Select placeholder="작업자 선택" options={workerList} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
                  {editingRecord ? '수정하기' : '등록하기'}
                </Button>
                <Button onClick={() => {
                    form.resetFields(); 
                    setEditingRecord(null);
                    form.setFieldsValue({ work_dt: dayjs(), amt: 20500 });
                    setBarcodeInputValue('');
                    if (barcodeScanOn && barcodeInputRef.current) barcodeInputRef.current.focus();
                  }}>초기화</Button>
              </Form.Item>
            </Form>
          </div>
        </TabPane>

        <TabPane tab="조회" key="2">
          <div className="no-print">
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
              <Row style={{ flexFlow: 'row nowrap' }} gutter={8}>
                <Col span={9}><DatePicker value={fromDt} format="YYYY-MM-DD" onChange={(date) => setFromDt(date)} /></Col>
                <span style={{ margin: '5px 2px' }}>~</span>
                <Col span={9}><DatePicker value={toDt} format="YYYY-MM-DD" onChange={(date) => setToDt(date)} /></Col>
                <Col span={8}><Button type="primary" onClick={() => fetchTestResults(fromDt, toDt)}>조회</Button></Col>
              </Row>
            </div>
            <Table columns={columns} dataSource={testResults} pagination={{ pageSize: 10 }} />
          </div>
        </TabPane>
      </Tabs>

      {/* --- 3. 모달 (변경 없음) --- */}
      <Modal
        title={modalTitle} 
        open={!!printableData}
        onCancel={handleModalClose}
        width={400} 
        footer={null}
        getContainer={false} 
      >
        <div className="modal-print-preview-content">
          <p>
            {modalTitle.includes('완료') 
              ? `다음 정보가 성공적으로 ${modalTitle}되었습니다.`
              : `다음 라벨을 재인쇄합니다.`
            }
          </p>
          <hr style={{ margin: '16px 0' }} />
          
          <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>인쇄 미리보기 (50mm x 30mm)</h3>
          
          <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
            {printableData && (
              <LabelToPrint data={printableData} />
            )}
          </div>

          <div style={{ textAlign: 'right', marginTop: '24px' }}>
            <Button key="close" onClick={handleModalClose} style={{ marginRight: 8 }}>
              닫기
            </Button>
            <Button key="print" type="primary" onClick={handleSimplePrint}>
              라벨 인쇄
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default TestResult;
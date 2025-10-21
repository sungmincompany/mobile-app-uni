// Test_Result.js (예시: StockOutResult 구조 기반, worker → man_cd, quantity → amt)

import React, { useState, useEffect, useRef } from 'react'; // useRef 추가
import { Tabs, Form, Input, InputNumber, Button, DatePicker, message, Row, Col, Table, Modal, Select, Popover, Switch, Space } from 'antd'; // Switch, Space 추가
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { confirm } = Modal;
const { Option } = Select;

const TestResult = () => {
  // 1) Form, State 초기화
  const [form] = Form.useForm();

  // 제품 목록
  const [productList, setProductList] = useState([]);

  // 조회된 Test Result 목록
  const [testResults, setTestResults] = useState([]);

  // 날짜 검색용
  const [fromDt, setFromDt] = useState(dayjs().startOf('month'));
  const [toDt, setToDt] = useState(dayjs());

  // 등록/수정 구분
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('1');

  // 수량(amt) 상태
  const [amt, setAmt] = useState(1);

  // DB 스키마
  const v_db = '16_UR';   // 예시

  // --- 바코드 스캔 관련 상태 및 Ref 추가 ---
  const [barcodeScanOn, setBarcodeScanOn] = useState(true); // 바코드 스캔 ON/OFF 상태 (초기값 true)
  const barcodeInputRef = useRef(null); // 바코드 입력 필드 Ref
  const [idleCountdown, setIdleCountdown] = useState(10); // 카운트다운 상태 (10초로 변경)
  const idleTimerRef = useRef(null); // 유휴 시간 타이머 Ref
  const countdownTimerRef = useRef(null); // 카운트다운 표시용 타이머 Ref

  // --- '두번 터치로 드롭다운 열기'를 위한 상태 (제품 선택 필드 전용) ---
  const [isProductSelectReady, setIsProductSelectReady] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);


  // --- 유휴 상태 감지 및 자동 포커스 로직 ---
  useEffect(() => {
    // 타이머를 리셋하는 함수
    const resetIdleTimer = () => {
      // 기존 타이머 제거
      clearTimeout(idleTimerRef.current);
      clearInterval(countdownTimerRef.current);

      // 자동 포커스 기능이 꺼져있으면 여기서 중단
      if (!barcodeScanOn || activeTab !== '1') {
        return;
      }
      
      // 카운트다운 초기화 및 1초마다 감소
      setIdleCountdown(10); // 10초로 변경
      countdownTimerRef.current = setInterval(() => {
        setIdleCountdown(prev => Math.max(0, prev - 1));
      }, 1000);

      // 10초 후에 포커스 실행
      idleTimerRef.current = setTimeout(() => {
        if (barcodeInputRef.current && document.activeElement !== barcodeInputRef.current.input) {
          barcodeInputRef.current.focus();
        }
      }, 10000); // 10초로 변경
    };

    // 자동 포커스가 켜져있고, 등록 탭일 때만 이벤트 리스너 활성화
    if (barcodeScanOn && activeTab === '1') {
      // 이벤트 리스너 추가
      const events = ['mousedown', 'touchstart', 'keydown'];
      events.forEach(event => window.addEventListener(event, resetIdleTimer));

      // 타이머 최초 실행
      resetIdleTimer();

      // 클린업 함수: 컴포넌트 언마운트 또는 의존성 변경 시 실행
      return () => {
        events.forEach(event => window.removeEventListener(event, resetIdleTimer));
        clearTimeout(idleTimerRef.current);
        clearInterval(countdownTimerRef.current);
      };
    } else {
      // 자동 포커스가 꺼져있으면 모든 타이머 정리
      clearTimeout(idleTimerRef.current);
      clearInterval(countdownTimerRef.current);
    }
  }, [barcodeScanOn, activeTab]);


  // --- 바코드 스캔 처리 핸들러 (내용은 실제 로직에 맞게 구현 필요) ---
  const handleBarcodeScan = (e) => {
    const barcodeValue = e.target.value;
    if (barcodeValue) { // barcodeScanOn 조건 제거
      console.log('스캔된 바코드:', barcodeValue);
      // ===========================================
      // 여기에 바코드 값 처리 로직을 구현하세요.
      // 예시: 바코드 값을 파싱하여 Form 필드 자동 채우기
      // try {
      //   const { lot_no, jepum_cd } = parseBarcode(barcodeValue); // 바코드 파싱 함수 (별도 구현 필요)
      //   form.setFieldsValue({ lot_no, jepum_cd });
      //   message.success('바코드 정보가 적용되었습니다.');
      // } catch (error) {
      //   message.error('바코드 처리 중 오류가 발생했습니다.');
      //   console.error("바코드 처리 오류:", error);
      // }
      // ===========================================

      // 스캔 후 입력 필드 초기화 (선택 사항)
      form.setFieldsValue({ barcodeScan: '' }); // 입력 필드 비우기
    }
  };


  // 2) 제품 목록 불러오기
  useEffect(() => {
    fetch(`/api/select/jepum/jepum?v_db=${v_db}`)
      .then((res) => res.json())
      .then((data) => setProductList(data))
      .catch((err) => console.error('제품 목록 에러:', err));
  }, [v_db]);

  // 3) Test Result 조회
  const fetchTestResults = async (startDate, endDate) => {
    try {
      const fromParam = startDate ? startDate.format('YYYYMMDD') : '19990101';
      const toParam = endDate ? endDate.format('YYYYMMDD') : '20991231';

      const res = await fetch(
        `/api/select/etc/test-result?v_db=${v_db}&from_dt=${fromParam}&to_dt=${toParam}`
      );
      if (!res.ok) throw new Error('TEST 실적 조회 오류');
      const data = await res.json();

      data.forEach((item, idx) => {
        item.key = idx;
      });

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
      // work_dt "YYYY-MM-DD" → 서버에서 "YYYYMMDD" 변환 가능
      const work_dt = values.work_dt ? values.work_dt.format('YYYY-MM-DD') : null;

      // 공통 body
      const bodyPayload = {
        lot_no: values.lot_no,
        jepum_cd: values.jepum_cd,
        amt: values.amt,         // 수량
        man_cd: values.man_cd,   // 작업자(사번, 코드 등)
        bin_no: values.bin_no,   // bigo_1
        work_dt,
      };

      if (!editingRecord) {
        // 신규 등록
        const response = await fetch(
          `/api/insert/etc/test-result?v_db=${v_db}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload),
          }
        );
        const resData = await response.json();
        if (resData.error) {
          message.error(`등록 실패: ${resData.error}`);
        } else {
          message.success('등록 성공!');
          fetchTestResults(fromDt, toDt);
          form.resetFields();
          setAmt(1);
          setActiveTab('2');
        }
      } else {
        // 수정
        const response = await fetch(
          `/api/update/etc/test-result?v_db=${v_db}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload),
          }
        );
        const resData = await response.json();
        if (resData.error) {
          message.error(`수정 실패: ${resData.error}`);
        } else {
          message.success('수정 성공!');
          fetchTestResults(fromDt, toDt);
          form.resetFields();
          setEditingRecord(null);
          setAmt(1);
          setActiveTab('2');
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

  // 5) 수정/삭제
  const handleEdit = (record) => {
    setEditingRecord(record);
    setAmt(record.amt);

    let workDtObj = null;
    if (record.work_dt && record.work_dt.length === 8) {
      // 예: "20250315" → dayjs("2025-03-15", "YYYY-MM-DD")
      const year = record.work_dt.slice(0, 4);
      const month = record.work_dt.slice(4, 6);
      const day = record.work_dt.slice(6, 8);
      workDtObj = dayjs(`${year}-${month}-${day}`, 'YYYY-MM-DD');
    }

    form.setFieldsValue({
      lot_no: record.lot_no,
      jepum_cd: record.jepum_cd,
      amt: record.amt,
      man_cd: record.man_cd,    // 백엔드 조회 시 man_cd 로 내려오는 경우
      bin_no: record.bigo_1,    // BIN No
      work_dt: workDtObj,
    });
    setActiveTab('1');
  };

  const handleDelete = (record) => {
    confirm({
      title: '해당 실적을 삭제하시겠습니까?',
      okText: '예',
      cancelText: '아니오',
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

  // 6) 수량 + / - 버튼
  const handleIncrease = () => {
    setAmt((prev) => prev + 1);
    form.setFieldsValue({ amt: amt + 1 });
  };
  const handleDecrease = () => {
    if (amt > 1) {
      setAmt((prev) => prev - 1);
      form.setFieldsValue({ amt: amt - 1 });
    }
  };

  // 7) 테이블 컬럼
  const columns = [
    {
      title: '작업일자',
      dataIndex: 'work_dt',
      key: 'work_dt',
      align: 'center',
      width: 160,
      render: (text) => {
        // "20250301" → "2025-03-01" 표시
        if (!text || text.length !== 8) return text;
        return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
      },
    },
    {
      title: 'LOT No',
      dataIndex: 'lot_no',
      key: 'lot_no',
      align: 'center',
      width: 120,

    },
    {
      title: '제품',
      dataIndex: 'jepum_cd',
      key: 'jepum_cd',
      align: 'center',
      width: 140,
      render: (code) => {
        const prod = productList.find((p) => p.jepum_cd === code);
        return prod ? prod.jepum_nm : code;
      },
    },
    {
      title: '수량 및 작업자 Bin no',
      dataIndex: 'amt',
      key: 'amtManBigo',
      align: 'center',
      width: 140,
      render: (value, record) => {
        return (
          <>
            <div>{value}</div>
            <div>{record.man_cd}</div>
            <div>{record.bigo_1}</div>
          </>
        );
      },
    },
    {
      title: '작업',
      key: 'action',
      align: 'center',
      width: 80,
      render: (_, record) => {
        // Popover 안에 수정/삭제 버튼을 배치
        const popoverContent = (
          <div style={{ textAlign: 'center' }}>
            <Button type="link" onClick={() => handleEdit(record)}>
              수정
            </Button>
            <Button type="link" danger onClick={() => handleDelete(record)}>
              삭제
            </Button>
          </div>
        );

        return (
          <Popover
            content={popoverContent}
            trigger="click"
          // 필요하면 placement 등 다른 옵션을 추가
          >
            {/* (+) 버튼 (아이콘 사용해도 됨) */}
            <Button>+</Button>
          </Popover>
        );
      },
    },
  ];

  // 8) 화면 렌더링
  return (
    <div style={{ padding: 16 }}>
      <h2>TEST 공정 결과조회</h2>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 등록 탭 */}
        <TabPane tab="등록" key="1">
           {/* --- 바코드 스캔 영역 --- */}
           <Form.Item label="자동 포커스">
             <Row gutter={8} align="middle" wrap={false}>
               <Col flex="auto">
                 <Input
                   ref={barcodeInputRef}
                   placeholder="바코드를 스캔하세요"
                   name="barcodeScan"
                   onPressEnter={handleBarcodeScan}
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
           {/* --- 기존 Form 내용 --- */}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            initialValues={{ amt: 1 , work_dt: dayjs() }} // 초기 수량 및 날짜 값 설정
            style={{ maxWidth: 600 }}
          >
            {/* Form의 name과 Input의 name 이 중복되지 않도록 주의 */}
            <Form.Item name="barcodeScan" hidden><Input /></Form.Item>

            <Form.Item
              label="작업일자"
              name="work_dt"
              rules={[{ required: true, message: '작업일자를 선택하세요.' }]}
            >
              <DatePicker
                placeholder="작업일자"
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
            </Form.Item>

            <Form.Item
              label="LOT No"
              name="lot_no"
              rules={[{ required: true, message: 'LOT No를 입력하세요.' }]}
            >
              <Input 
                name="lot_no"
                placeholder="LOT No" 
              />
            </Form.Item>

            <Form.Item
              label="제품"
              name="jepum_cd"
              rules={[{ required: true, message: '제품을 선택하세요.' }]}
            >
              <Select
                showSearch
                placeholder="제품 검색"
                optionFilterProp="children"
                // --- 드롭다운 제어 로직 추가 ---
                open={isProductDropdownOpen}
                onFocus={() => {
                  if (!isProductSelectReady) {
                    setIsProductSelectReady(true);
                  } else {
                    setIsProductDropdownOpen(true);
                  }
                }}
                onSearch={(value) => {
                  if (value && !isProductDropdownOpen) {
                    setIsProductDropdownOpen(true);
                  }
                }}
                onBlur={() => {
                  setIsProductDropdownOpen(false);
                  setIsProductSelectReady(false);
                }}
                onSelect={() => {
                  setIsProductDropdownOpen(false);
                  setIsProductSelectReady(false);
                }}
                // ---------------------------------
                filterOption={(input, option) => {
                  const label = (option?.children ?? '').toString().toLowerCase();
                  return label.includes(input.toLowerCase());
                }}
              >
                {productList.map((p) => (
                  <Option key={p.jepum_cd} value={p.jepum_cd}>
                    {p.jepum_nm} ({p.jepum_cd})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="수량"
              name="amt"
              rules={[{ required: true, message: '수량을 입력하세요.' }]}
            >
              <Row gutter={8}>
                <Col flex="auto">
                  <InputNumber
                    name="amt"
                    min={1}
                    value={amt} // 상태 값 바인딩
                    onChange={(value) => { // 상태 업데이트 핸들러
                      const val = value || 1; // null이나 0일 경우 1로 처리
                      setAmt(val);
                      form.setFieldsValue({ amt: val }); // Form 필드 값도 업데이트
                    }}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col>
                  <Button onClick={handleIncrease}>+</Button>
                  <Button onClick={handleDecrease} style={{ marginLeft: 4 }}>
                    -
                  </Button>
                </Col>
              </Row>
            </Form.Item>

            <Form.Item
              label="BIN No"
              name="bin_no"
              rules={[{ required: true, message: 'BIN No를 입력하세요.' }]}
            >
              <Input 
                name="bin_no"
                placeholder="BIN No" 
              />
            </Form.Item>

            <Form.Item
              label="작업자"
              name="man_cd"
              rules={[{ required: true, message: '작업자코드를 입력하세요.' }]}
            >
              <Input 
                name="man_cd"
                placeholder="작업자명" 
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
                {editingRecord ? '수정하기' : '등록하기'}
              </Button>
              <Button onClick={() => {
                 form.resetFields(); // 모든 필드 초기화
                 setEditingRecord(null); // 수정 상태 초기화 추가
                 setAmt(1); // 수량 초기화 추가
                 form.setFieldsValue({ work_dt: dayjs() }); // 작업일자 오늘로 재설정
                 // 초기화 시 바코드 입력 필드로 포커스 (ON 상태일 때)
                 if (barcodeScanOn && barcodeInputRef.current) {
                   barcodeInputRef.current.focus();
                 }
               }}>초기화</Button>
            </Form.Item>
          </Form>
        </TabPane>

        {/* 조회 탭 */}
        <TabPane tab="조회" key="2">
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <Row style={{ flexFlow: 'row nowrap' }} gutter={8}>
              <Col span={9}>
                <DatePicker
                  value={fromDt}
                  format="YYYY-MM-DD"
                  onChange={(date) => setFromDt(date)}
                />
              </Col>
              <span style={{ margin: '5px 2px' }}>~</span>
              <Col span={9}>
                <DatePicker
                  value={toDt}
                  format="YYYY-MM-DD"
                  onChange={(date) => setToDt(date)}
                />
              </Col>
                <Col span={8}>
                  <Button type="primary" onClick={() => fetchTestResults(fromDt, toDt)}>
                   조회
                  </Button>
                </Col>
            </Row>

          </div>
          <Table columns={columns} dataSource={testResults} pagination={{ pageSize: 10 }} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TestResult;


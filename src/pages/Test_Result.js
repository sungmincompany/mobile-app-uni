import React, { useState, useEffect, useRef } from 'react';
// AutoComplete를 import에 유지합니다.
import { Tabs, Form, Input, InputNumber, Button, DatePicker, message, Row, Col, Table, Modal, Select, Popover, Switch, Space, AutoComplete } from 'antd';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { confirm } = Modal;
const { Option } = Select;

const TestResult = () => {
  // 1) Form, State 초기화
  const [form] = Form.useForm();

  // 제품 목록
  const [productList, setProductList] = useState([]);

  // 📌 [추가] 작업자 목록
  const [workerList, setWorkerList] = useState([]);

  // 조회된 Test Result 목록
  const [testResults, setTestResults] = useState([]);

  // 날짜 검색용
  const [fromDt, setFromDt] = useState(dayjs().startOf('month'));
  const [toDt, setToDt] = useState(dayjs());

  // 등록/수정 구분
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('1');

  // DB 스키마
  const v_db = '16_UR';   // 예시

  // --- 📌 [추가 1] 가상 키보드 ON/OFF 상태 (기본값 false: OFF) ---
  const [isVirtualKeyboardOn, setIsVirtualKeyboardOn] = useState(false);

  // --- 바코드 스캔 관련 상태 및 Ref 추가 ---
  const [barcodeScanOn, setBarcodeScanOn] = useState(true); // 바코드 스캔 ON/OFF 상태 (초기값 true)
  const barcodeInputRef = useRef(null); // 바코드 입력 필드 Ref
  const [idleCountdown, setIdleCountdown] = useState(10); // 카운트다운 상태 (10초로 변경)
  const idleTimerRef = useRef(null); // 유휴 시간 타이머 Ref
  const countdownTimerRef = useRef(null); // 카운트다운 표시용 타이머 Ref

  // --- [수정 1] 바코드 Input 값을 제어하기 위한 state ---
  const [barcodeInputValue, setBarcodeInputValue] = useState('');

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


  // --- [수정 2] 바코드 스캔 처리 핸들러 (API 우선 호출 방식) ---
  const handleBarcodeScan = async (e) => { 
    const barcodeValue = barcodeInputValue.trim();

    if (barcodeValue) {
      console.log('스캔된 바코드:', barcodeValue);

      const regexPlus = /^(.*?)\+(.*?)\((.*?)\+(.*?)\)$/;
      const regexSingle = /^(.*)\((lot_no2|dev_no|bin_no)\)$/;

      const matchPlus = barcodeValue.match(regexPlus);
      const matchSingle = barcodeValue.match(regexSingle);

      const fieldNames = {
        lot_no2: '상위 LOT No',
        dev_no: '장비번호',
        bin_no: 'BIN No',
      };

      // --- 📌 [수정] 1. "Plus" 형식 확인
      if (matchPlus) {
        let value1 = matchPlus[1]; // 예: "4"
        let value2 = matchPlus[2]; // 예: "31"
        const field1 = matchPlus[3]; // 예: "dev_no"
        const field2 = matchPlus[4]; // 예: "bin_no"

        const fieldName1 = fieldNames[field1] || field1;
        const fieldName2 = fieldNames[field2] || field2;

        // 📌 [수정] lot_no2가 포함된 경우, API를 먼저 호출하여 값을 확정
        if (field1 === 'lot_no2') {
          // fetch 함수가 제품/lot_no2 메시지 처리
          value1 = await fetchProductInfoByLotNo2(value1); // 📌 value1 덮어쓰기
          message.success(`${fieldName2} '${value2}' (으)로 설정되었습니다.`);
        } else if (field2 === 'lot_no2') {
          // fetch 함수가 제품/lot_no2 메시지 처리
          value2 = await fetchProductInfoByLotNo2(value2); // 📌 value2 덮어쓰기
          message.success(`${fieldName1} '${value1}' (으)로 설정되었습니다.`);
        } else {
          // lot_no2가 없는 경우
          message.success(
             `${fieldName1} '${value1}', ${fieldName2} '${value2}' (으)로 설정되었습니다.`
           );
        }
        
        // 📌 확정된 값으로 폼 *한 번에* 설정
        form.setFieldsValue({
          [field1]: value1,
          [field2]: value2,
        });

      }
      // --- 📌 [수정] 2. "Single" 형식 확인
      else if (matchSingle) {
        const valueToSet = matchSingle[1]; 
        const fieldToSet = matchSingle[2];
        const fieldName = fieldNames[fieldToSet]; 

        if (fieldToSet === 'lot_no2') {
          // 📌 [수정] API를 먼저 호출하여 최종 값을 받음
          const finalValue = await fetchProductInfoByLotNo2(valueToSet);
          // 📌 API가 반환한 최종 값으로 폼 설정
          form.setFieldsValue({ [fieldToSet]: finalValue }); 
          // 📌 메시지는 fetchProductInfoByLotNo2 함수 내부에서 처리됨
          
        } else {
          // 📌 lot_no2가 아닌 dev_no, bin_no의 경우
          form.setFieldsValue({ [fieldToSet]: valueToSet });
          message.success(
            `${fieldName}가 '${valueToSet}' (으)로 설정되었습니다.`
          );
        }
      }
      // --- 📌 [수정] 3. 일치하는 패턴이 없는 경우
      else {
        // 📌 [수정] 기본 lot_no2로 설정하기 전, API 먼저 호출
        const finalValue = await fetchProductInfoByLotNo2(barcodeValue);
        
        // 📌 API가 반환한 최종 값으로 폼 설정
        form.setFieldsValue({ lot_no2: finalValue });
        // 📌 메시지는 fetchProductInfoByLotNo2 함수 내부에서 처리됨
      }

      // --- 공통 로직 (바코드 입력창 비우기 및 포커스) ---
      setBarcodeInputValue('');
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }
  };

  // --- 📌 [수정] 상위 LOT No로 제품 정보 조회, bigo39/40 조합 값을 반환하는 함수 ---
  const fetchProductInfoByLotNo2 = async (lotNo2Value) => {
    // lotNo2Value: 바코드에서 스캔된 원래 값
    if (!lotNo2Value) return lotNo2Value; // 📌 스캔된 값 그대로 반환

    console.log(`상위 LOT(${lotNo2Value})로 제품 정보 조회를 시작합니다.`);

    try {
      const res = await fetch(
        `/api/select/etc/lot_no_inform?v_db=${v_db}&lot_no2=${lotNo2Value}`
      );

      if (!res.ok) {
        throw new Error(`서버 응답 오류: ${res.status}`);
      }

      const data = await res.json();

      if (data && data.length > 0) {
        const product = data[0]; // { jepum_cd, jepum_nm, bigo39, bigo40 }

        // 1. 제품 코드 설정 (이 로직은 유지)
        if (product.jepum_cd) {
          form.setFieldsValue({ jepum_cd: product.jepum_cd });
          message.success(
            `제품 '${product.jepum_nm || product.jepum_cd}'이(가) 자동 설정되었습니다.`
          );
        } else {
          message.warning(
            `상위 LOT(${lotNo2Value})에 해당하는 제품 코드가 없습니다.`
          );
        }

        // 2. 📌 [요청 사항] bigo39, bigo40 값을 조합하여 *반환*
        //    (두 값이 모두 존재하는지 확인)
        if (product.bigo39 && product.bigo40) {
          const combinedLotNo2 = `${product.bigo39}-${product.bigo40}`;

          // 📌 사용자에게 어떤 값으로 설정되는지 알려줌
          message.info(
            `상위 LOT No가 '${combinedLotNo2}'(으)로 자동 설정되었습니다.`
          );

          // 📌 조합된 값을 반환
          return combinedLotNo2;
        }

        // --- bigo 조합이 없는 경우 ---
        message.success(
          `상위 LOT No가 '${lotNo2Value}' (으)로 설정되었습니다.`
        );
        return lotNo2Value; // 📌 원래 스캔 값 반환

      } else {
        message.warning(
          `상위 LOT(${lotNo2Value})에 해당하는 제품 정보가 없습니다.`
        );
        return lotNo2Value; // 📌 정보가 없어도 원래 스캔 값 반환
      }
    } catch (err) {
      console.error('fetchProductInfoByLotNo2 에러:', err);
      message.error('제품 정보 조회 중 오류가 발생했습니다.');
      return lotNo2Value; // 📌 에러 시에도 원래 스캔 값 반환
    }
  };


  // 2) 제품 목록 불러오기
  useEffect(() => {
    fetch(`/api/select/jepum/jepum?v_db=${v_db}`)
      .then((res) => res.json())
      .then((data) => setProductList(data))
      .catch((err) => console.error('제품 목록 에러:', err));
  }, [v_db]);

  // 📌 [추가] 작업자 목록 불러오기 (dept_cd = 'P0503' 고정)
  useEffect(() => {
    const fetchWorkerList = async () => {
      try {
        // dept_cd='P0503' 하드코딩
        const res = await fetch(`/api/select/etc/test_man_cd?v_db=${v_db}&dept_cd=P0503`);
        if (!res.ok) throw new Error('작업자 목록 조회 오류');
        const data = await res.json();

        // data 형식: [{emp_nmk: "홍길동"}, {emp_nmk: "이순신"}]
        // Select의 options prop 형식: [{value: "홍길동", label: "홍길동"}]
        const formattedList = data.map(worker => ({
          value: worker.emp_nmk, // 폼에서 man_cd로 전송될 값
          label: worker.emp_nmk, // 사용자에게 보여질 이름
        }));
        setWorkerList(formattedList);

      } catch (err) {
        console.error('fetchWorkerList 에러:', err);
        message.error('작업자 목록을 불러오는 데 실패했습니다.');
      }
    };

    fetchWorkerList();
  }, [v_db]); // v_db가 변경될 때 (거의 없음) 다시 호출


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
        lot_no2: values.lot_no2, // 상위 LOT No 추가
        dev_no: values.dev_no,   // 장비번호 추가
        jepum_cd: values.jepum_cd,
        // 📌 [수정] AutoComplete로 받은 값(문자열일 수 있음)을 숫자로 변환
        amt: Number(values.amt) || 0,
        man_cd: values.man_cd,   // 📌 작업자 이름(emp_nmk)이 전송됨
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
          // [제거됨] setAmt(1); 
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
          // [제거됨] setAmt(1); 
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
    // [제거됨] setAmt(record.amt);

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
      lot_no2: record.lot_no2, // 상위 LOT No 추가
      dev_no: record.dev_no,   // 장비번호 추가
      jepum_cd: record.jepum_cd,
      amt: record.amt,
      man_cd: record.man_cd,   // 백엔드 조회 시 man_cd 로 내려오는 경우
      bin_no: record.bigo_1,   // BIN No
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

  // [제거됨] 수량 + / - 버튼 핸들러 
  // const handleIncrease = () => { ... };
  // const handleDecrease = () => { ... };

  // 7) 테이블 컬럼
  const columns = [
    {
      title: '작업일자',
      dataIndex: 'work_dt',
      key: 'work_dt',
      align: 'center',
      width: 100,
      render: (text) => {
        if (!text || text.length !== 8) return text;
        return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
      },
    },
    {
      title: 'LOT 정보',
      dataIndex: 'lot_no',
      key: 'lot_info',
      align: 'center',
      width: 120,
      render: (value, record) => (
        <>
          <div>{value}</div>
          <div style={{ color: 'gray' }}>{record.lot_no2}</div>
        </>
      ),
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
      title: '작업정보',
      dataIndex: 'amt',
      key: 'work_info',
      align: 'center',
      width: 140,
      render: (value, record) => {
        return (
          <>
            <div>수량: {value}</div>
            <div>장비: {record.dev_no}</div>
            <div>작업자: {record.man_cd}</div>
            <div>BIN: {record.bigo_1}</div>
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
          >
            <Button>+</Button>
          </Popover>
        );
      },
    },
  ];

  // 8) 화면 렌더링
  return (
    <div style={{ padding: 16 }}>
      {/* --- 📌 [수정 1] 제목과 가상키보드 토글 영역 --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
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
      {/* --- [수정 1] 끝 --- */}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 등록 탭 */}
        <TabPane tab="등록" key="1">
          {/* --- 바코드 스캔 영역 --- */}
          <Form.Item label="바코드 스캔">
            <Row gutter={8} align="middle" wrap={false}>
              <Col flex="auto">
                <Input
                  ref={barcodeInputRef}
                  placeholder="바코드를 스캔하세요"
                  onPressEnter={handleBarcodeScan}
                  // --- [수정 3] Input을 state와 연결 ---
                  value={barcodeInputValue}
                  onChange={(e) => setBarcodeInputValue(e.target.value)}
                  // --- 📌 [추가 2] 가상키보드 제어 ---
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
          {/* --- 기존 Form 내용 --- */}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            initialValues={{ amt: 20500, work_dt: dayjs() }} // 📌[확인] 초기 수량 20500 설정
            style={{ maxWidth: 600 }}
          >
            {/* 바코드 스캔 Input이 Form의 상태와 분리되었으므로
              숨겨진 Form.Item은 필요 없습니다.
            */}

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
                // --- 📌 [추가 3] 가상키보드 제어 ---
                inputMode={isVirtualKeyboardOn ? 'text' : 'none'}
              />
            </Form.Item>

            <Form.Item
              label="상위 LOT No"
              name="lot_no2"
            >
              <Input
                name="lot_no2"
                placeholder="상위 LOT No"
                // --- 📌 [추가 4] 가상키보드 제어 ---
                inputMode={isVirtualKeyboardOn ? 'text' : 'none'}
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
                // --- 드롭다운 제어 로직 ---
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
              label="장비번호"
              name="dev_no"
            >
              <Input
                name="dev_no"
                placeholder="장비번호"
                // --- 📌 [추가 5] 가상키보드 제어 ---
                inputMode={isVirtualKeyboardOn ? 'text' : 'none'}
              />
            </Form.Item>

            {/* --- 📌 [수정] 수량 필드 (AutoComplete) --- */}
            <Form.Item
              label="수량"
              name="amt"
              rules={[
                { required: true, message: '수량을 입력하거나 선택하세요.' },
                { // 📌[추가] 입력된 값이 1 이상의 숫자인지 검증
                  validator: (_, value) => {
                    const num = Number(value);
                    if (!value) { // 값이 비어있으면 required 룰이 처리
                      return Promise.resolve();
                    }
                    if (isNaN(num)) {
                      return Promise.reject(new Error('수량은 숫자여야 합니다.'));
                    }
                    if (num < 1) {
                      return Promise.reject(new Error('수량은 1 이상이어야 합니다.'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <AutoComplete
                options={[
                  // AutoComplete 옵션은 value를 문자열로 주는 것이 좋습니다.
                  { value: '3050' },
                  { value: '20500' },
                ]}
                filterOption={(inputValue, option) =>
                  option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                }
              >
                {/* AutoComplete의 자식으로 Input을 넣어 inputMode를 제어합니다. */}
                <Input
                  placeholder="수량을 입력하거나 선택하세요"
                  // 1. 요청사항: 가상키보드 상태와 관계없이 항상 숫자 키패드 사용
                  inputMode="numeric"
                  // 2. 요청사항: 포커스 시 필드 내용 클리어
                  onFocus={() => form.setFieldsValue({ amt: '' })}
                />
              </AutoComplete>
            </Form.Item>
            {/* --- 📌 [수정] 끝 --- */}


            <Form.Item
              label="BIN No"
              name="bin_no"
              rules={[{ required: true, message: 'BIN No를 입력하세요.' }]}
            >
              <Input
                name="bin_no"
                placeholder="BIN No"
                // --- 📌 [추가 7] 가상키보드 제어 ---
                inputMode={isVirtualKeyboardOn ? 'text' : 'none'}
              />
            </Form.Item>

            {/* --- 📌 [수정] 작업자 필드를 Select로 변경 --- */}
            <Form.Item
              label="작업자"
              name="man_cd"
              rules={[{ required: true, message: '작업자를 선택하세요.' }]}
            >
              <Select
                // 📌 [수정] showSearch 속성 및 관련 prop (filterOption, onSearch 등) 제거
                placeholder="작업자 선택"
                options={workerList} // 📌 state에서 옵션 바인딩
              />
            </Form.Item>
            {/* --- 📌 [수정] 끝 --- */}


            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
                {editingRecord ? '수정하기' : '등록하기'}
              </Button>
              <Button onClick={() => {
                form.resetFields(); // 모든 필드 초기화
                setEditingRecord(null); // 수정 상태 초기화 추가
                // [제거됨] setAmt(1); 
                form.setFieldsValue({ work_dt: dayjs() }); // 작업일자 오늘로 재설정

                // --- [수정 4] 초기화 시 바코드 state도 비우기 ---
                setBarcodeInputValue('');

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
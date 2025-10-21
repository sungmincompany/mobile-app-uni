// Test_Result.js (예시: StockOutResult 구조 기반, worker → man_cd, quantity → amt)

import React, { useState, useEffect } from 'react';
import { Tabs, Form, Input, InputNumber, Button, DatePicker, message, Row, Col, Table, Modal, Select, Popover } from 'antd';
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
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            initialValues={{ amt: 1, work_dt: dayjs() }}
            style={{ maxWidth: 600 }}
          >
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
              <Input placeholder="LOT No" />
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
                    min={1}
                    value={amt}
                    onChange={(value) => setAmt(value)}
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
              <Input placeholder="BIN No" />
            </Form.Item>

            <Form.Item
              label="작업자"
              name="man_cd"
              rules={[{ required: true, message: '작업자코드를 입력하세요.' }]}
            >
              <Input placeholder="작업자명" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
                {editingRecord ? '수정하기' : '등록하기'}
              </Button>
              <Button onClick={() => form.resetFields()}>초기화</Button>
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

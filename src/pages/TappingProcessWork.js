import React, { useState, useEffect, useRef } from "react";
import {
  Tabs,
  Form,
  Input,
  InputNumber,
  Button,
  DatePicker,
  message,
  Row,
  Col,
  Table,
  Modal,
  Select,
  Popover,
  Switch,
  Space,
} from "antd";
import dayjs from "dayjs";

const { TabPane } = Tabs;
const { confirm } = Modal;
const { Option } = Select;

const TappingProcessWork = () => {
  const [form] = Form.useForm();
  const [tapings, setTapings] = useState([]);
  const [activeTab, setActiveTab] = useState("1");
  const [editingRecord, setEditingRecord] = useState(null);
  const [fromDt, setFromDt] = useState(dayjs().startOf("month"));
  const [toDt, setToDt] = useState(dayjs());
  const [productList, setProductList] = useState([]);

  // --- 바코드 및 포커스 관리를 위한 State & Ref ---
  const [isVirtualKeyboardOn, setIsVirtualKeyboardOn] = useState(false);
  const [barcodeScanOn, setBarcodeScanOn] = useState(true);
  const [barcodeInputValue, setBarcodeInputValue] = useState("");
  const [idleCountdown, setIdleCountdown] = useState(10);
  const barcodeInputRef = useRef(null);
  const idleTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const v_db = "16_UR";

  // 1) 제품목록 불러오기
  useEffect(() => {
    fetch(`/api/select/jepum/jepum?v_db=${v_db}`)
      .then((res) => res.json())
      .then((data) => setProductList(data))
      .catch((err) => console.error("제품목록 에러:", err));
  }, [v_db]);

  // --- 유휴 상태 감지 및 바코드 입력창 자동 포커스 ---
  useEffect(() => {
    const resetIdleTimer = () => {
      clearTimeout(idleTimerRef.current);
      clearInterval(countdownTimerRef.current);
      if (!barcodeScanOn || activeTab !== "1") return;
      setIdleCountdown(10);
      countdownTimerRef.current = setInterval(() => {
        setIdleCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
      idleTimerRef.current = setTimeout(() => {
        if (
          barcodeInputRef.current &&
          document.activeElement !== barcodeInputRef.current.input
        ) {
          barcodeInputRef.current.focus();
        }
      }, 10000);
    };

    if (barcodeScanOn && activeTab === "1") {
      const events = ["mousedown", "touchstart", "keydown"];
      events.forEach((event) => window.addEventListener(event, resetIdleTimer));
      resetIdleTimer();
      return () => {
        events.forEach((event) =>
          window.removeEventListener(event, resetIdleTimer),
        );
        clearTimeout(idleTimerRef.current);
        clearInterval(countdownTimerRef.current);
      };
    } else {
      clearTimeout(idleTimerRef.current);
      clearInterval(countdownTimerRef.current);
    }
  }, [barcodeScanOn, activeTab]);

  // --- 2) 바코드 스캔 처리 (TEST 라벨 스캔 시 자동 연동) ---
  const handleBarcodeScan = async (e) => {
    const barcodeValue = barcodeInputValue.trim();
    if (barcodeValue) {
      // 스캔된 값을 LOT NO에 세팅
      form.setFieldsValue({ lot_no: barcodeValue });
      setBarcodeInputValue(""); // 입력창 초기화

      // 정보 조회 API 호출
      await fetchLotInfo(barcodeValue);

      // 다시 바코드 창으로 포커스
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
    }
  };

  // LOT NO 수동 입력 후 포커스 아웃 시에도 연동되도록 지원
  const handleLotNoBlur = async (e) => {
    const lotNoValue = e.target.value.trim();
    if (lotNoValue) {
      await fetchLotInfo(lotNoValue);
    }
  };

  // TEST 공정 정보 가져와서 폼에 자동 세팅
  const fetchLotInfo = async (lotNoValue) => {
    try {
      const url = `/api/select/etc/tapping-check-lot?v_db=${v_db}&lot_no=${lotNoValue}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        if (data.error) message.warning(data.error);
        else message.warning("LOT 체크 실패");
      } else {
        let updateData = {};
        if (data.jepum_cd) updateData.jepum_cd = data.jepum_cd;
        if (data.bin_no) updateData.bin_no = data.bin_no;

        // 정보 세팅
        form.setFieldsValue(updateData);
        message.success("TEST 라벨 정보가 세팅되었습니다.");
      }
    } catch (err) {
      console.error(err);
      message.error("LOT 체크 중 오류가 발생했습니다.");
    }
  };

  // 3) 조회
  const fetchTapingResults = async (startDate, endDate) => {
    try {
      const fromParam = startDate ? startDate.format("YYYYMMDD") : "19990101";
      const toParam = endDate ? endDate.format("YYYYMMDD") : "20991231";
      const url = `/api/select/etc/tapping-result?v_db=${v_db}&from_dt=${fromParam}&to_dt=${toParam}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("조회오류");
      const data = await res.json();
      data.forEach((item, idx) => {
        item.key = idx;
      });
      setTapings(data);
    } catch (err) {
      console.error(err);
      message.error("조회 중 오류발생");
    }
  };

  useEffect(() => {
    fetchTapingResults(fromDt, toDt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDt, toDt]);

  // 4) 등록/수정
  const onFinish = async (values) => {
    try {
      const payload = {
        lot_no: values.lot_no,
        amt: values.amt,
        reel_count: values.reel_count,
        reel_min_amt: values.reel_min_amt,
        man_cd: values.man_cd,
        bin_no: values.bin_no,
        jepum_cd: values.jepum_cd || "",
      };

      if (!editingRecord) {
        // 신규 등록
        const res = await fetch(`/api/insert/etc/tapping-result?v_db=${v_db}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.error) {
          message.error(`등록실패: ${data.error}`);
        } else {
          message.success("등록성공");
          fetchTapingResults(fromDt, toDt);
          form.resetFields();
          setActiveTab("2");
        }
      } else {
        // 수정
        const res = await fetch(`/api/update/etc/tapping-result?v_db=${v_db}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.error) {
          message.error(`수정실패: ${data.error}`);
        } else {
          message.success("수정성공");
          fetchTapingResults(fromDt, toDt);
          form.resetFields();
          setEditingRecord(null);
          setActiveTab("2");
        }
      }
    } catch (err) {
      console.error(err);
      message.error("등록/수정 중 오류");
    }
  };

  const onFinishFailed = () => {
    message.error("필수항목을 확인해주세요");
  };

  // 5) 수정 및 삭제 핸들러
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      lot_no: record.lot_no,
      reel_count: 1,
      man_cd: record.man_cd,
      bin_no: record.bigo_1,
      jepum_cd: record.jepum_cd,
    });
    setActiveTab("1");
  };

  const handleDelete = (record) => {
    confirm({
      title: "삭제하시겠습니까?",
      onOk: async () => {
        try {
          const url = `/api/delete/etc/tapping-result?v_db=${v_db}&lot_no=${record.lot_no}`;
          const res = await fetch(url, { method: "DELETE" });
          const data = await res.json();
          if (data.error) {
            message.error(`삭제실패: ${data.error}`);
          } else {
            message.success("삭제성공");
            fetchTapingResults(fromDt, toDt);
          }
        } catch (err) {
          console.error(err);
          message.error("삭제오류");
        }
      },
    });
  };

  // 6) 테이블 컬럼
  const columns = [
    {
      title: "작업일자",
      dataIndex: "work_dt",
      key: "work_dt",
      align: "center",
      render: (text) => {
        if (text && text.length === 8) {
          return (
            text.slice(0, 4) + "-" + text.slice(4, 6) + "-" + text.slice(6, 8)
          );
        }
        return text;
      },
    },
    { title: "LOT NO", dataIndex: "lot_no", key: "lot_no", align: "center" },
    {
      title: "제품명",
      dataIndex: "jepum_nm",
      key: "jepum_nm",
      align: "center",
    },
    {
      title: "Reel당 수량 및 Reel 개수 및 작업자",
      dataIndex: "amt",
      key: "amtMan",
      align: "center",
      width: 120,
      render: (value, record) => {
        return (
          <>
            <div>{value}</div>
            <div>{record.lot_seq}</div>
            <div>{record.man_cd}</div>
          </>
        );
      },
    },
    {
      title: "작업",
      key: "action",
      align: "center",
      width: 80,
      render: (_, record) => {
        const popoverContent = (
          <div style={{ textAlign: "center" }}>
            <Button type="link" onClick={() => handleEdit(record)}>
              수정
            </Button>
            <Button type="link" danger onClick={() => handleDelete(record)}>
              삭제
            </Button>
          </div>
        );
        return (
          <Popover content={popoverContent} trigger="click">
            <Button>+</Button>
          </Popover>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2>Tapping 공정 작업실적 등록</h2>
        {/* --- TEST 공정과 동일한 가상 키보드 스위치 추가 --- */}
        <Space>
          <span style={{ fontSize: "0.9em", color: "#555" }}>가상키보드</span>
          <Switch
            checkedChildren="ON"
            unCheckedChildren="OFF"
            checked={isVirtualKeyboardOn}
            onChange={setIsVirtualKeyboardOn}
          />
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="등록" key="1">
          {/* --- 스캐너 전용 입력란 추가 --- */}
          <Form.Item label="바코드 스캔 (TEST 라벨)">
            <Row gutter={8} align="middle" wrap={false}>
              <Col flex="auto">
                <Input
                  ref={barcodeInputRef}
                  placeholder="TEST 공정에서 발행된 라벨 바코드를 스캔하세요"
                  onPressEnter={handleBarcodeScan}
                  value={barcodeInputValue}
                  onChange={(e) => setBarcodeInputValue(e.target.value)}
                  inputMode={isVirtualKeyboardOn ? "text" : "none"}
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
                  {barcodeScanOn && (
                    <span
                      style={{
                        color: "#1677ff",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ({idleCountdown}초)
                    </span>
                  )}
                </Space>
              </Col>
            </Row>
          </Form.Item>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            initialValues={{
              amt: 0,
              reel_count: 1,
              reel_min_amt: 0,
            }}
            style={{ maxWidth: 600 }}
          >
            <Form.Item
              label="LOT NO"
              name="lot_no"
              rules={[{ required: true, message: "LOT NO" }]}
            >
              <Input
                onBlur={handleLotNoBlur}
                placeholder="LOT NO (스캔 시 자동입력)"
                inputMode={isVirtualKeyboardOn ? "text" : "none"}
              />
            </Form.Item>

            <Form.Item
              label="제품"
              name="jepum_cd"
              rules={[{ required: true, message: "제품을 선택하세요!" }]}
            >
              <Select
                showSearch
                placeholder="제품 선택 (스캔 시 자동입력)"
                optionFilterProp="children"
                filterOption={(input, option) => {
                  const label = (option?.children ?? "")
                    .toString()
                    .toLowerCase();
                  return label.includes(input.toLowerCase());
                }}
              >
                {productList.map((item) => (
                  <Option key={item.jepum_cd} value={item.jepum_cd}>
                    {item.jepum_nm} ({item.jepum_cd})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="BIN NO"
              name="bin_no"
              rules={[{ required: true, message: "BIN NO" }]}
            >
              <Input
                placeholder="BIN NO (스캔 시 자동입력)"
                inputMode={isVirtualKeyboardOn ? "text" : "none"}
              />
            </Form.Item>

            <Form.Item
              label="총수량"
              name="amt"
              rules={[{ required: true, message: "총수량" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Reel 개수"
              name="reel_count"
              rules={[{ required: true, message: "Reel 수" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Reel당 수량"
              name="reel_min_amt"
              rules={[{ required: true, message: "Reel당 수량" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="작업자"
              name="man_cd"
              rules={[{ required: true, message: "작업자" }]}
            >
              <Input inputMode={isVirtualKeyboardOn ? "text" : "none"} />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{ marginRight: 8 }}
              >
                {editingRecord ? "수정하기" : "등록하기"}
              </Button>
              <Button onClick={() => form.resetFields()}>초기화</Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="조회" key="2">
          <div
            style={{ marginBottom: 16, display: "flex", alignItems: "center" }}
          >
            <Row style={{ flexFlow: "row nowrap" }} gutter={8}>
              <Col span={9}>
                <DatePicker
                  value={fromDt}
                  format="YYYY-MM-DD"
                  onChange={(d) => setFromDt(d)}
                />
              </Col>
              <span style={{ margin: "5px 2px" }}>~</span>
              <Col span={9}>
                <DatePicker
                  value={toDt}
                  format="YYYY-MM-DD"
                  onChange={(d) => setToDt(d)}
                />
              </Col>
              <Col span={8}>
                <Button
                  type="primary"
                  onClick={() => fetchTapingResults(fromDt, toDt)}
                >
                  조회
                </Button>
              </Col>
            </Row>
          </div>
          <Table
            columns={columns}
            dataSource={tapings}
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TappingProcessWork;

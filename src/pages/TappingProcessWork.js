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
  Radio,
} from "antd";
import dayjs from "dayjs";
import { QRCodeSVG } from "qrcode.react";

const { TabPane } = Tabs;
const { confirm } = Modal;
const { Option } = Select;

// ------------------------------------------------------------------
// 📌 TAPPING 전용 LabelToPrint 컴포넌트 (50x30 라벨 규격 적용)
// ------------------------------------------------------------------
const LabelToPrint = ({ data }) => {
  if (!data) return null;

  const labelStyle = {
    width: "50mm",
    height: "30mm",
    padding: "0.5mm 0.3mm",
    boxSizing: "border-box",
    fontFamily: "Malgun Gothic, Arial, sans-serif",
    fontSize: "7pt",
    fontWeight: "bold",
    lineHeight: 1.1,
    position: "relative",
    border: "1px dashed #999",
    backgroundColor: "white",
    color: "black",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  };

  const thStyle = {
    border: "1px solid #333",
    padding: "0.4mm 0.5mm",
    fontSize: "7pt",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    textAlign: "left",
    width: "25%",
    backgroundColor: "#eee",
  };
  const tdWideStyle = {
    border: "1px solid #333",
    padding: "0.4mm 0.5mm",
    fontSize: "7pt",
    fontWeight: "bold",
    verticalAlign: "middle",
    width: "85%",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const bottomContainerStyle = {
    display: "flex",
    width: "100%",
    border: "1px solid #333",
    borderTop: "none",
  };
  const leftInfoStyle = { width: "60%", height: "100%" };
  const nestedTableStyle = { ...tableStyle, height: "100%" };

  const nestedThStyle = {
    ...thStyle,
    padding: "0.4mm 0.5mm",
    width: "45%",
    borderTop: "none",
    borderLeft: "none",
  };
  const nestedTdStyle = {
    ...tdWideStyle,
    padding: "0.4mm 0.5mm",
    width: "75%",
    borderTop: "none",
    borderRight: "none",
  };

  const rightQrStyle = {
    width: "40%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "0.5mm",
    boxSizing: "border-box",
    borderLeft: "1px solid #333",
  };

  const qrSize = 10; // 10mm
  const formattedReelAmt = data.reel_min_amt
    ? Number(data.reel_min_amt).toLocaleString("en-US")
    : "0";
  const formattedTotalAmt = data.amt
    ? Number(data.amt).toLocaleString("en-US")
    : "0";

  return (
    <div style={labelStyle} className="label-print-container-class">
      <table style={{ ...tableStyle }}>
        <tbody>
          <tr>
            <th style={thStyle}>모델명</th>
            <td
              style={{
                ...tdWideStyle,
                whiteSpace: "normal",
                wordBreak: "break-all",
              }}
            >
              {data.jepum_nm}
            </td>
          </tr>
          <tr>
            <th style={thStyle}>LOT NO</th>
            <td style={tdWideStyle}>{data.lot_no}</td>
          </tr>
        </tbody>
      </table>

      <div style={bottomContainerStyle}>
        <div style={leftInfoStyle}>
          <table style={nestedTableStyle}>
            <tbody>
              <tr>
                <th style={{ ...nestedThStyle, borderBottom: "none" }}>
                  BIN번호
                </th>
                <td style={{ ...nestedTdStyle, borderBottom: "none" }}>
                  {data.bin_no || ""}
                </td>
              </tr>
              <tr>
                <th style={nestedThStyle}>릴당수량</th>
                <td style={nestedTdStyle}>{formattedReelAmt}</td>
              </tr>
              <tr>
                <th style={nestedThStyle}>총수량</th>
                <td style={nestedTdStyle}>{formattedTotalAmt}</td>
              </tr>
              <tr>
                <th style={nestedThStyle}>작업자</th>
                <td style={nestedTdStyle}>{data.man_cd}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={rightQrStyle}>
          <QRCodeSVG
            value={data.lot_no || "N/A"}
            size={qrSize * 3.78}
            style={{ width: `${qrSize}mm`, height: `${qrSize}mm` }}
            level="M"
          />
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// (이하 TappingProcessWork 메인 컴포넌트)
// ------------------------------------------------------------------

const TappingProcessWork = () => {
  const [form] = Form.useForm();
  const [tapings, setTapings] = useState([]);
  const [activeTab, setActiveTab] = useState("1");
  const [editingRecord, setEditingRecord] = useState(null);
  const [fromDt, setFromDt] = useState(dayjs().startOf("month"));
  const [toDt, setToDt] = useState(dayjs());
  const [productList, setProductList] = useState([]);

  // --- 인쇄를 위한 State ---
  const [printableData, setPrintableData] = useState(null);
  const [modalTitle, setModalTitle] = useState("등록/수정 완료");
  const [openPopoverKey, setOpenPopoverKey] = useState(null);

  // --- 바코드 및 포커스 관리를 위한 State & Ref ---
  const [isVirtualKeyboardOn, setIsVirtualKeyboardOn] = useState(false);
  const [barcodeScanOn, setBarcodeScanOn] = useState(true);
  const [barcodeInputValue, setBarcodeInputValue] = useState("");
  const [idleCountdown, setIdleCountdown] = useState(10);
  const barcodeInputRef = useRef(null);
  const idleTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  // --- Reel당 수량 선택 팝업 관리를 위한 State ---
  const [isReelModalVisible, setIsReelModalVisible] = useState(false);
  const [reelSelection, setReelSelection] = useState(4000);
  const [customReelAmt, setCustomReelAmt] = useState(3000);

  const v_db = "16_UR";

  // 1) 제품목록 불러오기
  useEffect(() => {
    fetch(`/api/select/jepum/jepum?v_db=${v_db}`)
      .then((res) => res.json())
      .then((data) => setProductList(data))
      .catch((err) => console.error("제품목록 에러:", err));
  }, [v_db]);

  // --- 인쇄 관련 핸들러 ---
  const handleSimplePrint = () => {
    window.print();
  };
  const handleModalClose = () => {
    setPrintableData(null);
    if (editingRecord) {
      setActiveTab("2");
      setEditingRecord(null);
    }
  };

  const handleRePrint = (record) => {
    const product = productList.find((p) => p.jepum_cd === record.jepum_cd);
    setModalTitle("라벨 재인쇄");
    setPrintableData({
      lot_no: record.lot_no,
      jepum_nm: product ? product.jepum_nm : record.jepum_cd,
      amt: record.amt,
      reel_min_amt: record.reel_min_amt || record.amt,
      bin_no: record.bigo_1 || record.bin_no,
      man_cd: record.man_cd,
    });
  };

  const handlePopoverChange = (visible, key) => {
    setOpenPopoverKey(visible ? key : null);
  };

  // --- 유휴 상태 감지 및 바코드 입력창 자동 포커스 ---
  useEffect(() => {
    const resetIdleTimer = () => {
      clearTimeout(idleTimerRef.current);
      clearInterval(countdownTimerRef.current);
      if (!barcodeScanOn || activeTab !== "1" || isReelModalVisible) return;
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
  }, [barcodeScanOn, activeTab, isReelModalVisible]);

  // --- 2) 바코드 스캔 처리 ---
  const handleBarcodeScan = async (e) => {
    const barcodeValue = barcodeInputValue.trim();
    if (barcodeValue) {
      form.setFieldsValue({ lot_no: barcodeValue });
      setBarcodeInputValue("");
      await fetchLotInfo(barcodeValue);
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
    }
  };

  const handleLotNoBlur = async (e) => {
    const lotNoValue = e.target.value.trim();
    if (lotNoValue) await fetchLotInfo(lotNoValue);
  };

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
        if (data.amt) updateData.amt = data.amt;

        form.setFieldsValue(updateData);
        message.success("TEST 라벨 정보(수량 포함)가 세팅되었습니다.");

        setReelSelection(4000);
        setIsReelModalVisible(true);
      }
    } catch (err) {
      console.error(err);
      message.error("LOT 체크 중 오류가 발생했습니다.");
    }
  };

  // 📌 [수정] Reel당 수량 모달 확인 버튼 핸들러 (Math.floor로 내림 처리)
  const handleReelModalOk = () => {
    const finalReelAmt =
      reelSelection === "custom" ? customReelAmt : reelSelection;
    const totalAmt = form.getFieldValue("amt") || 0;

    // 1. 폼에 Reel당 수량 세팅
    form.setFieldsValue({ reel_min_amt: finalReelAmt });

    // 2. 총수량을 Reel당 수량으로 나누어 꽉 찬 Reel 개수만 계산 (내림 처리)
    if (finalReelAmt > 0) {
      form.setFieldsValue({ reel_count: Math.floor(totalAmt / finalReelAmt) });
    }

    setIsReelModalVisible(false);
  };

  // 📌 [수정] 폼에서 수동으로 변경할 때도 Math.floor(내림) 적용
  const handleFormValuesChange = (changedValues, allValues) => {
    if (
      changedValues.hasOwnProperty("amt") ||
      changedValues.hasOwnProperty("reel_min_amt")
    ) {
      const totalAmt = allValues.amt || 0;
      const reelMinAmt = allValues.reel_min_amt || 1;

      if (reelMinAmt > 0) {
        form.setFieldsValue({ reel_count: Math.floor(totalAmt / reelMinAmt) });
      }
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

      const product = productList.find((p) => p.jepum_cd === values.jepum_cd);
      const dataForPrint = {
        ...values,
        jepum_nm: product ? product.jepum_nm : values.jepum_cd,
      };

      if (!editingRecord) {
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
          setModalTitle("등록 완료");
          setPrintableData(dataForPrint);
          form.resetFields();
        }
      } else {
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
          setModalTitle("수정 완료");
          setPrintableData(dataForPrint);
          form.resetFields();
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

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      lot_no: record.lot_no,
      amt: record.amt,
      reel_min_amt: record.reel_min_amt || record.amt,
      reel_count: record.lot_seq || 1,
      man_cd: record.man_cd,
      bin_no: record.bigo_1 || record.bin_no,
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
          if (data.error) message.error(`삭제실패: ${data.error}`);
          else {
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
      render: (text) =>
        text && text.length === 8
          ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`
          : text,
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
      render: (value, record) => (
        <>
          <div>총: {value}</div>
          <div>{record.lot_seq} Reel</div>
          <div>{record.man_cd}</div>
        </>
      ),
    },
    {
      title: "작업",
      key: "action",
      align: "center",
      width: 80,
      render: (_, record) => {
        const popoverContent = (
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Button
              type="link"
              onClick={() => {
                handleEdit(record);
                setOpenPopoverKey(null);
              }}
            >
              수정
            </Button>
            <Button
              type="link"
              onClick={() => {
                handleRePrint(record);
                setOpenPopoverKey(null);
              }}
            >
              재인쇄
            </Button>
            <Button
              type="link"
              danger
              onClick={() => {
                handleDelete(record);
                setOpenPopoverKey(null);
              }}
            >
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

  return (
    <div style={{ padding: 16 }} id="test-result-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
        className="no-print"
      >
        <h2>Tapping 공정 작업실적 등록</h2>
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

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="no-print">
        <TabPane tab="등록" key="1">
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
            initialValues={{ amt: 0, reel_count: 1, reel_min_amt: 0 }}
            style={{ maxWidth: 600 }}
            onValuesChange={handleFormValuesChange}
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
                filterOption={(input, option) =>
                  (option?.children ?? "")
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
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
              label="Reel당 수량"
              name="reel_min_amt"
              rules={[{ required: true, message: "Reel당 수량" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="Reel 개수 (자동계산: 꽉 찬 Reel 기준)"
              name="reel_count"
              rules={[{ required: true, message: "Reel 수" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
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

      {/* --- 📌 Reel당 수량 선택 팝업 모달 --- */}
      <Modal
        title="Reel당 수량 선택"
        open={isReelModalVisible}
        onOk={handleReelModalOk}
        onCancel={() => setIsReelModalVisible(false)}
        okText="적용"
        cancelText="취소"
        getContainer={false}
        centered
      >
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <h3 style={{ marginBottom: 20 }}>
            Reel 1개당 감길 수량을 선택하세요.
          </h3>

          {/* 💥 수정 포인트: style={{ marginRight: 8 }} 제거 */}
          <Radio.Group
            onChange={(e) => setReelSelection(e.target.value)}
            value={reelSelection}
            size="large"
            buttonStyle="solid"
          >
            <Radio.Button value={4000}>4,000개</Radio.Button>
            <Radio.Button value={5000}>5,000개</Radio.Button>
            <Radio.Button value="custom">직접 입력</Radio.Button>
          </Radio.Group>

          {reelSelection === "custom" && (
            <div style={{ marginTop: 20 }}>
              <span style={{ marginRight: 10, fontWeight: "bold" }}>
                수량 입력:
              </span>
              <InputNumber
                min={1}
                value={customReelAmt}
                onChange={setCustomReelAmt}
                size="large"
                inputMode={isVirtualKeyboardOn ? "numeric" : "none"}
                style={{ width: "150px" }}
              />
            </div>
          )}
          <p style={{ marginTop: 15, color: "#888", fontSize: "12px" }}>
            선택 시 총수량에 비례하여 꽉 찬 Reel 개수가 자동 계산됩니다.
          </p>
        </div>
      </Modal>

      {/* --- 📌 인쇄 미리보기 모달 --- */}
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
            {modalTitle.includes("완료")
              ? `다음 정보가 성공적으로 ${modalTitle}되었습니다.`
              : `다음 라벨을 재인쇄합니다.`}
          </p>
          <hr style={{ margin: "16px 0" }} />
          <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
            인쇄 미리보기 (50mm x 30mm)
          </h3>

          <div
            style={{
              margin: "20px 0",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {printableData && <LabelToPrint data={printableData} />}
          </div>

          <div style={{ textAlign: "right", marginTop: "24px" }}>
            <Button
              key="close"
              onClick={handleModalClose}
              style={{ marginRight: 8 }}
            >
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

export default TappingProcessWork;

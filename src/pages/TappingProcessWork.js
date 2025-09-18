import React, { useState, useEffect } from 'react';
import {
    Tabs, Form, Input, InputNumber, Button, DatePicker, message, Row, Col, Table, Modal, Select, Popover
} from 'antd';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { confirm } = Modal;
const { Option } = Select;

const TappingProcessWork = () => {
    const [form] = Form.useForm();
    const [tapings, setTapings] = useState([]);
    const [activeTab, setActiveTab] = useState('1');
    const [editingRecord, setEditingRecord] = useState(null);
    const [fromDt, setFromDt] = useState(dayjs().startOf('month'));
    const [toDt, setToDt] = useState(dayjs());

    // DB 스키마
    const v_db = '16_UR';

    // 제품 목록 State
    const [productList, setProductList] = useState([]);

    // 1) 제품목록 불러오기
    useEffect(() => {
        // 예: /api/select/jepum/jepum?v_db=16_UR
        fetch(`/api/select/jepum/jepum?v_db=${v_db}`)
            .then(res => res.json())
            .then(data => setProductList(data))
            .catch(err => console.error('제품목록 에러:', err));
    }, [v_db]);

    // LOT NO onBlur => check-lot
    const handleLotNoBlur = async (e) => {
        const lotNoValue = e.target.value.trim();
        if (!lotNoValue) return;

        try {
            const url = `/api/select/etc/tapping-check-lot?v_db=${v_db}&lot_no=${lotNoValue}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!res.ok) {
                if (data.error) {
                    message.warning(data.error);
                } else {
                    message.warning('LOT 체크 실패');
                }
            } else {
                // OK
                if (data.jepum_cd) {
                    form.setFieldsValue({ jepum_cd: data.jepum_cd });
                }
                if (data.bin_no) {
                    form.setFieldsValue({ bin_no: data.bin_no });
                }
                message.info('LOT NO 확인 완료 (jepum_cd/bin_no 자동 세팅)');
            }
        } catch (err) {
            console.error(err);
            message.error('LOT 체크 중 오류');
        }
    };

    // 2) 조회
    const fetchTapingResults = async (startDate, endDate) => {
        try {
            const fromParam = startDate ? startDate.format('YYYYMMDD') : '19990101';
            const toParam = endDate ? endDate.format('YYYYMMDD') : '20991231';
            const url = `/api/select/etc/tapping-result?v_db=${v_db}&from_dt=${fromParam}&to_dt=${toParam}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('조회오류');
            const data = await res.json();
            data.forEach((item, idx) => { item.key = idx; });
            setTapings(data);
        } catch (err) {
            console.error(err);
            message.error('조회 중 오류발생');
        }
    };

    useEffect(() => {
        fetchTapingResults(fromDt, toDt);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromDt, toDt]);

    // 3) 등록/수정
    const onFinish = async (values) => {
        try {
            const payload = {
                lot_no: values.lot_no,
                amt: values.amt,
                reel_count: values.reel_count,
                reel_min_amt: values.reel_min_amt,
                man_cd: values.man_cd,
                bin_no: values.bin_no,
                jepum_cd: values.jepum_cd || '', // Select에서 코드가 들어감
            };

            if (!editingRecord) {
                // insert
                const res = await fetch(`/api/insert/etc/tapping-result?v_db=${v_db}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (data.error) {
                    message.error(`등록실패: ${data.error}`);
                } else {
                    message.success('등록성공');
                    fetchTapingResults(fromDt, toDt);
                    form.resetFields();
                    setActiveTab('2');
                }
            } else {
                // update
                const res = await fetch(`/api/update/etc/tapping-result?v_db=${v_db}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (data.error) {
                    message.error(`수정실패: ${data.error}`);
                } else {
                    message.success('수정성공');
                    fetchTapingResults(fromDt, toDt);
                    form.resetFields();
                    setEditingRecord(null);
                    setActiveTab('2');
                }
            }
        } catch (err) {
            console.error(err);
            message.error('등록/수정 중 오류');
        }
    };

    const onFinishFailed = () => {
        message.error('필수항목을 확인해주세요');
    };

    // 4) 수정 / 삭제
    const handleEdit = (record) => {
        // record에 reel_count, reel_min_amt, amt 등이 없을 수도 있어서
        // 조회 쿼리에서 미리 "sum(amt)" 또는 "lot_seq 수" 등을 처리하거나
        // 혹은 백엔드에서 테이블을 조회할 때,
        // reel_count, reel_min_amt(또는 bigo_a1) 정보를 합산/추출한 결과를 내려주도록 해야 합니다.

        setEditingRecord(record);

        // 만약 record가 단일 row(예: lot_seq=1)만 가진다면 아래처럼 값 매핑:
        form.setFieldsValue({
            lot_no: record.lot_no,
            reel_count: 1,                  // 실제론 DB에서 릴 개수(최대 lot_seq)를 알아와야 함
            man_cd: record.man_cd,
            bin_no: record.bigo_1,
            jepum_cd: record.jepum_cd
        });

        // 탭 변경
        setActiveTab('1');
    };
    const handleDelete = (record) => {
        confirm({
            title: '삭제하시겠습니까?',
            onOk: async () => {
                try {
                    const url = `/api/delete/etc/tapping-result?v_db=${v_db}&lot_no=${record.lot_no}`;
                    const res = await fetch(url, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.error) {
                        message.error(`삭제실패: ${data.error}`);
                    } else {
                        message.success('삭제성공');
                        fetchTapingResults(fromDt, toDt);
                    }
                } catch (err) {
                    console.error(err);
                    message.error('삭제오류');
                }
            }
        });
    };

    // 5) 조회 테이블 컬럼
    const columns = [
        {
            title: '작업일자',
            dataIndex: 'work_dt',
            key: 'work_dt',
            align: 'center',
            render: (text) => {
                if (text && text.length === 8) {
                    return text.slice(0, 4) + '-' + text.slice(4, 6) + '-' + text.slice(6, 8);
                }
                return text;
            },
        },
        { title: 'LOT NO', dataIndex: 'lot_no', key: 'lot_no', align: 'center' },
        {
            title: '제품명',
            dataIndex: 'jepum_nm',
            key: 'jepum_nm',
            align: 'center',
        },
        {
            title: 'Reel당 수량 및 Reel 개수 및 작업자',
            dataIndex: 'amt',
            key: 'amtMan',
            align: 'center',
            width: 120,
            render: (value, record) => {
                return (
                    <>
                        <div>{value}</div>        {/* Reel당 수량 (amt) */}
                        <div>{record.lot_seq}</div>  {/* Reel 개수 (lot_seq) */}
                        <div>{record.man_cd}</div>   {/* 작업자 (man_cd) */}
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

    return (
        <div style={{ padding: 16 }}>
            <h2>Tapping 공정 작업실적 등록</h2>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="등록" key="1">
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
                        {/* LOT NO + onBlur */}
                        <Form.Item
                            label="LOT NO"
                            name="lot_no"
                            rules={[{ required: true, message: 'LOT NO' }]}
                        >
                            <Input onBlur={handleLotNoBlur} placeholder="LOT NO" />
                        </Form.Item>

                        {/* 제품코드(Select) - DB에는 jepum_cd 저장, 사용자에겐 jepum_nm 보임 */}
                        <Form.Item
                            label="제품"
                            name="jepum_cd"
                            rules={[{ required: true, message: '제품을 선택하세요!' }]}
                        >
                            <Select
                                showSearch
                                placeholder="제품 선택"
                                optionFilterProp="children"
                                filterOption={(input, option) => {
                                    // option.children 은 "제품명 (코드)" 형태일 수도 있음
                                    const label = (option?.children ?? '').toString().toLowerCase();
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
                            rules={[{ required: true, message: 'BIN NO' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="총수량"
                            name="amt"
                            rules={[{ required: true, message: '총수량' }]}
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            label="Reel 개수"
                            name="reel_count"
                            rules={[{ required: true, message: 'Reel 수' }]}
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            label="Reel당 수량"
                            name="reel_min_amt"
                            rules={[{ required: true, message: 'Reel당 수량' }]}
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            label="작업자"
                            name="man_cd"
                            rules={[{ required: true, message: '작업자' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
                                {editingRecord ? '수정하기' : '등록하기'}
                            </Button>
                            <Button onClick={() => form.resetFields()}>초기화</Button>
                        </Form.Item>
                    </Form>
                </TabPane>

                <TabPane tab="조회" key="2">
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>

                        <Row style={{ flexFlow: 'row nowrap' }} gutter={8}>
                            <Col span={9}>
                                <DatePicker value={fromDt} format="YYYY-MM-DD" onChange={(d) => setFromDt(d)} />
                            </Col>
                            <span style={{ margin: '5px 2px' }}>~</span>

                            <Col span={9}>
                                <DatePicker value={toDt} format="YYYY-MM-DD" onChange={(d) => setToDt(d)} />
                            </Col>
                            <Col span={8}>
                                <Button type="primary" onClick={() => fetchTapingResults(fromDt, toDt)}>조회</Button>
                            </Col>
                        </Row>
                    </div>

                    <Table columns={columns} dataSource={tapings} pagination={{ pageSize: 10 }} />
                </TabPane>
            </Tabs>

        </div>
    );
};

export default TappingProcessWork;

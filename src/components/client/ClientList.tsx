import React, { useState, useEffect } from 'react';
import { Table, Input, Select, Space, Button, message, Popconfirm, Tag, Modal, Form } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from '@/lib/axios';

const { Option } = Select;
const { TextArea } = Input;

interface ClientProps {
  onAddClient: () => void;
}

interface ClientData {
  id: string;
  name: string;
  industry: string;
  contact: string;
  phone: string;
  address: string;
  tags: string[];
  createdAt: string;
  description?: string;
}

const ClientList: React.FC<ClientProps> = ({ onAddClient }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [currentClient, setCurrentClient] = useState<ClientData | null>(null);
  const [editForm] = Form.useForm();

  // 从本地存储加载客户数据
  const loadCachedClients = () => {
    try {
      const cachedData = localStorage.getItem('cached_clients');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          console.log('从缓存加载客户数据');
          return parsedData;
        }
      }
    } catch (e) {
      console.error('读取缓存客户数据失败:', e);
    }
    return null;
  };

  // 模拟获取客户数据
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      
      // 首先尝试从缓存加载
      const cachedClients = loadCachedClients();
      
      try {
        // 这里用模拟数据，实际项目中应替换为API调用
        // const response = await axios.get('/api/clients');
        // setClients(response.data);
        
        // 模拟数据
        const mockData: ClientData[] = [
          {
            id: 'C001',
            name: '上海星辰科技有限公司',
            industry: '科技',
            contact: '张三',
            phone: '13800138000',
            address: '上海市浦东新区张江高科技园区',
            tags: ['高价值', '上市企业'],
            createdAt: '2023-01-15'
          },
          {
            id: 'C002',
            name: '北京未来医疗科技有限公司',
            industry: '医疗',
            contact: '李四',
            phone: '13900139000',
            address: '北京市朝阳区望京SOHO',
            tags: ['潜力客户'],
            createdAt: '2023-02-20'
          },
          {
            id: 'C003',
            name: '广州海洋贸易有限公司',
            industry: '贸易',
            contact: '王五',
            phone: '13700137000',
            address: '广州市天河区珠江新城',
            tags: ['稳定合作'],
            createdAt: '2023-03-10'
          },
          {
            id: 'C004',
            name: '杭州阳光餐饮管理有限公司',
            industry: '餐饮',
            contact: '赵六',
            phone: '13600136000',
            address: '杭州市西湖区文化创意园',
            tags: ['新客户'],
            createdAt: '2023-04-05'
          },
          {
            id: 'C005',
            name: '深圳智能制造有限公司',
            industry: '科技',
            contact: '钱七',
            phone: '13500135000',
            address: '深圳市南山区科技园',
            tags: ['高价值', '拟上市'],
            createdAt: '2023-05-18'
          }
        ];
        
        // 合并模拟数据和缓存数据
        let finalData;
        if (cachedClients && cachedClients.length > 0) {
          // 只保留不重复的数据
          const mockIds = new Set(mockData.map(item => item.id));
          const uniqueCached = cachedClients.filter(item => !mockIds.has(item.id));
          finalData = [...uniqueCached, ...mockData];
        } else {
          finalData = mockData;
        }
        
        setClients(finalData);
      } catch (error) {
        console.error('获取客户列表失败:', error);
        
        // API请求失败，使用缓存数据
        if (cachedClients && cachedClients.length > 0) {
          setClients(cachedClients);
          message.warning('网络连接问题，显示本地缓存数据');
        } else {
          message.error('获取客户列表失败');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // 处理客户编辑
  const handleEditClient = (client: ClientData) => {
    setCurrentClient(client);
    editForm.setFieldsValue({
      name: client.name,
      industry: client.industry,
      contact: client.contact,
      phone: client.phone,
      address: client.address,
      tags: client.tags || [],
      description: client.description || ''
    });
    setEditModalVisible(true);
  };

  // 保存编辑的客户信息
  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      if (!currentClient) return;
      
      // 更新客户信息
      const updatedClient = {
        ...currentClient,
        ...values,
        // 确保tags是数组
        tags: values.tags || []
      };
      
      // 使用当前时间作为更新时间
      updatedClient.updatedAt = new Date().toISOString().split('T')[0];
      
      setLoading(true);
      
      try {
        // 实际项目中应该调用API
        // await axios.put(`/api/clients/${currentClient.id}`, updatedClient);
        
        // 更新本地内存中的客户列表
        setClients(clients.map(client => 
          client.id === currentClient.id ? updatedClient : client
        ));
        
        // 更新本地缓存
        const cachedClients = loadCachedClients() || [];
        const updatedCache = cachedClients.map((client: ClientData) => 
          client.id === currentClient.id ? updatedClient : client
        );
        localStorage.setItem('cached_clients', JSON.stringify(updatedCache));
        
        message.success('客户信息已更新');
        setEditModalVisible(false);
      } catch (error) {
        console.error('更新客户信息失败:', error);
        message.error('更新客户信息失败');
      }
      
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditModalVisible(false);
  };

  // 处理客户删除
  const handleDeleteClient = async (clientId: string) => {
    try {
      // 实际项目中应该调用API
      // await axios.delete(`/api/clients/${clientId}`);
      
      // 从内存中删除
      setClients(clients.filter(client => client.id !== clientId));
      
      // 更新本地缓存
      try {
        const cachedClients = loadCachedClients() || [];
        const updatedCache = cachedClients.filter((client: ClientData) => client.id !== clientId);
        localStorage.setItem('cached_clients', JSON.stringify(updatedCache));
      } catch (e) {
        console.error('更新缓存失败:', e);
      }
      
      message.success('客户已删除');
    } catch (error) {
      message.error('删除客户失败');
      console.error('删除客户失败:', error);
    }
  };

  // 根据筛选条件过滤客户数据
  const filteredClients = clients.filter(client => {
    const matchSearchText = searchText ? 
      client.name?.toLowerCase().includes(searchText.toLowerCase()) || 
      client.contact?.toLowerCase().includes(searchText.toLowerCase()) || 
      client.id?.toLowerCase().includes(searchText.toLowerCase()) : true;
    
    const matchIndustry = industryFilter ? client.industry === industryFilter : true;
    
    const matchTag = tagFilter ? client.tags && client.tags.includes(tagFilter) : true;
    
    return matchSearchText && matchIndustry && matchTag;
  });

  // 表格列定义
  const columns = [
    {
      title: '客户编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '标签',
      key: 'tags',
      dataIndex: 'tags',
      width: 180,
      render: (tags: string[] = []) => (
        <>
          {tags && tags.map(tag => {
            let color = 'green';
            if (tag === '高价值') {
              color = 'gold';
            } else if (tag === '上市企业') {
              color = 'geekblue';
            } else if (tag === '拟上市') {
              color = 'purple';
            } else if (tag === '新客户') {
              color = 'magenta';
            }
            return (
              <Tag color={color} key={tag} style={{ marginBottom: '4px' }}>
                {tag}
              </Tag>
            );
          })}
        </>
      ),
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ClientData) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEditClient(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此客户吗?"
            onConfirm={() => handleDeleteClient(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space size="large">
          <Input
            placeholder="搜索客户名称/编号/联系人"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select 
            placeholder="行业分类" 
            style={{ width: 150 }}
            allowClear
            value={industryFilter || undefined}
            onChange={(value) => setIndustryFilter(value)}
          >
            <Option value="科技">科技</Option>
            <Option value="贸易">贸易</Option>
            <Option value="医疗">医疗</Option>
            <Option value="餐饮">餐饮</Option>
            <Option value="其他">其他</Option>
          </Select>
          <Select 
            placeholder="客户标签" 
            style={{ width: 150 }}
            allowClear
            value={tagFilter || undefined}
            onChange={(value) => setTagFilter(value)}
          >
            <Option value="高价值">高价值</Option>
            <Option value="上市企业">上市企业</Option>
            <Option value="潜力客户">潜力客户</Option>
            <Option value="稳定合作">稳定合作</Option>
            <Option value="新客户">新客户</Option>
            <Option value="拟上市">拟上市</Option>
          </Select>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={onAddClient}
          >
            添加客户
          </Button>
        </Space>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={filteredClients} 
        rowKey="id"
        loading={loading}
        pagination={{ 
          pageSize: 10,
          showTotal: (total) => `共 ${total} 个客户`
        }}
      />

      {/* 编辑客户模态框 */}
      <Modal
        title="编辑客户信息"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        confirmLoading={loading}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={editForm}
          layout="vertical"
          name="editClientForm"
        >
          <Form.Item
            name="name"
            label="客户名称"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          
          <Form.Item
            name="industry"
            label="行业分类"
            rules={[{ required: true, message: '请选择行业' }]}
          >
            <Select placeholder="请选择行业">
              <Option value="科技">科技</Option>
              <Option value="贸易">贸易</Option>
              <Option value="医疗">医疗</Option>
              <Option value="餐饮">餐饮</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="contact"
            label="联系人姓名"
            rules={[{ required: true, message: '请输入联系人姓名' }]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          
          <Form.Item
            name="address"
            label="联系地址"
            rules={[{ required: true, message: '请输入联系地址' }]}
          >
            <Input placeholder="请输入联系地址" />
          </Form.Item>
          
          <Form.Item
            name="tags"
            label="客户标签"
          >
            <Select mode="multiple" placeholder="请选择标签" allowClear>
              <Option value="高价值">高价值</Option>
              <Option value="上市企业">上市企业</Option>
              <Option value="潜力客户">潜力客户</Option>
              <Option value="稳定合作">稳定合作</Option>
              <Option value="新客户">新客户</Option>
              <Option value="拟上市">拟上市</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="备注信息"
          >
            <TextArea rows={4} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientList; 
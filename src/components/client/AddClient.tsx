import React, { useState } from 'react';
import { Modal, Form, Input, Select, Row, Col, Upload, Button, message } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import axios from '@/lib/axios'; // 修改为使用配置好的axios实例

const { Option } = Select;
const { TextArea } = Input;

interface AddClientProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AddClient: React.FC<AddClientProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  // 从本地存储加载客户数据
  const loadCachedClients = () => {
    try {
      const cachedData = localStorage.getItem('cached_clients');
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (e) {
      console.error('读取缓存客户数据失败:', e);
    }
    return [];
  };

  // 保存客户数据到本地存储
  const saveCachedClients = (clients: any[]) => {
    try {
      localStorage.setItem('cached_clients', JSON.stringify(clients));
    } catch (e) {
      console.error('保存客户数据到缓存失败:', e);
    }
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      
      // 准备客户数据
      const clientData = {
        ...values,
        tags: values.tags || [],
        files: fileList.map(file => file.name || ''),
        id: `C${Math.floor(1000 + Math.random() * 9000)}`, // 生成随机ID
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      try {
        // 尝试调用API
        // const response = await axios.post('/api/clients', clientData);
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟API成功
        console.log('提交的客户数据:', clientData);
        
        // 添加到本地缓存
        const existingClients = loadCachedClients();
        saveCachedClients([clientData, ...existingClients]);
        
        message.success('客户添加成功');
        form.resetFields();
        setFileList([]);
        onSuccess();
      } catch (apiError) {
        console.error('API调用失败，保存到本地缓存:', apiError);
        
        // API调用失败，添加到本地缓存并显示警告
        const existingClients = loadCachedClients();
        saveCachedClients([clientData, ...existingClients]);
        
        message.warning('网络连接问题，客户信息已临时保存，将在网络恢复后同步');
        form.resetFields();
        setFileList([]);
        onSuccess();
      }
    } catch (error) {
      console.error('添加客户表单验证失败:', error);
      if (error instanceof Error) {
        message.error(`添加客户失败: ${error.message}`);
      } else {
        message.error('添加客户失败');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // 取消时重置表单
  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onCancel();
  };

  // 文件上传的配置
  const uploadProps: UploadProps = {
    onRemove: file => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: file => {
      // 限制文件大小为10MB
      if (file.size > 10 * 1024 * 1024) {
        message.error('文件大小不能超过10MB');
        return Upload.LIST_IGNORE;
      }
      
      // 在实际应用中，这里应该上传文件到服务器
      // 这里模拟上传成功
      setFileList([...fileList, file]);
      return false; // 阻止自动上传
    },
    fileList,
  };

  return (
    <Modal
      title="新增客户"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={submitLoading}
      width={700}
      okText="保存"
      cancelText="取消"
    >
      <Form 
        form={form}
        layout="vertical"
        name="addClientForm"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="name" 
              label="客户名称" 
              rules={[{ required: true, message: '请输入客户名称' }]}
            >
              <Input placeholder="请输入客户名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
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
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="contact" 
              label="联系人姓名"
              rules={[{ required: true, message: '请输入联系人姓名' }]}
            >
              <Input placeholder="请输入联系人姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="phone" 
              label="联系电话"
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item 
          name="address" 
          label="联系地址"
          rules={[{ required: true, message: '请输入联系地址' }]}
        >
          <Input placeholder="请输入联系地址" />
        </Form.Item>
        
        <Form.Item name="tags" label="客户标签">
          <Select mode="multiple" placeholder="请选择标签" allowClear>
            <Option value="高价值">高价值</Option>
            <Option value="上市企业">上市企业</Option>
            <Option value="潜力客户">潜力客户</Option>
            <Option value="稳定合作">稳定合作</Option>
            <Option value="新客户">新客户</Option>
            <Option value="拟上市">拟上市</Option>
          </Select>
        </Form.Item>
        
        <Form.Item name="remarks" label="备注信息">
          <TextArea rows={4} placeholder="请输入备注信息" />
        </Form.Item>
        
        <Form.Item label="上传资料">
          <Upload {...uploadProps} multiple>
            <Button icon={<CloudUploadOutlined />}>选择文件</Button>
          </Upload>
          <div style={{ marginTop: 8, color: 'rgba(0, 0, 0, 0.45)' }}>
            支持上传客户营业执照、合同等相关文件，单个文件不超过10MB
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddClient; 
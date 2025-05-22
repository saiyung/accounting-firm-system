import React from 'react';
import { NextPage } from 'next';
import { Typography, Card, List, Tag, Space, Timeline, Alert, Divider, Button, Row, Col } from 'antd';
import { CheckCircleOutlined, ToolOutlined, SecurityScanOutlined, FileAddOutlined, BugOutlined, ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import AppLayout from '../../components/Layout';
import { useRouter } from 'next/router';

const { Title, Paragraph, Text } = Typography;

// 修改类型定义，添加getLayout属性
interface UpdatesPageProps {
  isFromNotification?: boolean;
}

const UpdatesPage: NextPage<UpdatesPageProps> & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
} = () => {
  const router = useRouter();
  
  // 创建页面内容
  const pageContent = (
    <>
      <Card bordered={false}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Space>
              <Button 
                type="link" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => router.back()}
                style={{ paddingLeft: 0 }}
              >
                返回
              </Button>
              <Title level={4} style={{ margin: 0 }}>系统更新</Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />}>下载更新日志</Button>
            </Space>
          </Col>
        </Row>
      </Card>
      
      <Alert
        message="系统已更新至 v2.3.0 版本"
        description="更新已于2023年10月25日09:15完成。本次更新包含多项功能改进和安全性增强。"
        type="success"
        showIcon
        style={{ marginTop: 16 }}
      />
      
      <Card title="更新内容" bordered={false} style={{ marginTop: 16 }}>
        <Timeline>
          <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>功能增强</Text>
              <List
                size="small"
                bordered
                style={{ marginTop: 8 }}
                dataSource={[
                  '新增报表导出功能，支持Excel、PDF、Word等格式',
                  '优化权限管理，增加部门级权限设置',
                  '改进搜索功能，支持全文检索和高级筛选',
                  '添加批量操作功能，提高工作效率'
                ]}
                renderItem={item => <List.Item>{item}</List.Item>}
              />
            </div>
          </Timeline.Item>
          
          <Timeline.Item color="blue" dot={<ToolOutlined />}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>系统优化</Text>
              <List
                size="small"
                bordered
                style={{ marginTop: 8 }}
                dataSource={[
                  '提升系统响应速度，降低页面加载时间',
                  '优化数据库查询，提高数据处理效率',
                  '改进用户界面，优化移动端适配',
                  '减少资源占用，降低服务器负载'
                ]}
                renderItem={item => <List.Item>{item}</List.Item>}
              />
            </div>
          </Timeline.Item>
          
          <Timeline.Item color="red" dot={<SecurityScanOutlined />}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>安全更新</Text>
              <List
                size="small"
                bordered
                style={{ marginTop: 8 }}
                dataSource={[
                  '修复多个安全漏洞，增强系统防护能力',
                  '升级加密算法，提高数据传输安全性',
                  '增强密码策略，提升账号安全',
                  '新增异常登录检测和防护机制'
                ]}
                renderItem={item => <List.Item>{item}</List.Item>}
              />
            </div>
          </Timeline.Item>
          
          <Timeline.Item color="purple" dot={<BugOutlined />}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>问题修复</Text>
              <List
                size="small"
                bordered
                style={{ marginTop: 8 }}
                dataSource={[
                  '修复报表生成过程中可能出现的数据丢失问题',
                  '解决某些浏览器下的兼容性问题',
                  '修复用户角色变更后权限不更新的问题',
                  '修复批量导入客户数据时可能的错误'
                ]}
                renderItem={item => <List.Item>{item}</List.Item>}
              />
            </div>
          </Timeline.Item>
        </Timeline>
      </Card>
      
      <Card title="历史版本" bordered={false} style={{ marginTop: 16 }}>
        <List
          itemLayout="horizontal"
          dataSource={[
            {
              version: 'v2.2.0',
              date: '2023-09-15',
              description: '新增项目管理模块，优化用户体验'
            },
            {
              version: 'v2.1.5',
              date: '2023-08-20',
              description: '安全更新和性能优化'
            },
            {
              version: 'v2.1.0',
              date: '2023-07-10',
              description: '新增报表模板功能，修复已知问题'
            },
            {
              version: 'v2.0.0',
              date: '2023-06-01',
              description: '重大版本更新，全新界面和架构'
            }
          ]}
          renderItem={item => (
            <List.Item
              actions={[<a key="view">查看详情</a>]}
            >
              <List.Item.Meta
                title={<Space><Text strong>{item.version}</Text><Tag color="blue">{item.date}</Tag></Space>}
                description={item.description}
              />
            </List.Item>
          )}
        />
      </Card>
      
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Space>
          <Button type="primary">查看更新日志</Button>
          <Button>检查新版本</Button>
        </Space>
      </div>
    </>
  );

  // 返回页面内容
  return pageContent;
};

// 添加getLayout函数，根据来源决定是否使用AppLayout
UpdatesPage.getLayout = (page) => {
  // 判断是否是从通知栏进入
  const router = useRouter();
  const { from } = router.query;
  
  // 如果是从通知栏进入，则直接返回页面内容
  if (from === 'notification') {
    return page;
  }
  
  // 否则使用AppLayout包装
  return <AppLayout>{page}</AppLayout>;
};

export default UpdatesPage; 
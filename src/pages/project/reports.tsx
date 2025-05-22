import React from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { Result, Button, Card, Typography, Space, Descriptions, Tag, Avatar, List, Input, Form, Row, Col } from 'antd';
import { UserOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AppLayout from '../../components/Layout';
import { Comment } from '@ant-design/compatible';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

// 修改类型定义，添加getLayout属性
interface ProjectReportPageProps {
  isFromNotification?: boolean;
}

const ProjectReportPage: NextPage<ProjectReportPageProps> & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
} = () => {
  const router = useRouter();
  const { id } = router.query;

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
              <Title level={4} style={{ margin: 0 }}>项目报告详情</Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button type="primary">导出报告</Button>
              <Button>打印</Button>
            </Space>
          </Col>
        </Row>
      </Card>
      
      <Card bordered={false} style={{ marginTop: 16 }}>
        <Descriptions title="基本信息" bordered>
          <Descriptions.Item label="报告ID" span={3}>
            {id || '1'}
          </Descriptions.Item>
          <Descriptions.Item label="报告标题" span={3}>
            2023财年审计报告
          </Descriptions.Item>
          <Descriptions.Item label="所属项目" span={3}>
            腾讯集团2023年度财务审计
          </Descriptions.Item>
          <Descriptions.Item label="创建人">
            <Space>
              <Avatar icon={<UserOutlined />} />
              张明
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            2023-10-15
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color="blue">审核中</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="报告类型">财务审计报告</Descriptions.Item>
          <Descriptions.Item label="审核人">
            <Space>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#f56a00' }}>W</Avatar>
              王经理
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="最后更新">
            2023-10-25 14:30
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="报告内容" bordered={false} style={{ marginTop: 16 }}>
        <Paragraph>
          本报告是关于腾讯集团2023年度财务状况的审计报告。主要内容包括财务报表分析、内部控制评估以及合规性检查。
        </Paragraph>
        
        <Title level={4}>1. 财务报表分析</Title>
        <Paragraph>
          根据我们的审计，该公司的财务报表在所有重大方面按照企业会计准则的规定编制，公允反映了2023年12月31日的财务状况以及2023年度的经营成果和现金流量。
        </Paragraph>
        
        <Title level={4}>2. 内部控制评估</Title>
        <Paragraph>
          公司已建立较为完善的内部控制体系，在财务报告、资产管理、采购流程等方面控制有效。
        </Paragraph>
        
        <Title level={4}>3. 合规性检查</Title>
        <Paragraph>
          公司在税务申报、财务披露等方面符合相关法律法规要求。
        </Paragraph>
      </Card>

      <Card title="审核评论" bordered={false} style={{ marginTop: 16 }}>
        <List
          itemLayout="horizontal"
          dataSource={[
            {
              author: '王经理',
              avatar: <Avatar style={{ backgroundColor: '#f56a00' }}>W</Avatar>,
              content: <p>请补充现金流量表的说明，特别是关于投资活动现金流出大幅增加的部分需要详细解释。</p>,
              datetime: '2023-10-25 14:30'
            }
          ]}
          renderItem={item => (
            <Comment
              author={<a>{item.author}</a>}
              avatar={item.avatar}
              content={item.content}
              datetime={item.datetime}
            />
          )}
        />
        
        <Form style={{ marginTop: 24 }}>
          <Form.Item>
            <TextArea rows={4} placeholder="请输入您的评论" />
          </Form.Item>
          <Form.Item>
            <Button type="primary">
              提交评论
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );

  // 返回页面内容
  return pageContent;
};

// 添加getLayout函数，根据来源决定是否使用AppLayout
ProjectReportPage.getLayout = (page) => {
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

export default ProjectReportPage; 
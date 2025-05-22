import React from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import AppLayout from '@/components/Layout';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { CompanyNoticeProvider } from '@/context/CompanyNoticeContext';
import 'antd/dist/reset.css';
import '@/styles/globals.css';

type NextPageWithLayout = {
  getLayout?: (page: React.ReactElement) => React.ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

const App = ({ Component, pageProps, router }: AppPropsWithLayout) => {
  // 登录页不使用布局
  const isLoginPage = router.pathname === '/login';
  
  // 使用页面自定义布局或默认布局
  const getLayout = Component.getLayout || ((page) => (
    <AppLayout>{page}</AppLayout>
  ));

  return (
    <>
      <Head>
        <title>会计师事务所智能管理系统</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="description" content="会计师事务所智能管理系统，提升效率、降低风险、简化流程" />
      </Head>
      <AuthProvider>
        <NotificationProvider>
          <CompanyNoticeProvider>
            <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1890ff' } }}>
              {isLoginPage ? (
                <Component {...pageProps} />
              ) : (
                getLayout(<Component {...pageProps} />)
              )}
            </ConfigProvider>
          </CompanyNoticeProvider>
        </NotificationProvider>
      </AuthProvider>
    </>
  );
};

export default App; 
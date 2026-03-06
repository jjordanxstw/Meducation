import { Refine } from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import {
  ErrorComponent,
  ThemedLayoutV2,
  ThemedSiderV2,
  ThemedTitleV2,
  useNotificationProvider,
} from '@refinedev/antd';
import routerBindings, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from '@refinedev/react-router-v6';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntdApp, theme } from 'antd';
import thTH from 'antd/locale/th_TH';
import '@refinedev/antd/dist/reset.css';

import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';

// Icons
import {
  BookOutlined,
  AppstoreOutlined,
  ReadOutlined,
  FileOutlined,
  CalendarOutlined,
  UserOutlined,
  AuditOutlined,
  DashboardOutlined,
} from '@ant-design/icons';

// Pages
import { DashboardPage } from './pages/dashboard';
import { SubjectList, SubjectCreate, SubjectEdit, SubjectShow } from './pages/subjects';
import { SectionList, SectionCreate, SectionEdit } from './pages/sections';
import { LectureList, LectureCreate, LectureEdit } from './pages/lectures';
import { ResourceList, ResourceCreate, ResourceEdit } from './pages/resources';
import { CalendarEventList, CalendarEventCreate, CalendarEventEdit } from './pages/calendar';
import { ProfileList, ProfileEdit, ProfileShow } from './pages/profiles';
import { AuditLogList } from './pages/audit-logs';
import { LoginPage } from './pages/login';

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        {/* Suppress Menu children warning - this is from Refine's ThemedSiderV2 */}
        <ConfigProvider
          locale={thTH}
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: '#0070F3',
              fontFamily: 'Prompt, sans-serif',
              borderRadius: 12,
              wireframe: false,
            },
            components: {
              Layout: {
                bodyBg: '#f8fafc',
                headerBg: '#ffffff',
                siderBg: '#ffffff',
              },
              Card: {
                borderRadiusLG: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                borderRadius: 16,
              },
              Table: {
                borderRadius: 12,
                headerBg: '#f8fafc',
                headerColor: '#0f172a',
              },
              Button: {
                borderRadius: 12,
                fontWeight: 500,
                boxShadow: '0 2px 4px rgba(0, 112, 243, 0.2)',
              },
              Input: {
                borderRadius: 12,
              },
              Select: {
                borderRadius: 12,
              },
            },
          }}
        >
          <AntdApp>
            <Refine
              dataProvider={dataProvider('/api/v1')}
              authProvider={authProvider}
              routerProvider={routerBindings}
              notificationProvider={useNotificationProvider}
              resources={[
                {
                  name: 'dashboard',
                  list: '/dashboard',
                  meta: {
                    label: 'แดชบอร์ด',
                    icon: <DashboardOutlined />,
                  },
                },
                {
                  name: 'subjects',
                  list: '/subjects',
                  create: '/subjects/create',
                  edit: '/subjects/edit/:id',
                  show: '/subjects/show/:id',
                  meta: {
                    label: 'รายวิชา',
                    icon: <BookOutlined />,
                  },
                },
                {
                  name: 'sections',
                  list: '/sections',
                  create: '/sections/create',
                  edit: '/sections/edit/:id',
                  meta: {
                    label: 'หมวดหมู่',
                    icon: <AppstoreOutlined />,
                  },
                },
                {
                  name: 'lectures',
                  list: '/lectures',
                  create: '/lectures/create',
                  edit: '/lectures/edit/:id',
                  meta: {
                    label: 'บทเรียน',
                    icon: <ReadOutlined />,
                  },
                },
                {
                  name: 'resources',
                  list: '/resources',
                  create: '/resources/create',
                  edit: '/resources/edit/:id',
                  meta: {
                    label: 'ไฟล์/สื่อ',
                    icon: <FileOutlined />,
                  },
                },
                {
                  name: 'calendar',
                  list: '/calendar',
                  create: '/calendar/create',
                  edit: '/calendar/edit/:id',
                  meta: {
                    label: 'ปฏิทิน',
                    icon: <CalendarOutlined />,
                  },
                },
                {
                  name: 'profiles',
                  list: '/profiles',
                  edit: '/profiles/edit/:id',
                  show: '/profiles/show/:id',
                  meta: {
                    label: 'ผู้ใช้งาน',
                    icon: <UserOutlined />,
                  },
                },
                {
                  name: 'audit-logs',
                  list: '/audit-logs',
                  meta: {
                    label: 'ประวัติการแก้ไข',
                    icon: <AuditOutlined />,
                  },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: 'medical-portal-admin',
              }}
            >
              <Routes>
                <Route
                  element={
                    <ThemedLayoutV2
                      Title={({ collapsed }) => (
                        <ThemedTitleV2
                          collapsed={collapsed}
                          text="Medical Admin"
                          icon={
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                background: 'linear-gradient(135deg, #0070F3 0%, #1d4ed8 100%)',
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: 16,
                                boxShadow: '0 4px 12px rgba(0, 112, 243, 0.3)',
                              }}
                            >
                              M
                            </div>
                          }
                        />
                      )}
                      Sider={() => <ThemedSiderV2 fixed />}
                    >
                      <Outlet />
                    </ThemedLayoutV2>
                  }
                >
                  <Route index element={<NavigateToResource resource="dashboard" />} />
                  
                  {/* Dashboard */}
                  <Route path="/dashboard" element={<DashboardPage />} />

                  {/* Subjects */}
                  <Route path="/subjects">
                    <Route index element={<SubjectList />} />
                    <Route path="create" element={<SubjectCreate />} />
                    <Route path="edit/:id" element={<SubjectEdit />} />
                    <Route path="show/:id" element={<SubjectShow />} />
                  </Route>

                  {/* Sections */}
                  <Route path="/sections">
                    <Route index element={<SectionList />} />
                    <Route path="create" element={<SectionCreate />} />
                    <Route path="edit/:id" element={<SectionEdit />} />
                  </Route>

                  {/* Lectures */}
                  <Route path="/lectures">
                    <Route index element={<LectureList />} />
                    <Route path="create" element={<LectureCreate />} />
                    <Route path="edit/:id" element={<LectureEdit />} />
                  </Route>

                  {/* Resources */}
                  <Route path="/resources">
                    <Route index element={<ResourceList />} />
                    <Route path="create" element={<ResourceCreate />} />
                    <Route path="edit/:id" element={<ResourceEdit />} />
                  </Route>

                  {/* Calendar */}
                  <Route path="/calendar">
                    <Route index element={<CalendarEventList />} />
                    <Route path="create" element={<CalendarEventCreate />} />
                    <Route path="edit/:id" element={<CalendarEventEdit />} />
                  </Route>

                  {/* Profiles */}
                  <Route path="/profiles">
                    <Route index element={<ProfileList />} />
                    <Route path="edit/:id" element={<ProfileEdit />} />
                    <Route path="show/:id" element={<ProfileShow />} />
                  </Route>

                  {/* Audit Logs */}
                  <Route path="/audit-logs" element={<AuditLogList />} />

                  <Route path="*" element={<ErrorComponent />} />
                </Route>

                <Route path="/login" element={<LoginPage />} />
              </Routes>

              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
          </AntdApp>
        </ConfigProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;

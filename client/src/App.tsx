import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { DataRoomPage } from './pages/DataRoomPage';
import { CrmPage } from './pages/CrmPage';
import { RecycleBinPage } from './pages/RecycleBinPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { LoginPage } from './pages/LoginPage';
import { SystemOverviewPage } from './pages/SystemOverviewPage';
import { DocumentListPage } from './pages/DocumentListPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { DocumentTypesPage } from './pages/DocumentTypesPage';

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-xs font-semibold text-slate-500">
        Đang khởi động hệ thống KTS CRM...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 relative">
      {/* Responsive Sidebar */}
      <Sidebar
        isMobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Page Content - takes 100% on mobile, indented by 64 on lg screens */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
        <Navbar
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentListPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/document-types" element={<DocumentTypesPage />} />
            <Route path="/system-overview" element={<SystemOverviewPage />} />
            <Route path="/dataroom" element={<DataRoomPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/crm" element={<CrmPage />} />
            <Route path="/recycle-bin" element={<RecycleBinPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

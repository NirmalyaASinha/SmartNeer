import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/useAuthStore';
import { useStore, initializeSimulatorBridge } from './store';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Footer } from './components/layout/Footer';
import { LiveOverviewPage } from './components/overview/LiveOverviewPage';
import { GisNetworkMap } from './components/map/GisNetworkMap';
import { AlertsPage } from './components/alerts/AlertsPage';
import { WaveformViewer } from './components/transients/WaveformViewer';
import { WaterQualityPage } from './components/quality/WaterQualityPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { MaintenanceKanban } from './components/maintenance/MaintenanceKanban';
import { SystemHealthPage } from './components/system/SystemHealthPage';
import { NodeDetailDrawer } from './components/node-drawer/NodeDetailDrawer';
import { ToastNotification } from './components/common/ToastNotification';
import PlanningPage from './pages/PlanningPage';

const MainApp = () => {
  const { activeTab, darkMode, setRole } = useStore();
  const { user } = useAuthStore();

  useEffect(() => {
    initializeSimulatorBridge();
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (user && user.role) {
      let roleMap: any = {
        'DISTRICT_ENGINEER': 'engineer',
        'SARPANCH': 'sarpanch',
        'VWSC_MEMBER': 'vwsc',
        'PUMP_OPERATOR': 'operator'
      };
      setRole(roleMap[user.role] || 'engineer');
    }
  }, [user, setRole]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 pb-20 md:pb-8 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && <LiveOverviewPage />}
          {activeTab === 'gisMap' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  High-Precision Village GIS Pipeline Layout
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Topological pipe segments, pressure heat gradients, and real-time mesh routing links across Shivrajpur GP.
                </p>
              </div>
              <GisNetworkMap fullScreen />
            </div>
          )}
          {activeTab === 'alerts' && <AlertsPage />}
          {activeTab === 'transients' && <WaveformViewer />}
          {activeTab === 'quality' && <WaterQualityPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'planner' && <MaintenanceKanban />}
          {activeTab === 'aiPlanning' && <PlanningPage />}
          {activeTab === 'systemHealth' && <SystemHealthPage />}
        </main>
      </div>
      <Footer />
      <MobileNav />
      <NodeDetailDrawer />
      <ToastNotification />
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user, fetchUser } = useAuthStore();
  
  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user, fetchUser]);

  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

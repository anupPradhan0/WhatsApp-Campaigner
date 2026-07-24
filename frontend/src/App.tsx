import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SendWhatsapp from './pages/SendWhatsapp';
import ManageBusinessPage from './pages/ManageBusiness';
import DashboardPage from './pages/Dashboard';
import CreditReportsPage from './pages/CreditReports';
import NewsPage from './pages/News';
import ComplaintsPage from './pages/Complaints';
import ManageAccountsPage from './pages/ManageAccounts';
import TreeViewPage from './pages/TreeView';
import ReportsPage from './pages/Reports';
import CampaignDetailsPage from './pages/CampaignDetails';
import DocumentationPage from './pages/Documentation';
import SupportPage from './pages/Support';
import NotFoundPage from './pages/NotFound';

const wrapped = (Page: React.ComponentType) => (
  <ProtectedRoute>
    <DashboardLayout><Page /></DashboardLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster position="top-right" richColors theme="dark" closeButton />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/home"           element={wrapped(DashboardPage)} />
              <Route path="/send-whatsapp"  element={wrapped(SendWhatsapp)} />
              <Route path="/credits"        element={wrapped(CreditReportsPage)} />
              <Route path="/manage-accounts" element={wrapped(ManageAccountsPage)} />
              <Route path="/manage-admin"   element={<Navigate to="/manage-accounts" replace />} />
              <Route path="/manage-reseller"element={<Navigate to="/manage-accounts" replace />} />
              <Route path="/manage-users"   element={<Navigate to="/manage-accounts" replace />} />
              <Route path="/whatsapp-report"element={wrapped(ReportsPage)} />
              <Route path="/whatsapp-report/:campaignId" element={wrapped(CampaignDetailsPage)} />
              <Route path="/all-campaign"   element={<Navigate to="/whatsapp-report" replace />} />
              <Route path="/all-campaign/:campaignId" element={wrapped(CampaignDetailsPage)} />
              <Route path="/news"           element={wrapped(NewsPage)} />
              <Route path="/tree-view"      element={wrapped(TreeViewPage)} />
              <Route path="/complaints"     element={wrapped(ComplaintsPage)} />
              <Route path="/manage-business"element={wrapped(ManageBusinessPage)} />
              <Route path="/docs"           element={wrapped(DocumentationPage)} />
              <Route path="/support"        element={wrapped(SupportPage)} />
              <Route path="/404"            element={wrapped(NotFoundPage)} />
              <Route path="*"               element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

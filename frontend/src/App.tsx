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
import ManageResellerPage from './pages/ManageReseller';
import ManageUserPage from './pages/ManageUser';
import ManageAdminPage from './pages/ManageAdmin';
import TreeViewPage from './pages/TreeView';
import WhatsAppReportsPage from './pages/WhatsAppReports';
import CampaignDetailsPage from './pages/CampaignDetails';
import AllCampaignPage from './pages/AllCampaigns';
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
              <Route path="/manage-admin"   element={wrapped(ManageAdminPage)} />
              <Route path="/manage-reseller"element={wrapped(ManageResellerPage)} />
              <Route path="/manage-users"   element={wrapped(ManageUserPage)} />
              <Route path="/whatsapp-report"element={wrapped(WhatsAppReportsPage)} />
              <Route path="/whatsapp-report/:campaignId" element={wrapped(CampaignDetailsPage)} />
              <Route path="/all-campaign"   element={wrapped(AllCampaignPage)} />
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

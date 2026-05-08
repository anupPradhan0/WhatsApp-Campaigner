import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import TreeViewPage from './pages/TreeView';
import WhatsAppReportsPage from './pages/WhatsAppReports';
import AllCampaignPage from './pages/AllCampaigns';
import DocumentationPage from './pages/Documentation';
import SupportPage from './pages/Support';

const wrapped = (Page: React.ComponentType) => (
  <ProtectedRoute>
    <DashboardLayout><Page /></DashboardLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home"           element={wrapped(DashboardPage)} />
        <Route path="/send-whatsapp"  element={wrapped(SendWhatsapp)} />
        <Route path="/credits"        element={wrapped(CreditReportsPage)} />
        <Route path="/manage-reseller"element={wrapped(ManageResellerPage)} />
        <Route path="/manage-users"   element={wrapped(ManageUserPage)} />
        <Route path="/whatsapp-report"element={wrapped(WhatsAppReportsPage)} />
        <Route path="/all-campaign"   element={wrapped(AllCampaignPage)} />
        <Route path="/news"           element={wrapped(NewsPage)} />
        <Route path="/tree-view"      element={wrapped(TreeViewPage)} />
        <Route path="/complaints"     element={wrapped(ComplaintsPage)} />
        <Route path="/manage-business"element={wrapped(ManageBusinessPage)} />
        <Route path="/docs"           element={wrapped(DocumentationPage)} />
        <Route path="/support"        element={wrapped(SupportPage)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

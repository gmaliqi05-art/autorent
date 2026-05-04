import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ChatWidget from './components/chat/ChatWidget';
import CookieConsent from './components/CookieConsent';
import HomePage from './pages/HomePage';
import VehicleListPage from './pages/VehicleListPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfUsePage from './pages/TermsOfUsePage';
import ClientDashboard from './pages/dashboard/ClientDashboard';
import ClientBookings from './pages/dashboard/ClientBookings';
import ClientPayments from './pages/dashboard/ClientPayments';
import ClientProfile from './pages/dashboard/ClientProfile';
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyVehicles from './pages/company/CompanyVehicles';
import CompanyBookings from './pages/company/CompanyBookings';
import CompanyPayments from './pages/company/CompanyPayments';
import CompanySettings from './pages/company/CompanySettings';
import CompanySubscription from './pages/company/CompanySubscription';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminHomepage from './pages/admin/AdminHomepage';
import AdminChat from './pages/admin/AdminChat';
import AdminEmails from './pages/admin/AdminEmails';
import AdminFinancials from './pages/admin/AdminFinancials';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminAds from './pages/admin/AdminAds';
import AdminSettings from './pages/admin/AdminSettings';
import AdminEmailTemplates from './pages/admin/AdminEmailTemplates';
import AdminMap from './pages/admin/AdminMap';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSEO from './pages/admin/AdminSEO';
import AdminSEOReport from './pages/admin/AdminSEOReport';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSendNotification from './pages/admin/AdminSendNotification';
import AdminNotificationDesign from './pages/admin/AdminNotificationDesign';
import AdminTestNotification from './pages/admin/AdminTestNotification';
import AdminPINSecurity from './pages/admin/AdminPINSecurity';
import AdminBusinessPlan from './pages/admin/AdminBusinessPlan';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminInvoiceSettings from './pages/admin/AdminInvoiceSettings';
import AdminBankDetails from './pages/admin/AdminBankDetails';
import AdminDiscountCodes from './pages/admin/AdminDiscountCodes';
import AdminDailyOffers from './pages/admin/AdminDailyOffers';
import AdminCreateAd from './pages/admin/AdminCreateAd';
import AdminLegalPages from './pages/admin/AdminLegalPages';
import CookiePolicyPage from './pages/CookiePolicyPage';
import LegalNoticePage from './pages/LegalNoticePage';
import GDPRRightsPage from './pages/GDPRRightsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import NotFoundPage from './pages/NotFoundPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

const SA = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['super_admin']}>{children}</ProtectedRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/kycu" element={<LoginPage />} />
          <Route path="/regjistrohu" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/rezervimet" element={<ProtectedRoute allowedRoles={['client']}><ClientBookings /></ProtectedRoute>} />
          <Route path="/dashboard/pagesat" element={<ProtectedRoute allowedRoles={['client']}><ClientPayments /></ProtectedRoute>} />
          <Route path="/dashboard/profili" element={<ProtectedRoute allowedRoles={['client']}><ClientProfile /></ProtectedRoute>} />

          <Route path="/kompania" element={<ProtectedRoute allowedRoles={['company_admin']}><CompanyDashboard /></ProtectedRoute>} />
          <Route path="/kompania/automjetet" element={<ProtectedRoute allowedRoles={['company_admin']}><CompanyVehicles /></ProtectedRoute>} />
          <Route path="/kompania/rezervimet" element={<ProtectedRoute allowedRoles={['company_admin']}><CompanyBookings /></ProtectedRoute>} />
          <Route path="/kompania/pagesat" element={<ProtectedRoute allowedRoles={['company_admin']}><CompanyPayments /></ProtectedRoute>} />
          <Route path="/kompania/cilesimet" element={<ProtectedRoute allowedRoles={['company_admin']}><CompanySettings /></ProtectedRoute>} />
          <Route path="/kompania/abonimi" element={<ProtectedRoute allowedRoles={['company_admin']}><CompanySubscription /></ProtectedRoute>} />

          <Route path="/admin" element={<SA><AdminDashboard /></SA>} />
          <Route path="/admin/kompanite" element={<SA><AdminCompanies /></SA>} />
          <Route path="/admin/perdoruesit" element={<SA><AdminUsers /></SA>} />
          <Route path="/admin/planet" element={<SA><AdminSubscriptions /></SA>} />
          <Route path="/admin/faqja" element={<SA><AdminHomepage /></SA>} />
          <Route path="/admin/hero" element={<SA><AdminHomepage /></SA>} />
          <Route path="/admin/chat" element={<SA><AdminChat /></SA>} />
          <Route path="/admin/emailet" element={<SA><AdminEmails /></SA>} />
          <Route path="/admin/raportet" element={<SA><AdminFinancials /></SA>} />
          <Route path="/admin/transaksionet" element={<SA><AdminTransactions /></SA>} />
          <Route path="/admin/reklamat" element={<SA><AdminAds /></SA>} />
          <Route path="/admin/reklamat/krijo" element={<SA><AdminCreateAd /></SA>} />
          <Route path="/admin/email-templates" element={<SA><AdminEmailTemplates /></SA>} />
          <Route path="/admin/harta" element={<SA><AdminMap /></SA>} />
          <Route path="/admin/cilesimet" element={<SA><AdminSettings /></SA>} />
          <Route path="/admin/analitika" element={<SA><AdminAnalytics /></SA>} />
          <Route path="/admin/seo" element={<SA><AdminSEO /></SA>} />
          <Route path="/admin/seo-raporti" element={<SA><AdminSEOReport /></SA>} />
          <Route path="/admin/njoftimet" element={<SA><AdminNotifications /></SA>} />
          <Route path="/admin/dergo-njoftime" element={<SA><AdminSendNotification /></SA>} />
          <Route path="/admin/notification-design" element={<SA><AdminNotificationDesign /></SA>} />
          <Route path="/admin/test-njoftimet" element={<SA><AdminTestNotification /></SA>} />
          <Route path="/admin/pin-security" element={<SA><AdminPINSecurity /></SA>} />
          <Route path="/admin/business-plan" element={<SA><AdminBusinessPlan /></SA>} />
          <Route path="/admin/faturat" element={<SA><AdminInvoices /></SA>} />
          <Route path="/admin/faturat-cilesimet" element={<SA><AdminInvoiceSettings /></SA>} />
          <Route path="/admin/banka" element={<SA><AdminBankDetails /></SA>} />
          <Route path="/admin/zbritjet" element={<SA><AdminDiscountCodes /></SA>} />
          <Route path="/admin/oferta-ditore" element={<SA><AdminDailyOffers /></SA>} />
          <Route path="/admin/ligjore" element={<SA><AdminLegalPages /></SA>} />

          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/automjetet" element={<PublicLayout><VehicleListPage /></PublicLayout>} />
          <Route path="/automjetet/:id" element={<PublicLayout><VehicleDetailPage /></PublicLayout>} />
          <Route path="/politika-privatesise" element={<PublicLayout><PrivacyPolicyPage /></PublicLayout>} />
          <Route path="/kushtet-perdorimit" element={<PublicLayout><TermsOfUsePage /></PublicLayout>} />
          <Route path="/politika-cookie" element={<PublicLayout><CookiePolicyPage /></PublicLayout>} />
          <Route path="/njoftim-ligjor" element={<PublicLayout><LegalNoticePage /></PublicLayout>} />
          <Route path="/te-drejtat-gdpr" element={<PublicLayout><GDPRRightsPage /></PublicLayout>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <ChatWidget />
        <CookieConsent />
      </AuthProvider>
    </BrowserRouter>
  );
}

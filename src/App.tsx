import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MobileBottomNav from './components/layout/MobileBottomNav';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import ChatWidget from './components/chat/ChatWidget';
import { useStandaloneMode } from './lib/useStandaloneMode';

// Eager pages (used on initial load — homepage + listings)
import HomePage from './pages/HomePage';
import VehicleListPage from './pages/VehicleListPage';
import VehicleDetailPage from './pages/VehicleDetailPage';

// Auth pages — lazy (qa s'jane entry route ne shumicen e seancave)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

// Lazy: client dashboard
const ClientDashboard = lazy(() => import('./pages/dashboard/ClientDashboard'));
const ClientBookings = lazy(() => import('./pages/dashboard/ClientBookings'));
const ClientPayments = lazy(() => import('./pages/dashboard/ClientPayments'));
const ClientProfile = lazy(() => import('./pages/dashboard/ClientProfile'));

// Lazy: company dashboard
const CompanyDashboard = lazy(() => import('./pages/company/CompanyDashboard'));
const CompanyVehicles = lazy(() => import('./pages/company/CompanyVehicles'));
const CompanyBookings = lazy(() => import('./pages/company/CompanyBookings'));
const CompanyPayments = lazy(() => import('./pages/company/CompanyPayments'));
const CompanySettings = lazy(() => import('./pages/company/CompanySettings'));
const CompanySubscription = lazy(() => import('./pages/company/CompanySubscription'));

// Lazy: admin pages (largest group — 30+ pages, all lazy-loaded)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCompanies = lazy(() => import('./pages/admin/AdminCompanies'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSubscriptions = lazy(() => import('./pages/admin/AdminSubscriptions'));
const AdminHomepage = lazy(() => import('./pages/admin/AdminHomepage'));
const AdminChat = lazy(() => import('./pages/admin/AdminChat'));
const AdminLiveChat = lazy(() => import('./pages/admin/AdminLiveChat'));
const AdminLoyalty = lazy(() => import('./pages/admin/AdminLoyalty'));
const AdminEmails = lazy(() => import('./pages/admin/AdminEmails'));
const AdminFinancials = lazy(() => import('./pages/admin/AdminFinancials'));
const AdminTransactions = lazy(() => import('./pages/admin/AdminTransactions'));
const AdminAds = lazy(() => import('./pages/admin/AdminAds'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminEmailTemplates = lazy(() => import('./pages/admin/AdminEmailTemplates'));
const AdminMap = lazy(() => import('./pages/admin/AdminMap'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminSEO = lazy(() => import('./pages/admin/AdminSEO'));
const AdminSEOReport = lazy(() => import('./pages/admin/AdminSEOReport'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminPushLogs = lazy(() => import('./pages/admin/AdminPushLogs'));
const AdminSendNotification = lazy(() => import('./pages/admin/AdminSendNotification'));
const AdminNotificationDesign = lazy(() => import('./pages/admin/AdminNotificationDesign'));
const AdminTestNotification = lazy(() => import('./pages/admin/AdminTestNotification'));
const AdminPINSecurity = lazy(() => import('./pages/admin/AdminPINSecurity'));
const AdminBusinessPlan = lazy(() => import('./pages/admin/AdminBusinessPlan'));
const AdminInvoices = lazy(() => import('./pages/admin/AdminInvoices'));
const AdminInvoiceSettings = lazy(() => import('./pages/admin/AdminInvoiceSettings'));
const AdminBankDetails = lazy(() => import('./pages/admin/AdminBankDetails'));
const AdminDiscountCodes = lazy(() => import('./pages/admin/AdminDiscountCodes'));
const AdminDailyOffers = lazy(() => import('./pages/admin/AdminDailyOffers'));
const AdminCreateAd = lazy(() => import('./pages/admin/AdminCreateAd'));
const AdminLegalPages = lazy(() => import('./pages/admin/AdminLegalPages'));

// Lazy: legal & info pages (rarely visited)
const AboutPlatformPage = lazy(() => import('./pages/AboutPlatformPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfUsePage = lazy(() => import('./pages/TermsOfUsePage'));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'));
const LegalNoticePage = lazy(() => import('./pages/LegalNoticePage'));
const GDPRRightsPage = lazy(() => import('./pages/GDPRRightsPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-dark-400">Duke ngarkuar...</p>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAppMode } = useStandaloneMode();

  return (
    <div className="min-h-screen flex flex-col">
      {!isAppMode && <Navbar />}
      {/* Ne app mode shtojme padding-top per status bar/notch.
          Padding-bottom aplikohet automatikisht ne body permes index.css. */}
      <div className={`flex-1 ${isAppMode ? 'pt-safe pb-20' : ''}`}>{children}</div>
      {!isAppMode && <Footer />}
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
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/admin/live-chat" element={<SA><AdminLiveChat /></SA>} />
            <Route path="/admin/loyalty" element={<SA><AdminLoyalty /></SA>} />
            <Route path="/admin/emailet" element={<SA><AdminEmails /></SA>} />
            <Route path="/admin/push-logs" element={<SA><AdminPushLogs /></SA>} />
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
            <Route path="/per-platformen" element={<PublicLayout><AboutPlatformPage /></PublicLayout>} />
            <Route path="/politika-privatesise" element={<PublicLayout><PrivacyPolicyPage /></PublicLayout>} />
            <Route path="/kushtet-perdorimit" element={<PublicLayout><TermsOfUsePage /></PublicLayout>} />
            <Route path="/politika-cookie" element={<PublicLayout><CookiePolicyPage /></PublicLayout>} />
            <Route path="/njoftim-ligjor" element={<PublicLayout><LegalNoticePage /></PublicLayout>} />
            <Route path="/te-drejtat-gdpr" element={<PublicLayout><GDPRRightsPage /></PublicLayout>} />
            <Route path="/500" element={<ErrorPage statusCode={500} />} />
            <Route path="/503" element={<ErrorPage statusCode={503} />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>

        <CookieConsent />
        <ChatWidget />
        <AppModeBottomNav />
      </AuthProvider>
    </BrowserRouter>
  );
}

/** Shfaqet vetem ne app mode (PWA standalone ose Capacitor native).
 *  Gjithashtu toggle-ohet klasa `app-mode` ne body per padding global (vlen per
 *  Capacitor, sepse PWA standalone e ka tashme ne @media display-mode). */
function AppModeBottomNav() {
  const { isAppMode, isNative } = useStandaloneMode();

  useEffect(() => {
    if (isNative) {
      document.body.classList.add('app-mode');
      return () => document.body.classList.remove('app-mode');
    }
  }, [isNative]);

  if (!isAppMode) return null;
  return <MobileBottomNav />;
}

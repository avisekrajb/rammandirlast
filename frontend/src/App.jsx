import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { useToast } from './context/ToastContext';
import { ScrollProvider } from './context/ScrollContext';
import { SocialProvider } from './context/SocialContext';
import { VisitorProvider } from './context/VisitorContext';
import { CropProvider } from './context/CropContext';
import { BackupProvider } from './context/BackupContext';
import { AdminLogsProvider } from './context/AdminLogsContext';
import { FullscreenProvider } from './context/FullscreenContext';
import { ChatbotProvider } from './context/ChatbotContext'; // <-- Import ChatbotProvider
import Layout from './components/common/Layout';
import PrivateRoute from './routes/PrivateRoute';
import AdminRoute from './routes/AdminRoute';
import NoticeModal from './components/modals/NoticeModal';
import ScrollToTop from './components/common/ScrollToTop';
import ScrollToTopButton from './components/common/ScrollToTopButton';
import SocialFloating from './components/common/SocialFloating';
import Chatbot from './components/chatbot/Chatbot'; // <-- Import Chatbot component

// Components
import AuthModal from './components/modals/AuthModal';
import ForgotPasswordModal from './components/modals/ForgotPasswordModal';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const BlogsPage = lazy(() => import('./pages/BlogsPage'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const DonatePage = lazy(() => import('./pages/DonatePage'));
const DonateSuccess = lazy(() => import('./pages/DonateSuccess'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const TeamProfilePage = lazy(() => import('./pages/TeamProfilePage'));
const CloudGalleryPage = lazy(() => import('./pages/CloudGalleryPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const RamPage = lazy(() => import('./pages/RamPage'));
const DynamicPage = lazy(() => import('./pages/DynamicPage'));

function App() {
  const { user, logout, loading } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const location = useLocation();
  const [authModal, setAuthModal] = useState(null);
  const [forgotModal, setForgotModal] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    // Header already shows its own logout confirmation modal,
    // so just log out here to avoid showing the prompt twice.
    logout();
    showToast(t.loggedOut, 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" color="maroon" />
      </div>
    );
  }

  return (
    <FullscreenProvider>
      <ScrollProvider>
        <SocialProvider>
          <VisitorProvider>
            <CropProvider>
              <BackupProvider>
                <AdminLogsProvider>
                  <ChatbotProvider> {/* <-- Add ChatbotProvider wrapper */}
                    {/* Scroll to top on route change */}
                    <ScrollToTop />

                    {/* Scroll to top button - shows when scrolling down */}
                    <ScrollToTopButton />

                    {/* Notice Modal - Shows on first visit */}
                    <NoticeModal />

                    {/* Floating Social Icons - Shows on all pages */}
                    <SocialFloating />

                    {/* Chatbot - Shows on all pages */}
                    <Chatbot /> {/* <-- Add Chatbot component */}

                    {!isAdminRoute ? (
                      <Layout onLogout={handleLogout} setAuthModal={setAuthModal}>
                        <Suspense fallback={
                          <div className="min-h-[60vh] flex items-center justify-center">
                            <LoadingSpinner size="lg" color="maroon" />
                          </div>
                        }>
                          <Routes>
                            {/* ==============================================================
                                PUBLIC ROUTES - Accessible without login (No authentication required)
                                ============================================================== */}
                            
                            {/* Home */}
                            <Route path="/" element={<HomePage />} />
                            
                            {/* About & Team - IMPORTANT: More specific routes FIRST */}
                            <Route path="/about" element={<AboutPage />} />
                            
                            {/* Team routes - MUST be in this order: 
                                1. Team Profile with ID only (most specific)
                                2. Team Profile with slug and ID
                                3. Team listing page (least specific) 
                            */}
                            <Route path="/templeteams/:id" element={<TeamProfilePage />} />
                            <Route path="/templeteams/:nameSlug/:id" element={<TeamProfilePage />} />
                            <Route path="/templeteams" element={<TeamPage />} />
                            
                            {/* History */}
                            <Route path="/history" element={<HistoryPage />} />
                            
                            {/* Blogs */}
                            <Route path="/blogs" element={<BlogsPage />} />
                            <Route path="/blogs/:id" element={<BlogDetail />} />
                            
                            {/* Events */}
                            <Route path="/events" element={<EventsPage />} />
                            
                            {/* Gallery - PUBLIC (No login required) */}
                            <Route path="/gallery" element={<GalleryPage />} />
                            <Route path="/gallery/:tab" element={<GalleryPage />} />
                            
                            {/* Donate - PUBLIC (No login required) */}
                            <Route path="/donate" element={<DonatePage />} />
                            <Route path="/donate/success" element={<DonateSuccess />} />
                            <Route path="/donate/failure" element={<DonatePage />} />
                            
                            {/* Contact */}
                            <Route path="/contact" element={<ContactPage />} />
                            
                            {/* Reset Password */}
                            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                            
                            {/* Privacy & Terms & Ram */}
                            <Route path="/privacy" element={<PrivacyPage />} />
                            <Route path="/terms" element={<TermsPage />} />
                            <Route path="/ram" element={<RamPage />} />
                            
                            {/* Dynamic Pages for custom footer links */}
                            <Route path="/page-*" element={<DynamicPage />} />
                            
                            {/* ==============================================================
                                PROTECTED ROUTES - Login required
                                ============================================================== */}
                            
                            {/* Booking - Requires login */}
                            <Route path="/booking" element={<PrivateRoute><BookingPage /></PrivateRoute>} />
                            
                            {/* Profile - Requires login */}
                            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                            
                            {/* My Bookings - Requires login */}
                            <Route path="/mybookings" element={<PrivateRoute><MyBookingsPage /></PrivateRoute>} />
                            
                            {/* ==============================================================
                                ADMIN ROUTES - Admin only
                                ============================================================== */}
                            <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />
                            
                            {/* Cloud Gallery - Admin only */}
                            <Route path="/cloudgallery" element={<AdminRoute><CloudGalleryPage /></AdminRoute>} />
                            
                            {/* ==============================================================
                                404 - Catch all - MUST be last
                                ============================================================== */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </Suspense>
                      </Layout>
                    ) : (
                      <Suspense fallback={
                        <div className="min-h-screen flex items-center justify-center bg-panel">
                          <LoadingSpinner size="lg" color="maroon" />
                        </div>
                      }>
                        <Routes>
                          <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />
                        </Routes>
                      </Suspense>
                    )}

                    {/* Auth Modal */}
                    <AuthModal 
                      open={authModal} 
                      onClose={() => setAuthModal(null)} 
                      onSuccess={() => setAuthModal(null)}
                      setForgotModal={setForgotModal}
                    />
                    
                    {/* Forgot Password Modal */}
                    <ForgotPasswordModal
                      open={forgotModal}
                      onClose={() => setForgotModal(false)}
                    />
                  </ChatbotProvider> {/* <-- Close ChatbotProvider */}
                </AdminLogsProvider>
              </BackupProvider>
            </CropProvider>
          </VisitorProvider>
        </SocialProvider>
      </ScrollProvider>
    </FullscreenProvider>
  );
}

export default App;
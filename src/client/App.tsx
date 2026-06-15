import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/ProtectedRoute';

/* ------------------------------------------------------------------
 * Lazy-loaded pages — each becomes its own chunk, loaded on demand.
 * ------------------------------------------------------------------ */
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CoursesPage = lazy(() => import('./pages/CoursesPage').then(m => ({ default: m.CoursesPage })));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage').then(m => ({ default: m.CourseDetailPage })));
const CoursePlayerPage = lazy(() => import('./pages/CoursePlayerPage').then(m => ({ default: m.CoursePlayerPage })));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage').then(m => ({ default: m.CertificatesPage })));
const CorporatePortalPage = lazy(() => import('./pages/CorporatePortalPage').then(m => ({ default: m.CorporatePortalPage })));
const LiveSessionPlayerPage = lazy(() => import('./pages/LiveSessionPlayerPage').then(m => ({ default: m.LiveSessionPlayerPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage').then(m => ({ default: m.AdminCoursesPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminCertificatesPage = lazy(() => import('./pages/admin/AdminCertificatesPage').then(m => ({ default: m.AdminCertificatesPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));
const AdminLiveSessionsPage = lazy(() => import('./pages/admin/AdminLiveSessionsPage').then(m => ({ default: m.AdminLiveSessionsPage })));
const AdminNewsPage = lazy(() => import('./pages/admin/AdminNewsPage').then(m => ({ default: m.AdminNewsPage })));
const AdminLessonEditorPage = lazy(() => import('./pages/admin/AdminLessonEditorPage').then(m => ({ default: m.AdminLessonEditorPage })));
const NewsPage = lazy(() => import('./pages/NewsPage').then(m => ({ default: m.NewsPage })));
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage').then(m => ({ default: m.PaymentResultPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const ForumDashboardPage = lazy(() => import('./pages/ForumDashboardPage').then(m => ({ default: m.ForumDashboardPage })));
const CourseForumPage = lazy(() => import('./pages/CourseForumPage').then(m => ({ default: m.CourseForumPage })));
const TopicDetailPage = lazy(() => import('./pages/TopicDetailPage').then(m => ({ default: m.TopicDetailPage })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="font-display font-bold text-sm uppercase tracking-wide text-gray-500">Carregando…</p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<NewsPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Public Course Pages */}
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId/player"
            element={
              <ProtectedRoute>
                <CoursePlayerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificates"
            element={
              <ProtectedRoute>
                <CertificatesPage />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute>
                <AdminCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/certificates"
            element={
              <ProtectedRoute>
                <AdminCertificatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Portal Corporativo (antiga Aula Ao Vivo) */}
          <Route path="/portal-corporativo" element={<CorporatePortalPage />} />

          {/* Admin Lesson Editor */}
          <Route
            path="/admin/lessons/:lessonId/edit"
            element={
              <ProtectedRoute>
                <AdminLessonEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Admin News */}
          <Route
            path="/admin/news"
            element={
              <ProtectedRoute>
                <AdminNewsPage />
              </ProtectedRoute>
            }
          />

          {/* Payment Results */}
          <Route path="/payment/:status" element={<PaymentResultPage />} />

          {/* Forum Routes */}
          <Route
            path="/forum"
            element={
              <ProtectedRoute>
                <ForumDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forum/:courseId"
            element={
              <ProtectedRoute>
                <CourseForumPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forum/:courseId/topic/:topicId"
            element={
              <ProtectedRoute>
                <TopicDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Live Session Player */}
          <Route path="/live/:sessionId" element={<LiveSessionPlayerPage />} />
          <Route
            path="/admin/live-sessions"
            element={
              <ProtectedRoute>
                <AdminLiveSessionsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

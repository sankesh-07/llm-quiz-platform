import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import LearningMode from './pages/student/LearningMode';
import ContestsPage from './pages/student/ContestsPage';
import AnalyticsPage from './pages/student/AnalyticsPage';
import SubmissionsPage from './pages/student/SubmissionsPage';
import QuizPage from './pages/student/QuizPage';
import TakeContest from './pages/student/TakeContest';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateContest from './pages/admin/CreateContest';
import ContestManagement from './pages/admin/ContestManagement';

// Parent pages
import ParentDashboard from './pages/parent/ParentDashboard';

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">LLM Quiz Platform</h1>
        <p className="text-xl text-gray-600 mb-8">Practice, Compete, and Excel</p>
        <div className="space-x-4">
          <a
            href="/login"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 inline-block"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium border-2 border-indigo-600 hover:bg-indigo-50 inline-block"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}

function HomeWithRedirect() {
  try {
    const { isAuthenticated, user } = useAuth();
    
    if (isAuthenticated && user) {
      return <Navigate to={`/${user.role}/dashboard`} replace />;
    }
  } catch (error) {
    // If auth context not ready, just show home
    console.log('Auth not ready yet, showing home page');
  }
  
  return <Home />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeWithRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <StudentDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/learning"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <LearningMode />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/contests"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <ContestsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/contests/:id"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <div className="px-4 py-6">Contest Details - Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/contests/:id/take"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <TakeContest />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/analytics"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <AnalyticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/submissions"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <SubmissionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/submissions/:id"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <div className="px-4 py-6">Submission Details - Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz/:quizId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <QuizPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contests"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contests/create"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <CreateContest />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contests/:id"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <ContestManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Parent Routes */}
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <Layout>
              <ParentDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

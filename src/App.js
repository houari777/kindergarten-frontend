import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChildrenList from './pages/ChildrenList';
import UsersList from './pages/UsersList';
import ClassesList from './pages/ClassesList';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ChildReports from './pages/ChildReports';
import Footer from './components/Footer';
import Bills from './pages/Bills';
import Notifications from './pages/Notifications';
import TeachersList from './pages/TeachersList';
import Unauthorized from './pages/Unauthorized';
import { AuthProvider } from 'contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <div style={{ flex: 1 }}>
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes with role-based access */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Admin-only routes */}
            <Route path="/users" element={
              <ProtectedRoute requiredRole="admin">
                <UsersList />
              </ProtectedRoute>
            } />
            
            <Route path="/teachers" element={
              <ProtectedRoute requiredRole="admin">
                <TeachersList />
              </ProtectedRoute>
            } />
            
            <Route path="/classes" element={
              <ProtectedRoute requiredRole="admin">
                <ClassesList />
              </ProtectedRoute>
            } />
            
            {/* Shared routes for admin and teachers */}
            <Route path="/children" element={
              <ProtectedRoute requiredRole={["admin", "teacher"]}>
                <ChildrenList />
              </ProtectedRoute>
            } />
            
            <Route path="/reports/:childId" element={
              <ProtectedRoute requiredRole={["admin", "teacher"]}>
                <ChildReports />
              </ProtectedRoute>
            } />
            
            <Route path="/bills" element={
              <ProtectedRoute requiredRole={["admin", "teacher"]}>
                <Bills />
              </ProtectedRoute>
            } />
            
            <Route path="/notifications" element={
              <ProtectedRoute requiredRole={["admin", "teacher"]}>
                <Notifications />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    );
  }

export default App;

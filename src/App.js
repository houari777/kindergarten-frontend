import logo from './logo.svg';
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

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* لاحقًا: صفحات أخرى */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/children" element={<ProtectedRoute><ChildrenList /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UsersList /></ProtectedRoute>} />
            <Route path="/classes" element={<ProtectedRoute><ClassesList /></ProtectedRoute>} />
            <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/reports/:childId" element={<ProtectedRoute><ChildReports /></ProtectedRoute>} />
          </Routes>
        </div>
        <Footer />
    </div>
    </Router>
  );
}

export default App;

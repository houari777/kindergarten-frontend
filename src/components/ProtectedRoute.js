import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import PropTypes from 'prop-types';

function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, loading, isAuthenticated, isAdmin, isTeacher } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being checked
  if (loading || currentUser === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole) {
    // If requiredRole is an array, check if user has one of the required roles
    if (Array.isArray(requiredRole)) {
      const hasRequiredRole = requiredRole.some(role => {
        if (role === 'admin') return isAdmin;
        if (role === 'teacher') return isTeacher;
        return false;
      });

      if (!hasRequiredRole) {
        return <Navigate to="/unauthorized" replace />;
      }
    } 
    // If requiredRole is a string, check for exact match
    else {
      if ((requiredRole === 'admin' && !isAdmin) || 
          (requiredRole === 'teacher' && !isTeacher)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.oneOfType([
    PropTypes.oneOf(['admin', 'teacher']),
    PropTypes.arrayOf(PropTypes.oneOf(['admin', 'teacher']))
  ])
};

export default ProtectedRoute;
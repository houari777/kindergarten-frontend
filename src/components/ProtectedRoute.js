import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { Spin, message } from 'antd';

function ProtectedRoute({ children, requiredRole }) {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      try {
        // Verify token and get user data
        const response = await api.get('/auth/me', token);
        console.log('User data from /auth/me:', response);
        
        if (response.success) {
          const user = response.user;
          setUserRole(user.role);
          
          // If no specific role is required, allow access
          if (!requiredRole) {
            setIsAuthorized(true);
          } 
          // If requiredRole is an array, check if user's role is in the array
          else if (Array.isArray(requiredRole)) {
            if (requiredRole.includes(user.role)) {
              setIsAuthorized(true);
            } else {
              console.log(`Access denied. Required one of roles: ${requiredRole.join(', ')}, User role: ${user.role}`);
              setIsAuthorized(false);
            }
          } 
          // If requiredRole is a string, check for exact match
          else if (user.role === requiredRole) {
            setIsAuthorized(true);
          } else {
            console.log(`Access denied. Required role: ${requiredRole}, User role: ${user.role}`);
            setIsAuthorized(false);
          }
        } else {
          console.error('Error verifying token:', response.message);
          message.error('Session expired. Please log in again.');
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        message.error('Error verifying your session. Please try again.');
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token, requiredRole]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Verifying your session..." />
      </div>
    );
  }

  if (!isAuthorized) {
    // If user is logged in but doesn't have the required role, show unauthorized
    if (token && userRole) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
    // If not logged in, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
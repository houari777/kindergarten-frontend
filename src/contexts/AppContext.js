import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getCurrentUser } from '../firebase/auth';

export const AppContext = createContext();

export const useApp = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        try {
          // Get additional user data from Firestore
          const userData = await getCurrentUser();
          if (userData) {
            setCurrentUser(userData);
            setUserRole(userData.role || 'user');
            setIsAdmin(userData.role === 'admin');
            setIsTeacher(userData.role === 'teacher');
          } else {
            // If no additional user data, set basic user info
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              role: 'user'
            });
            setUserRole('user');
            setIsAdmin(false);
            setIsTeacher(false);
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          setCurrentUser(null);
          setUserRole(null);
          setIsAdmin(false);
          setIsTeacher(false);
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        setUserRole(null);
        setIsAdmin(false);
        setIsTeacher(false);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Check if user has required role
  const hasRole = (requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!userRole) return false;
    return requiredRoles.includes(userRole);
  };

  const value = {
    currentUser,
    userRole,
    isAdmin,
    isTeacher,
    isAuthenticated: !!currentUser,
    loading,
    hasRole
  };

  return (
    <AppContext.Provider value={value}>
      {!loading && children}
    </AppContext.Provider>
  );
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      setCurrentUser(user);
      
      if (user) {
        try {
          console.log('Fetching user role from Firestore for uid:', user.uid);
          console.log('User email:', user.email);
          
          // First try to get user document by UID
          const userDocByUid = await getDoc(doc(db, 'users', user.uid));
          
          if (userDocByUid.exists()) {
            const userData = userDocByUid.data();
            console.log('User data found by UID:', userData);
            setUserRole(userData.role || 'user');
          } else {
            console.log('No user document found by UID, trying to find by email...');
            
            // Try to find user by email
            const usersQuery = query(collection(db, 'users'), where('email', '==', user.email));
            const querySnapshot = await getDocs(usersQuery);
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              const userData = userDoc.data();
              console.log('User data found by email:', userData);
              setUserRole(userData.role || 'user');
            } else {
              console.log('No user document found by email either, setting default role');
              setUserRole('admin'); // Default role for testing
            }
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('admin'); // Fallback role for testing
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    isAuthenticated: !!currentUser,
    isAdmin: userRole === 'admin',
    isTeacher: userRole === 'teacher',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

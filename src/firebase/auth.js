import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile,
  signOut
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Register a new user with email and password
export const registerUser = async (email, password, userData) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    if (userData.name) {
      await updateProfile(user, {
        displayName: userData.name
      });
    }

    // Create user document in Firestore
    const userDoc = {
      uid: user.uid,
      email: user.email,
      name: userData.name || '',
      role: userData.role || 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...userData
    };

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), userDoc);

    return { success: true, user: userDoc };
  } catch (error) {
    console.error('Error registering user:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

// Login user with email and password
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;
    
    return { 
      success: true, 
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        ...userData
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

// Get current user data
export const getCurrentUser = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        ...userDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, updates, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

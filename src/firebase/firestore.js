import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './config';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  CHILDREN: 'children',
  CLASSES: 'classes',
  BILLS: 'bills',
  NOTIFICATIONS: 'notifications',
  TEACHERS: 'teachers'
};

// Generic CRUD operations
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.error('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

export const getDocuments = async (collectionName, conditions = []) => {
  try {
    let q = collection(db, collectionName);
    
    // Apply conditions if any
    if (conditions.length > 0) {
      q = query(q, ...conditions);
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
};

export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
};

export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
    return { id: docId, ...data };
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Specific collection operations
export const usersApi = {
  getUsers: () => getDocuments(COLLECTIONS.USERS),
  getUser: (userId) => getDocument(COLLECTIONS.USERS, userId),
  addUser: (userData) => addDocument(COLLECTIONS.USERS, userData),
  updateUser: (userId, userData) => updateDocument(COLLECTIONS.USERS, userId, userData),
  deleteUser: (userId) => deleteDocument(COLLECTIONS.USERS, userId),
  getUserByEmail: async (email) => {
    const q = query(collection(db, COLLECTIONS.USERS), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  }
};

export const childrenApi = {
  getChildren: () => getDocuments(COLLECTIONS.CHILDREN),
  getChild: (childId) => getDocument(COLLECTIONS.CHILDREN, childId),
  addChild: (childData) => addDocument(COLLECTIONS.CHILDREN, childData),
  updateChild: (childId, childData) => updateDocument(COLLECTIONS.CHILDREN, childId, childData),
  deleteChild: (childId) => deleteDocument(COLLECTIONS.CHILDREN, childId)
};

export const classesApi = {
  getClasses: () => getDocuments(COLLECTIONS.CLASSES),
  getClass: (classId) => getDocument(COLLECTIONS.CLASSES, classId),
  addClass: (classData) => addDocument(COLLECTIONS.CLASSES, classData),
  updateClass: (classId, classData) => updateDocument(COLLECTIONS.CLASSES, classId, classData),
  deleteClass: (classId) => deleteDocument(COLLECTIONS.CLASSES, classId)
};

export const billsApi = {
  getBills: () => getDocuments(COLLECTIONS.BILLS),
  getBill: (billId) => getDocument(COLLECTIONS.BILLS, billId),
  addBill: (billData) => addDocument(COLLECTIONS.BILLS, billData),
  updateBill: (billId, billData) => updateDocument(COLLECTIONS.BILLS, billId, billData),
  deleteBill: (billId) => deleteDocument(COLLECTIONS.BILLS, billId)
};

export const notificationsApi = {
  getNotifications: () => getDocuments(COLLECTIONS.NOTIFICATIONS),
  getNotification: (notificationId) => getDocument(COLLECTIONS.NOTIFICATIONS, notificationId),
  addNotification: (notificationData) => addDocument(COLLECTIONS.NOTIFICATIONS, notificationData),
  updateNotification: (notificationId, notificationData) => 
    updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, notificationData),
  deleteNotification: (notificationId) => deleteDocument(COLLECTIONS.NOTIFICATIONS, notificationId)
};

export const teachersApi = {
  getTeachers: () => getDocuments(COLLECTIONS.TEACHERS),
  getTeacher: (teacherId) => getDocument(COLLECTIONS.TEACHERS, teacherId),
  addTeacher: (teacherData) => addDocument(COLLECTIONS.TEACHERS, teacherData),
  updateTeacher: (teacherId, teacherData) => updateDocument(COLLECTIONS.TEACHERS, teacherId, teacherData),
  deleteTeacher: (teacherId) => deleteDocument(COLLECTIONS.TEACHERS, teacherId)
};

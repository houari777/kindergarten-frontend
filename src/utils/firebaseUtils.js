import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  serverTimestamp
} from 'firebase/firestore';
import { db } from 'firebase/config';

/**
 * Generic function to get a document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} - Document data or null if not found
 */
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.warn(`No document found with ID: ${docId} in collection: ${collectionName}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting document ${docId} from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to get all documents from a collection with optional filters
 * @param {string} collectionName - Name of the collection
 * @param {Array} conditions - Array of where conditions
 * @param {string} orderByField - Field to order by
 * @param {string} orderDirection - 'asc' or 'desc'
 * @param {number} pageSize - Number of documents per page
 * @param {DocumentSnapshot} lastVisible - Last document from previous page for pagination
 * @returns {Promise<{data: Array, lastVisible: DocumentSnapshot}>} - Array of documents and last visible document
 */
export const getDocuments = async (
  collectionName, 
  conditions = [], 
  orderByField = 'createdAt', 
  orderDirection = 'desc',
  pageSize = 10,
  lastVisible = null
) => {
  try {
    let q = collection(db, collectionName);
    
    // Apply conditions
    conditions.forEach(condition => {
      q = query(q, where(...condition));
    });
    
    // Apply ordering
    q = query(q, orderBy(orderByField, orderDirection));
    
    // Apply pagination
    if (pageSize) {
      q = query(q, limit(pageSize));
    }
    
    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }
    
    const querySnapshot = await getDocs(q);
    const data = [];
    
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      data,
      lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null
    };
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to add a document to a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document data
 * @returns {Promise<Object>} - The created document with ID
 */
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to update a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>} - The updated document
 */
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    return { id: docId, ...data };
  } catch (error) {
    console.error(`Error updating document ${docId} in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to delete a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<boolean>} - True if successful
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return true;
  } catch (error) {
    console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Get a document by a specific field
 * @param {string} collectionName - Name of the collection
 * @param {string} field - Field name to search by
 * @param {*} value - Value to search for
 * @returns {Promise<Object|null>} - Document data or null if not found
 */
export const getDocumentByField = async (collectionName, field, value) => {
  try {
    const q = query(
      collection(db, collectionName),
      where(field, '==', value),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting document by ${field} from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Check if a document exists with the given field value
 * @param {string} collectionName - Name of the collection
 * @param {string} field - Field name to check
 * @param {*} value - Value to check for
 * @returns {Promise<boolean>} - True if document exists, false otherwise
 */
export const documentExists = async (collectionName, field, value) => {
  try {
    const doc = await getDocumentByField(collectionName, field, value);
    return doc !== null;
  } catch (error) {
    console.error(`Error checking if document exists in ${collectionName}:`, error);
    throw error;
  }
};

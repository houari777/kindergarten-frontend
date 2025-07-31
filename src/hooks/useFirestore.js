import { useState, useEffect, useCallback } from 'react';
import { 
  getDocument, 
  getDocuments, 
  addDocument, 
  updateDocument, 
  deleteDocument,
  getDocumentByField
} from '../utils/firebaseUtils';

/**
 * Custom hook for fetching a single document from Firestore
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID (null if not yet available)
 * @param {boolean} subscribe - Whether to subscribe to real-time updates (default: false)
 * @returns {Object} - { data, loading, error, refresh }
 */
export const useDocument = (collectionName, docId, subscribe = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const docData = await getDocument(collectionName, docId);
      setData(docData);
    } catch (err) {
      console.error(`Error fetching document ${docId} from ${collectionName}:`, err);
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [collectionName, docId]);

  // Initial fetch
  useEffect(() => {
    fetchData();
    
    // TODO: Implement real-time subscription if needed
    // if (subscribe && docId) {
    //   const unsubscribe = onSnapshot(doc(db, collectionName, docId), 
    //     (doc) => {
    //       if (doc.exists()) {
    //         setData({ id: doc.id, ...doc.data() });
    //       } else {
    //         setData(null);
    //       }
    //       setLoading(false);
    //     },
    //     (err) => {
    //       console.error('Error subscribing to document:', err);
    //       setError(err);
    //       setLoading(false);
    //     }
    //   );
    //   return () => unsubscribe();
    // }
  }, [collectionName, docId, fetchData, subscribe]);

  return { data, loading, error, refresh: fetchData };
};

/**
 * Custom hook for querying multiple documents from Firestore
 * @param {string} collectionName - Name of the collection
 * @param {Array} conditions - Array of where conditions
 * @param {string} orderByField - Field to order by
 * @param {string} orderDirection - 'asc' or 'desc'
 * @param {number} pageSize - Number of documents per page
 * @param {boolean} loadOnMount - Whether to load data when component mounts
 * @returns {Object} - { data, loading, error, loadMore, refreshing, refresh, hasMore }
 */
export const useCollection = (
  collectionName, 
  conditions = [], 
  orderByField = 'createdAt', 
  orderDirection = 'desc',
  pageSize = 10,
  loadOnMount = true
) => {
  const [data, setData] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(loadOnMount);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
        setData([]);
        setLastVisible(null);
        setHasMore(true);
      } else if (!loading) {
        setLoading(true);
      }

      const { data: newData, lastVisible: newLastVisible } = await getDocuments(
        collectionName,
        conditions,
        orderByField,
        orderDirection,
        pageSize,
        isRefreshing ? null : lastVisible
      );

      setData(prevData => isRefreshing ? newData : [...prevData, ...newData]);
      setLastVisible(newLastVisible);
      setHasMore(newData.length === pageSize);
      setError(null);
    } catch (err) {
      console.error(`Error fetching documents from ${collectionName}:`, err);
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [collectionName, conditions, orderByField, orderDirection, pageSize, lastVisible, loading]);

  // Initial load
  useEffect(() => {
    if (loadOnMount) {
      loadData(true);
    }
  }, [loadOnMount, loadData]);

  const refresh = () => loadData(true);
  const loadMore = () => {
    if (!loading && hasMore) {
      loadData(false);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    loadMore, 
    refreshing, 
    refresh, 
    hasMore 
  };
};

/**
 * Custom hook for CRUD operations on a collection
 * @param {string} collectionName - Name of the collection
 * @returns {Object} - { add, update, remove, loading, error }
 */
export const useCrud = (collectionName) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const add = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await addDocument(collectionName, data);
      return result;
    } catch (err) {
      console.error(`Error adding document to ${collectionName}:`, err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const update = useCallback(async (docId, data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateDocument(collectionName, docId, data);
      return result;
    } catch (err) {
      console.error(`Error updating document ${docId} in ${collectionName}:`, err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const remove = useCallback(async (docId) => {
    setLoading(true);
    setError(null);
    try {
      await deleteDocument(collectionName, docId);
      return true;
    } catch (err) {
      console.error(`Error deleting document ${docId} from ${collectionName}:`, err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  return { add, update, remove, loading, error };
};

/**
 * Custom hook for searching documents by a specific field
 * @param {string} collectionName - Name of the collection
 * @param {string} field - Field name to search by
 * @param {string} value - Value to search for
 * @param {boolean} loadOnMount - Whether to load data when component mounts
 * @returns {Object} - { data, loading, error, search }
 */
export const useSearch = (collectionName, field, initialValue = '', loadOnMount = false) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(loadOnMount);
  const [error, setError] = useState(null);

  const search = useCallback(async (term) => {
    setSearchTerm(term);
    
    if (!term || term.trim() === '') {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getDocumentByField(collectionName, field, term);
      setData(result);
    } catch (err) {
      console.error(`Error searching ${collectionName} by ${field}:`, err);
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [collectionName, field]);

  // Initial search if loadOnMount is true and there's an initial value
  useEffect(() => {
    if (loadOnMount && initialValue) {
      search(initialValue);
    }
  }, [loadOnMount, initialValue, search]);

  return { 
    data, 
    loading, 
    error, 
    searchTerm,
    search,
    setSearchTerm
  };
};

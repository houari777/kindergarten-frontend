import { 
  getDocument, 
  getDocuments, 
  addDocument, 
  updateDocument, 
  deleteDocument,
  getDocumentByField
} from './firebaseUtils';

/**
 * Firebase-based API client that mimics the existing REST API interface
 * This allows us to replace the backend with minimal changes to the frontend code
 */
const api = {
  /**
   * Get a document or collection from Firestore
   * @param {string} endpoint - The endpoint to fetch from (e.g., '/users/123' or '/users')
   * @returns {Promise<Object>} - The response data
   */
  get: async (endpoint) => {
    try {
      // Handle different endpoint patterns
      const parts = endpoint.split('/').filter(part => part);
      
      // If endpoint is like '/users/123'
      if (parts.length === 2) {
        const [collection, docId] = parts;
        const doc = await getDocument(collection, docId);
        return { success: true, data: doc };
      } 
      // If endpoint is like '/users'
      else if (parts.length === 1) {
        const [collection] = parts;
        const { data } = await getDocuments(collection);
        return { success: true, data };
      }
      
      throw new Error(`Invalid endpoint: ${endpoint}`);
    } catch (error) {
      console.error(`API GET ${endpoint} error:`, error);
      return { 
        success: false, 
        error: error.message,
        code: error.code
      };
    }
  },

  /**
   * Create a new document in a collection
   * @param {string} endpoint - The endpoint to post to (e.g., '/users')
   * @param {Object} data - The data to post
   * @returns {Promise<Object>} - The created document
   */
  post: async (endpoint, data) => {
    try {
      const parts = endpoint.split('/').filter(part => part);
      
      if (parts.length !== 1) {
        throw new Error(`Invalid endpoint for POST: ${endpoint}`);
      }
      
      const [collection] = parts;
      const result = await addDocument(collection, data);
      
      return { 
        success: true, 
        data: result,
        message: 'Document created successfully'
      };
    } catch (error) {
      console.error(`API POST ${endpoint} error:`, error);
      return { 
        success: false, 
        error: error.message,
        code: error.code
      };
    }
  },

  /**
   * Update an existing document
   * @param {string} endpoint - The endpoint to update (e.g., '/users/123')
   * @param {Object} data - The data to update
   * @returns {Promise<Object>} - The updated document
   */
  put: async (endpoint, data) => {
    try {
      const parts = endpoint.split('/').filter(part => part);
      
      if (parts.length !== 2) {
        throw new Error(`Invalid endpoint for PUT: ${endpoint}`);
      }
      
      const [collection, docId] = parts;
      const result = await updateDocument(collection, docId, data);
      
      return { 
        success: true, 
        data: result,
        message: 'Document updated successfully'
      };
    } catch (error) {
      console.error(`API PUT ${endpoint} error:`, error);
      return { 
        success: false, 
        error: error.message,
        code: error.code
      };
    }
  },

  /**
   * Delete a document
   * @param {string} endpoint - The endpoint to delete (e.g., '/users/123')
   * @returns {Promise<Object>} - Success/failure status
   */
  delete: async (endpoint) => {
    try {
      const parts = endpoint.split('/').filter(part => part);
      
      if (parts.length !== 2) {
        throw new Error(`Invalid endpoint for DELETE: ${endpoint}`);
      }
      
      const [collection, docId] = parts;
      await deleteDocument(collection, docId);
      
      return { 
        success: true, 
        message: 'Document deleted successfully'
      };
    } catch (error) {
      console.error(`API DELETE ${endpoint} error:`, error);
      return { 
        success: false, 
        error: error.message,
        code: error.code
      };
    }
  },
  
  /**
   * Search for documents by field value
   * @param {string} collection - The collection to search in
   * @param {string} field - The field to search by
   * @param {string} value - The value to search for
   * @returns {Promise<Object>} - The search results
   */
  search: async (collection, field, value) => {
    try {
      const doc = await getDocumentByField(collection, field, value);
      return { 
        success: true, 
        data: doc,
        exists: !!doc
      };
    } catch (error) {
      console.error(`Search error in ${collection} by ${field}:`, error);
      return { 
        success: false, 
        error: error.message,
        code: error.code
      };
    }
  }
};

export default api;

import { storage } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Upload a file to Firebase Storage
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return {
      success: true,
      url: downloadURL,
      path: snapshot.ref.fullPath,
      name: file.name,
      type: file.type,
      size: file.size
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Get download URL for a file
export const getFileUrl = async (filePath) => {
  try {
    const fileRef = ref(storage, filePath);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

// Delete a file from Firebase Storage
export const deleteFile = async (filePath) => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Upload a user profile picture
export const uploadProfilePicture = async (userId, file) => {
  const fileExt = file.name.split('.').pop();
  const path = `profile_pictures/${userId}.${fileExt}`;
  return await uploadFile(file, path);
};

// Upload a child's photo
export const uploadChildPhoto = async (childId, file) => {
  const fileExt = file.name.split('.').pop();
  const path = `children_photos/${childId}.${fileExt}`;
  return await uploadFile(file, path);
};

// Upload a document
export const uploadDocument = async (folder, documentId, file) => {
  const fileExt = file.name.split('.').pop();
  const path = `${folder}/${documentId}.${fileExt}`;
  return await uploadFile(file, path);
};

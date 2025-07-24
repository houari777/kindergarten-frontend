require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const https = require('https');
const multer = require('multer');
const path = require('path');

// Initialize Firebase Admin SDK
try {
  const serviceAccount = {
    "type": "service_account",
    "project_id": "kindergarten-app-b106d",
    "private_key_id": "c284f9411490d4a681837f517cbb9ec8209213dc",
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": "firebase-adminsdk-fbsvc@kindergarten-app-b106d.iam.gserviceaccount.com",
    "client_id": "111678662405345395385",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40kindergarten-app-b106d.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://kindergarten-app-b106d.firebaseio.com"
  });
  
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, and PNG files are allowed.'));
    }
  }
});

// Initialize Express app
const app = express();

// Middleware for parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:19006',
  'https://kindergarten-frontend.onrender.com',
  'https://kindergarten-backend-s82q.onrender.com',
  /^https?:\/\/kindergarten-[a-z0-9-]+\.onrender\.com$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/\d+\.\d+\.\d+\.\d+(:\d+)?$/, // Allow IP addresses
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('Allowing request with no origin');
      return callback(null, true);
    }

    // Allow all in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Allowing all origins in development. Origin: ${origin}`);
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.some(pattern =>
        typeof pattern === 'string'
            ? origin === pattern
            : pattern.test(origin)
    )) {
      console.log(`Allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin} is not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-Access-Token',
    'X-Refresh-Token'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Add CORS headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, X-Access-Token, X-Refresh-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
// Handle preflight requests
app.options('*', cors(corsOptions));

// Add CORS headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.some(pattern => 
    typeof pattern === 'string' 
      ? origin === pattern 
      : pattern.test(origin)
  )) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// JWT Secret configuration
const JWT_SECRET = process.env.JWT_SECRET || 'kindergarten_app_secure_jwt_secret_2023';

// Verify JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set in environment variables. Using default secret.');
}

// إعداد firebase-admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
  serviceAccount = require('./serviceAccountKey.json');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.get('/', (req, res) => {
  res.send('Kindergarten backend is running!');
});

// اختبار الاتصال بـ Firestore
app.get('/api/test-firestore', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('children').get();
    const children = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, children });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Secure admin creation endpoint (temporary - remove after use)
app.post('/api/create-admin', async (req, res) => {
  try {
    const { secret_key, email, password, name } = req.body;
    
    // Verify the secret key (change this to a strong secret in production)
    if (secret_key !== 'kindergarten_admin_2023') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check if user already exists
    const existingUser = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .get();

    if (!existingUser.empty) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Create admin user
    const newAdmin = {
      name: name || 'Admin User',
      email,
      password, // In a real app, you should hash this password
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore().collection('users').add(newAdmin);
    
    res.json({ 
      success: true, 
      message: 'Admin user created successfully',
      user: { email, role: 'admin' }
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating admin user',
      error: error.message 
    });
  }
});


// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  console.log('Login request received:', {
    headers: req.headers,
    body: {
      ...req.body,
      password: req.body.password ? '[REDACTED]' : 'undefined'
    }
  });

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toString().toLowerCase().trim();
    console.log('Looking up user with email:', normalizedEmail);
    
    try {
      // Find user by email (case-insensitive)
      const snapshot = await admin.firestore()
        .collection('users')
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log('No user found with email:', normalizedEmail);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      const userDoc = snapshot.docs[0];
      const user = { 
        id: userDoc.id, 
        ...userDoc.data(),
        // Don't send password back to client
        password: undefined
      };

      console.log('Found user:', {
        id: user.id,
        email: user.email,
        role: user.role
      });

      // In a real app, verify password with bcrypt
      if (!userDoc.data().password || userDoc.data().password !== password) {
        console.log('Password mismatch or missing password');
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      // Generate JWT token with user ID
      const tokenPayload = { 
        userId: userDoc.id,
        email: user.email, 
        role: user.role || 'parent' 
      };

      console.log('Generating token with payload:', tokenPayload);
      
      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      console.log('Login successful for user:', user.email);
      
      res.json({ 
        success: true, 
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        }
      });

    } catch (dbError) {
      console.error('Database error during login:', dbError);
      res.status(500).json({ 
        success: false, 
        message: 'Database error during login',
        error: dbError.message 
      });
    }

  } catch (error) {
    console.error('Unexpected error in login endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An unexpected error occurred during login',
      error: error.message 
    });
  }
});

// Temporary endpoint to reset admin password (for testing only)
app.post('/api/debug/reset-admin-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and new password are required' 
      });
    }
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user by email
    const snapshot = await admin.firestore()
      .collection('users')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const userDoc = snapshot.docs[0];
    
    // Update the password
    await admin.firestore()
      .collection('users')
      .doc(userDoc.id)
      .update({ 
        password: newPassword,
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });
    
    res.json({ 
      success: true, 
      message: 'Password updated successfully',
      userId: userDoc.id
    });
    
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error resetting password',
      error: error.message 
    });
  }
});

// Get current user's information
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching user data for:', req.user);
    
    // Get user data from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(req.user.userId)
      .get();
    
    if (!userDoc.exists) {
      console.log('User not found in database');
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const user = userDoc.data();
    
    // Remove sensitive data
    delete user.password;
    
    res.json({ 
      success: true, 
      user: {
        id: userDoc.id,
        ...user
      }
    });
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user data',
      error: error.message 
    });
  }
});

// User registration endpoint
app.post('/api/auth/signup', upload.single('idImage'), async (req, res) => {
  try {
    console.log('Signup body:', req.body); // Ajout du log pour debug
    const { name, email, phone, password, confirmPassword, role, fromTeachersPage } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'جميع الحقول مطلوبة' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'كلمة المرور غير متطابقة' 
      });
    }

    // Check if user already exists
    const existingUser = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .get();

    if (!existingUser.empty) {
      return res.status(400).json({ 
        success: false, 
        message: 'هذا البريد الإلكتروني مسجل مسبقاً' 
      });
    }

    // Handle file upload if exists
    let idImageUrl = '';
    if (req.file) {
      idImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    // Forcer le rôle teacher si la requête vient de la page des enseignants
    if (fromTeachersPage === true || fromTeachersPage === 'true') {
      userRole = 'teacher';
    } else if (role && role === 'admin' && req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role === 'admin') {
          userRole = 'admin';
          console.log('Admin authorization successful for user:', decoded.email);
        }
      } catch (e) {
        console.error('Error verifying admin token:', e);
      }
    } else if (role && (role === 'teacher' || role === 'staff')) {
      userRole = role;
    }

    // Create new user
    const newUser = {
      name,
      email,
      phone,
      password, // In a real app, hash the password with bcrypt
      idImage: idImageUrl,
      role: userRole,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const userRef = await admin.firestore().collection('users').add(newUser);
    const userId = userRef.id;

    // Generate JWT token
    const token = jwt.sign(
      { userId, email, role: userRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove sensitive data before sending response
    delete newUser.password;
    
    res.status(201).json({ 
      success: true, 
      token,
      user: { id: userId, ...newUser }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء إنشاء الحساب' 
    });
  }
});

// Middleware للتحقق من JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'الوصول مرفوض. يرجى تسجيل الدخول أولاً.' 
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'رمز الدخول غير صالح أو منتهي الصلاحية' 
      });
    }
    req.user = user;
    next();
  });
}

// Get current user's data
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    console.log('User from token:', req.user);
    const userId = req.user.userId;
    
    if (!userId) {
      console.error('No user ID in token');
      return res.status(400).json({ success: false, message: 'Invalid user ID in token' });
    }
    
    console.log('Fetching user with ID:', userId);
    
    // Get user from Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.error('User not found in Firestore');
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }
    
    const userData = userDoc.data();
    console.log('Found user data:', userData);
    
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User data is empty'
      });
    }
    
    // Create a clean user object without sensitive data
    const { password, ...safeUserData } = userData;
    
    res.json({
      success: true,
      user: {
        id: userDoc.id,
        ...safeUserData
      }
    });
    
  } catch (error) {
    console.error('Error in /api/users/me:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user data',
      error: error.message
    });
  }
});

// جلب جميع الأطفال مع دعم البحث والتصفية وربط ولي الأمر
app.get('/api/children', authenticateToken, async (req, res) => {
  try {
    const { name, classId, parentId } = req.query;
    let query = admin.firestore().collection('children');
    if (name) query = query.where('name', '==', name);
    if (classId) query = query.where('classId', '==', classId);
    if (parentId) query = query.where('parentIds', 'array-contains', parentId);
    const snapshot = await query.get();
    const children = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, children });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// عند إضافة طفل جديد: دعم parentIds
const processParentIds = (parentIds) => {
  if (!parentIds) return [];
  if (Array.isArray(parentIds)) return parentIds;
  if (typeof parentIds === 'string') return parentIds.split(',').map(id => id.trim()).filter(id => id);
  return [];
};

app.post('/api/children', authenticateToken, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'healthRecordImage', maxCount: 1 },
  { name: 'guardianAuthImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, age, classId, parentIds, health, healthRecordImageUrl, guardianAuthImageUrl } = req.body;
    
    if (!name || !age || !classId) {
      return res.status(400).json({ success: false, message: 'name, age, and classId are required.' });
    }

    // Process file uploads
    const files = req.files || {};
    const imageFile = files.image ? files.image[0] : null;
    const healthRecordFile = files.healthRecordImage ? files.healthRecordImage[0] : null;
    const guardianAuthFile = files.guardianAuthImage ? files.guardianAuthImage[0] : null;

    // In a real app, you would upload these files to a storage service (like Firebase Storage)
    // and get their URLs. For now, we'll use the URLs if provided in the request body
    const imageUrl = imageFile ? `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}` : (req.body.image || '');
    const healthRecordImage = healthRecordFile ? 
      `data:${healthRecordFile.mimetype};base64,${healthRecordFile.buffer.toString('base64')}` : 
      (healthRecordImageUrl || '');
    const guardianAuthImage = guardianAuthFile ? 
      `data:${guardianAuthFile.mimetype};base64,${guardianAuthFile.buffer.toString('base64')}` : 
      (guardianAuthImageUrl || '');

    const docRef = await admin.firestore().collection('children').add({
      name,
      age,
      classId,
      parentIds: processParentIds(parentIds),
      image: imageUrl,
      health: health || '',
      healthRecordImage,
      guardianAuthImage,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    res.status(201).json({ 
      success: true, 
      id: docRef.id,
      child: {
        id: docRef.id,
        name,
        age,
        classId,
        parentIds: processParentIds(parentIds),
        image: imageUrl,
        health: health || '',
        healthRecordImage,
        guardianAuthImage
      }
    });
  } catch (error) {
    console.error('Error adding child:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب طفل واحد (محمي)
app.get('/api/children/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('children').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Child not found' });
    }
    res.json({ success: true, child: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تعديل بيانات طفل: دعم parentIds
app.put('/api/children/:id', authenticateToken, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'healthRecordImage', maxCount: 1 },
  { name: 'guardianAuthImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, age, classId, parentIds, health, healthRecordImageUrl, guardianAuthImageUrl } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = age;
    if (classId !== undefined) updateData.classId = classId;
    if (parentIds !== undefined) updateData.parentIds = parentIds;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No data to update' });
    }
    await admin.firestore().collection('children').doc(req.params.id).update(updateData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// حذف طفل (محمي)
app.delete('/api/children/:id', authenticateToken, async (req, res) => {
  try {
    await admin.firestore().collection('children').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب أولياء الأمور المرتبطين بطفل معيّن
app.get('/api/children/:id/parents', authenticateToken, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('children').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Child not found' });
    }
    const { parentIds = [] } = doc.data();
    if (!parentIds.length) return res.json({ success: true, parents: [] });
    const usersSnapshot = await admin.firestore().collection('users').where(admin.firestore.FieldPath.documentId(), 'in', parentIds).get();
    const parents = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, parents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تحديث API المستخدمين لدعم البحث بالاسم والبريد الإلكتروني
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const { role, name, email } = req.query;
    let query = admin.firestore().collection('users');
    if (role) query = query.where('role', '==', role);
    if (name) query = query.where('name', '==', name);
    if (email) query = query.where('email', '==', email);
    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب مستخدم واحد
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('users').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تعديل بيانات مستخدم
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { name, role } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No data to update' });
    }
    await admin.firestore().collection('users').doc(req.params.id).update(updateData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// حذف مستخدم
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    await admin.firestore().collection('users').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تسجيل مستخدم جديد
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    if (!email || !password || !role || !name) {
      return res.status(400).json({ success: false, message: 'email, password, role, and name are required.' });
    }
    // تحقق إذا كان المستخدم موجود مسبقًا
    const existing = await admin.firestore().collection('users').where('email', '==', email).get();
    if (!existing.empty) {
      return res.status(400).json({ success: false, message: 'User already exists.' });
    }
    // حفظ المستخدم (ملاحظة: كلمة السر تُخزن هنا كنص عادي لأغراض تجريبية فقط، يجب تشفيرها في الإنتاج)
    const userRef = await admin.firestore().collection('users').add({
      email,
      password,
      role,
      name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ success: true, id: userRef.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ================== إندبوينتات الفواتير (bills) ==================

// جلب جميع الفواتير مع دعم التصفية
app.get('/api/bills', authenticateToken, async (req, res) => {
  try {
    const { childId, parentId, status } = req.query;
    let query = admin.firestore().collection('bills');
    if (childId) query = query.where('childId', '==', childId);
    if (parentId) query = query.where('parentId', '==', parentId);
    if (status) query = query.where('status', '==', status);
    const snapshot = await query.get();
    const bills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, bills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إنشاء فاتورة جديدة
app.post('/api/bills', authenticateToken, async (req, res) => {
  try {
    const { childId, parentId, amount, dueDate, status, paidAt, description } = req.body;
    if (!childId || !parentId || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: 'childId, parentId, amount, and dueDate are required.' });
    }
    const docRef = await admin.firestore().collection('bills').add({
      childId,
      parentId,
      amount,
      dueDate,
      status: status || 'unpaid',
      paidAt: paidAt || null,
      description: description || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب فاتورة واحدة
app.get('/api/bills/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('bills').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    res.json({ success: true, bill: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تعديل فاتورة
app.put('/api/bills/:id', authenticateToken, async (req, res) => {
  try {
    const { amount, dueDate, status, paidAt, description } = req.body;
    const updateData = {};
    if (amount !== undefined) updateData.amount = amount;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (status !== undefined) updateData.status = status;
    if (paidAt !== undefined) updateData.paidAt = paidAt;
    if (description !== undefined) updateData.description = description;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No data to update' });
    }
    await admin.firestore().collection('bills').doc(req.params.id).update(updateData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// حذف فاتورة
app.delete('/api/bills/:id', authenticateToken, async (req, res) => {
  try {
    await admin.firestore().collection('bills').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إرسال إشعار عبر FCM وتسجيله في Firestore
app.post('/api/notifications/send', authenticateToken, async (req, res) => {
  try {
    const { title, body, tokens } = req.body;
    if (!title || !body || !tokens || (Array.isArray(tokens) && tokens.length === 0)) {
      return res.status(400).json({ success: false, message: 'title, body, and tokens are required.' });
    }
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey) {
      return res.status(500).json({ success: false, message: 'FCM server key not configured.' });
    }
    const payload = {
      notification: { title, body },
      registration_ids: Array.isArray(tokens) ? tokens : [tokens],
    };
    const options = {
      hostname: 'fcm.googleapis.com',
      path: '/fcm/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=' + serverKey,
      },
    };
    const fcmResponse = await new Promise((resolve, reject) => {
      const reqFCM = https.request(options, (resFCM) => {
        let data = '';
        resFCM.on('data', (chunk) => { data += chunk; });
        resFCM.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data });
          }
        });
      });
      reqFCM.on('error', reject);
      reqFCM.write(JSON.stringify(payload));
      reqFCM.end();
    });
    // حفظ سجل الإشعار
    await admin.firestore().collection('notifications').add({
      title,
      body,
      tokens: Array.isArray(tokens) ? tokens : [tokens],
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      response: fcmResponse,
    });
    res.json({ success: true, fcmResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// === CLASSES API ===

// Obtenir toutes les classes
app.get('/api/classes', authenticateToken, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('classes').get();
    const classes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        childrenIds: Array.isArray(data.childrenIds) ? data.childrenIds : [],
        teacherIds: Array.isArray(data.teacherIds) ? data.teacherIds : [],
      };
    });
    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ajouter une classe
app.post('/api/classes', authenticateToken, async (req, res) => {
  try {
    const { name, description, teacher, childrenIds, teacherIds } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Le nom de la classe est requis.' });
    }
    const newClass = {
      name,
      description: description || '',
      teacher: teacher || '',
      childrenIds: Array.isArray(childrenIds) ? childrenIds : [],
      teacherIds: Array.isArray(teacherIds) ? teacherIds : (teacher ? [teacher] : []),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await admin.firestore().collection('classes').add(newClass);
    res.status(201).json({ success: true, id: docRef.id, class: { id: docRef.id, ...newClass } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Modifier une classe
app.put('/api/classes/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, teacher, childrenIds, teacherIds } = req.body;
    const updateData = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (teacher !== undefined) updateData.teacher = teacher;
    updateData.childrenIds = Array.isArray(childrenIds) ? childrenIds : [];
    updateData.teacherIds = Array.isArray(teacherIds) ? teacherIds : (teacher ? [teacher] : []);
    await admin.firestore().collection('classes').doc(req.params.id).update(updateData);

    // Synchroniser la relation avec les enfants (champ classId)
    if (Array.isArray(childrenIds)) {
      // Retirer la classe des enfants qui n'en font plus partie
      const allChildrenSnapshot = await admin.firestore().collection('children').where('classId', '==', req.params.id).get();
      const allChildrenInClass = allChildrenSnapshot.docs.map(doc => doc.id);
      const toRemove = allChildrenInClass.filter(id => !childrenIds.includes(id));
      for (const childId of toRemove) {
        await admin.firestore().collection('children').doc(childId).update({ classId: '' });
      }
      // Pour chaque enfant ajouté, s'assurer qu'il n'est dans aucune autre classe
      for (const childId of childrenIds) {
        // Chercher si l'enfant est déjà dans une autre classe
        const childDoc = await admin.firestore().collection('children').doc(childId).get();
        const childData = childDoc.data();
        if (childData && childData.classId && childData.classId !== req.params.id) {
          // Retirer l'enfant de l'ancienne classe (optionnel, ici on écrase simplement)
        }
        await admin.firestore().collection('children').doc(childId).update({ classId: req.params.id });
      }
    }

    // Synchroniser la relation avec l'enseignant (un seul enseignant par classe)
    if (Array.isArray(updateData.teacherIds) && updateData.teacherIds.length > 0) {
      const teacherId = updateData.teacherIds[0];
      // Retirer ce teacherId de toutes les autres classes
      const otherClassesSnapshot = await admin.firestore().collection('classes').where('teacherIds', 'array-contains', teacherId).get();
      for (const doc of otherClassesSnapshot.docs) {
        if (doc.id !== req.params.id) {
          const data = doc.data();
          const newTeacherIds = Array.isArray(data.teacherIds) ? data.teacherIds.filter(id => id !== teacherId) : [];
          await admin.firestore().collection('classes').doc(doc.id).update({ teacherIds: newTeacherIds });
        }
      }
    }

    res.json({ success: true, message: 'Classe mise à jour.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Supprimer une classe
app.delete('/api/classes/:id', authenticateToken, async (req, res) => {
  try {
    await admin.firestore().collection('classes').doc(req.params.id).delete();
    res.json({ success: true, message: 'Classe supprimée.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Récupérer les rapports d’un enfant
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.query;
    if (!childId) {
      return res.status(400).json({ success: false, message: 'childId is required' });
    }
    const snapshot = await admin.firestore().collection('reports')
      .where('childId', '==', childId)
      .get();
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Récupérer les rapports d’un enfant par son id (route RESTful)
app.get('/api/reports/:childId', authenticateToken, async (req, res) => {
  try {
    const childId = req.params.childId;
    const snapshot = await admin.firestore().collection('reports')
      .where('childId', '==', childId)
      .get();
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ajouter un rapport pour un enfant
app.post('/api/reports', authenticateToken, async (req, res) => {
  try {
    const { childId, date, type, content } = req.body;
    if (!childId || !date || !type || !content) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
    }
    const newReport = {
      childId,
      date,
      type,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await admin.firestore().collection('reports').add(newReport);
    res.status(201).json({ success: true, id: docRef.id, report: { id: docRef.id, ...newReport } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Générer une attestation d'inscription pour un enfant
app.get('/api/attestation/:childId', authenticateToken, async (req, res) => {
  try {
    const childId = req.params.childId;
    const doc = await admin.firestore().collection('children').doc(childId).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Child not found' });
    }
    const child = doc.data();
    // Exemple simple : retourner les infos de l'enfant sous forme d'attestation JSON
    // (Pour un vrai PDF, il faudrait utiliser une lib comme pdfkit ou jsPDF côté serveur)
    res.json({
      success: true,
      attestation: {
        childName: child.name,
        classId: child.classId,
        parentIds: child.parentIds,
        inscriptionDate: child.createdAt,
        message: `Attestation d'inscription pour l'enfant ${child.name}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 5001;
// Start server with enhanced error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kindergarten backend is running! Listening on port ${PORT}`);
  console.log(`Access the server at:`);
  console.log(`- http://localhost:${PORT}`);
  console.log(`- http://10.0.2.2:${PORT} (Android Emulator)`);
  console.log(`- http://10.8.0.121:${PORT} (Your local IP)`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop any other servers using this port.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});
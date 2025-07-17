require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const https = require('https');
const multer = require('multer');
const path = require('path');

const app = express();

// Configure CORS with specific options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // List of allowed origins (add your frontend URLs here)
    const allowedOrigins = [
      'http://localhost:3000',  // Dashboard frontend
      'http://localhost:19006', // Expo web
      'exp://10.0.2.2:19000',   // Android emulator
      'http://10.0.2.2:19006',  // Android emulator web
      'exp://127.0.0.1:19000',  // iOS simulator
      'http://127.0.0.1:19006', // iOS simulator web
      'http://10.8.0.121:8081', // Expo development server
      /^https?:\/\/localhost(:[0-9]+)?$/, // Any localhost with any port
      /^https?:\/\/10\.0\.2\.2(:[0-9]+)?$/, // Android emulator with any port
      /^https?:\/\/10\.8\.0\.121(:[0-9]+)?$/, // Development server with any port
    ];

    if (allowedOrigins.some(allowedOrigin => 
      typeof allowedOrigin === 'string' 
        ? origin === allowedOrigin 
        : allowedOrigin.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${req.ip} (${req.headers['user-agent']})`);
  next();
});

// Increase payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// إعداد firebase-admin
const serviceAccount = require('./serviceAccountKey.json');
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

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان' 
      });
    }

    // Find user by email
    const snapshot = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ 
        success: false, 
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
      });
    }

    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    // In a real app, verify password with bcrypt
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
      });
    }

    // Generate JWT token with user ID
    const tokenPayload = { 
      userId: userDoc.id, // Use the document ID as userId
      email: user.email, 
      role: user.role || 'parent' 
    };
    
    console.log('Generating token with payload:', tokenPayload);
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    // Remove sensitive data before sending response
    delete user.password;
    
    res.json({ 
      success: true, 
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء تسجيل الدخول' 
    });
  }
});

// User registration endpoint
app.post('/api/auth/signup', upload.single('idImage'), async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

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
      .limit(1)
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
      // In a real app, upload to Firebase Storage
      // For now, we'll just store the file data in the document
      idImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    // Create new user
    const newUser = {
      name,
      email,
      phone,
      password, // In a real app, hash the password with bcrypt
      idImage: idImageUrl,
      role: 'parent',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const userRef = await admin.firestore().collection('users').add(newUser);
    const userId = userRef.id;

    // Generate JWT token
    const token = jwt.sign(
      { userId, email, role: 'parent' },
      process.env.JWT_SECRET || 'your_jwt_secret',
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
  
  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
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

// تسجيل الدخول
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required.' });
    }
    const snapshot = await admin.firestore().collection('users').where('email', '==', email).get();
    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    const user = snapshot.docs[0].data();
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    // توليد JWT
    const token = jwt.sign({ email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ success: true, token });
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

const PORT = process.env.PORT || 5001;
// Start server with enhanced error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
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
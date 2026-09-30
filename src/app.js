const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation Setup (/api/swagger)
const { setupSwagger } = require('./config/swagger');
setupSwagger(app);

// Root route: serves the temporary interactive landing page for Alumni Network
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Hello route requested: displays "hello world"
app.get('/hello', (req, res) => {
  res.send('hello world');
});

// Dynamic name parameter route: displays "Hello, {name}"
app.get('/hello/:name', (req, res) => {
  res.send(`Hello, ${req.params.name}`);
});

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Alumni Network API is healthy and running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Sum route module from separate file
const sumRoutes = require('./routes/sum');
app.use('/sum', sumRoutes);

// About page route module from separate file
const aboutRoutes = require('./routes/about');
app.use('/about', aboutRoutes);

// Kalıcı Kullanıcı Veritabanı (JSON Dosya Depolama)
const DATA_FILE = path.join(__dirname, 'data', 'users.json');

function getUsers() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Kullanıcı verisi okunamadı:', err);
    return [];
  }
}

function saveUsers(usersList) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(usersList, null, 2), 'utf8');
  } catch (err) {
    console.error('Kullanıcı verisi kaydedilemedi:', err);
  }
}

// POST /api/users - Kullanıcı kaydetme (Kalıcı JSON dosyasına yazar)
app.post('/api/users', (req, res) => {
  const userData = req.body;

  // Body boş gönderildiyse uyarı ver
  if (!userData || Object.keys(userData).length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Lütfen kaydedilecek kullanıcı verilerini JSON body olarak gönderin.'
    });
  }

  const users = getUsers();
  // Yeni ID belirleme: Mevcut en yüksek ID + 1
  const maxId = users.reduce((max, u) => (u.id > max ? u.id : max), 0);

  const newUser = {
    id: maxId + 1,
    ...userData,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  return res.status(201).json({
    status: 'success',
    message: 'Kullanıcı başarıyla kaydedildi',
    user: newUser
  });
});

// GET /api/users - Kayıtlı kullanıcıları listeleme
app.get('/api/users', (req, res) => {
  const users = getUsers();
  return res.status(200).json({
    status: 'success',
    count: users.length,
    users: users
  });
});

// PATCH /api/users/:id - Kullanıcı güncelleme (Kısmi güncelleme)
app.patch('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const updateData = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Geçersiz kullanıcı ID formatı'
    });
  }

  // Gönderilen veri boş mu kontrol et
  if (!updateData || Object.keys(updateData).length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Lütfen güncellenecek alanları JSON body olarak gönderin.'
    });
  }

  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({
      status: 'fail',
      message: `ID'si ${userId} olan kullanıcı bulunamadı.`
    });
  }

  // Yalnızca gönderilen değişkenleri güncelle, ID'yi sabit tut
  users[userIndex] = {
    ...users[userIndex],
    ...updateData,
    id: userId,
    updatedAt: new Date().toISOString()
  };

  saveUsers(users);

  return res.status(200).json({
    status: 'success',
    message: `ID'si ${userId} olan kullanıcı başarıyla güncellendi`,
    user: users[userIndex]
  });
});

// PUT /api/users/:id - Kullanıcı güncelleme (PUT metodu)
app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const updateData = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Geçersiz kullanıcı ID formatı'
    });
  }

  // Gönderilen veri boş mu kontrol et
  if (!updateData || Object.keys(updateData).length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Lütfen güncellenecek alanları JSON body olarak gönderin.'
    });
  }

  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({
      status: 'fail',
      message: `ID'si ${userId} olan kullanıcı bulunamadı.`
    });
  }

  // PUT ile verileri güncelle, ID ve oluşturulma tarihini koru
  users[userIndex] = {
    ...users[userIndex],
    ...updateData,
    id: userId,
    updatedAt: new Date().toISOString()
  };

  saveUsers(users);

  return res.status(200).json({
    status: 'success',
    message: `ID'si ${userId} olan kullanıcı PUT ile başarıyla güncellendi`,
    user: users[userIndex]
  });
});

// DELETE /api/users/:id - Kullanıcı silme
app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Geçersiz kullanıcı ID formatı'
    });
  }

  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({
      status: 'fail',
      message: `ID'si ${userId} olan kullanıcı bulunamadı.`
    });
  }

  // Kullanıcıyı diziden çıkar
  const [deletedUser] = users.splice(userIndex, 1);
  saveUsers(users);

  return res.status(200).json({
    status: 'success',
    message: `ID'si ${userId} olan kullanıcı başarıyla silindi`,
    deletedUser: deletedUser
  });
});




if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(PORT) + 1;
      console.error(`Port ${PORT} is in use, retrying on port ${nextPort}...`);
      app.listen(nextPort, () => {
        console.log(`Server is running on http://localhost:${nextPort}`);
      });
    } else {
      console.error(err);
    }
  });
}

module.exports = app;

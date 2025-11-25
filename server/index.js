const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// SQLite helper (db.js provides runAsync, getAsync, allAsync)
const { runAsync, getAsync, allAsync } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Admin creation moved to after server start

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getAsync('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (user && user.password === password) {
      res.status(200).json({
        message: 'Login successful',
        token: 'fake-jwt-token',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (without passwords)
app.get('/api/users', async (req, res) => {
  try {
    const rows = await allAsync('SELECT id, name, email, userType, status, createdAt, updatedAt FROM users');
    const users = rows.map(u => ({ ...u, status: Boolean(u.status) }));
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint – returns all fields including password (development only)
app.get('/api/users/debug', async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM users');
    const users = rows.map(u => ({ ...u, status: Boolean(u.status) }));
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    console.error('Debug fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user
app.post('/api/users', async (req, res) => {
  const { name, email, password, confirmPassword, userType, status } = req.body;
  // Validation
  if (!name || !email || !password || !confirmPassword || !userType) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }
  try {
    const existing = await getAsync('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (!['super-user', 'admin'].includes(userType)) {
      return res.status(400).json({ success: false, message: 'Invalid user type. Must be super-user or admin' });
    }
    // Insert new user
    const result = await runAsync(
      `INSERT INTO users (name, email, password, userType, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        password,
        userType,
        status === true || status === 'true' ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    const newUserId = result.lastID;
    const newUser = {
      id: newUserId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      userType,
      status: Boolean(status === true || status === 'true'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    res.status(201).json({ success: true, message: 'User created successfully', user: newUser });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Ensure default admin user exists (id 1) after server start
  try {
    // Wait a moment to ensure the users table is ready
    await new Promise(r => setTimeout(r, 200));
    const admin = await getAsync('SELECT * FROM users WHERE email = ?', ['admin@mail.com']);
    if (!admin) {
      await runAsync(
        `INSERT INTO users (name, email, password, userType, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'Super Admin',
          'admin@mail.com',
          '1234567',
          'super-user',
          1,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      console.log('Default admin user created');
    } else {
      console.log('Default admin user already exists');
    }
  } catch (err) {
    console.error('Error ensuring admin user after start:', err);
  }
});

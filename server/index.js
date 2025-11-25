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

// Update user by ID
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password, userType, status } = req.body;

  // Validation
  if (!name || !email || !userType) {
    return res.status(400).json({ success: false, message: 'Name, email, and user type are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  try {
    // Check if user exists
    const existingUser = await getAsync('SELECT * FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if email is already in use by another user
    const emailCheck = await getAsync('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND id != ?', [email, id]);
    if (emailCheck) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    if (!['super-user', 'admin'].includes(userType)) {
      return res.status(400).json({ success: false, message: 'Invalid user type. Must be super-user or admin' });
    }

    // Build update query - only update password if provided
    let updateSQL = '';
    let params = [];
    
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
      }
      updateSQL = `UPDATE users SET name = ?, email = ?, password = ?, userType = ?, status = ?, updatedAt = ? WHERE id = ?`;
      params = [
        name.trim(),
        email.toLowerCase().trim(),
        password,
        userType,
        status === true || status === 'true' ? 1 : 0,
        new Date().toISOString(),
        id
      ];
    } else {
      updateSQL = `UPDATE users SET name = ?, email = ?, userType = ?, status = ?, updatedAt = ? WHERE id = ?`;
      params = [
        name.trim(),
        email.toLowerCase().trim(),
        userType,
        status === true || status === 'true' ? 1 : 0,
        new Date().toISOString(),
        id
      ];
    }

    await runAsync(updateSQL, params);

    const updatedUser = {
      id: parseInt(id),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      userType,
      status: Boolean(status === true || status === 'true'),
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete single user by ID
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Check if user exists
    const existingUser = await getAsync('SELECT * FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await runAsync('DELETE FROM users WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete multiple users (bulk delete)
app.post('/api/users/bulk-delete', async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No user IDs provided' });
  }

  try {
    // Create placeholders for SQL query
    const placeholders = ids.map(() => '?').join(',');
    const deleteSQL = `DELETE FROM users WHERE id IN (${placeholders})`;
    
    const result = await runAsync(deleteSQL, ids);
    res.status(200).json({ 
      success: true, 
      message: `${result.changes} user(s) deleted successfully`,
      deletedCount: result.changes
    });
  } catch (err) {
    console.error('Error bulk deleting users:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ========================
// ARTICLES API ENDPOINTS
// ========================

// Get all articles
app.get('/api/articles', async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM articles ORDER BY createdAt DESC');
    // Return articles as-is (they match the database schema)
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single article by ID
app.get('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const article = await getAsync('SELECT * FROM articles WHERE id = ?', [id]);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    res.status(200).json({ success: true, article });
  } catch (err) {
    console.error('Error fetching article:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new article
app.post('/api/articles', async (req, res) => {
  const { 
    title, 
    urlTitle, 
    slug, 
    parentId, 
    metaTitle, 
    metaKeywords, 
    metaDescription, 
    description, 
    featuredImage, 
    featuredImageAlt, 
    featuredImageCaption,
    bannerImage,
    bannerImageAlt,
    bannerImageCaption
  } = req.body;
  
  // Validation
  if (!title || !urlTitle) {
    return res.status(400).json({ success: false, message: 'Title and URL Title are required' });
  }

  try {
    // Generate slug from urlTitle if not provided
    const finalSlug = slug || urlTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    // Check if slug already exists
    const existing = await getAsync('SELECT * FROM articles WHERE slug = ?', [finalSlug]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const result = await runAsync(
      `INSERT INTO articles (title, urlTitle, slug, parentId, metaTitle, metaKeywords, metaDescription, description, featuredImage, featuredImageAlt, featuredImageCaption, bannerImage, bannerImageAlt, bannerImageCaption, status, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        urlTitle.trim(),
        finalSlug,
        parentId || null,
        metaTitle || null,
        metaKeywords || null,
        metaDescription || null,
        description || null,
        featuredImage || null,
        featuredImageAlt || null,
        featuredImageCaption || null,
        bannerImage || null,
        bannerImageAlt || null,
        bannerImageCaption || null,
        req.body.status || 0,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    const newArticle = {
      id: result.lastID,
      title: title.trim(),
      urlTitle: urlTitle.trim(),
      slug: finalSlug,
      parentId: parentId || null,
      metaTitle,
      metaKeywords,
      metaDescription,
      description,
      featuredImage,
      featuredImageAlt,
      featuredImageCaption,
      bannerImage,
      bannerImageAlt,
      bannerImageCaption,
      status: req.body.status || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({ success: true, message: 'Article created successfully', article: newArticle });
  } catch (err) {
    console.error('Error creating article:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update article by ID
app.put('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    title, 
    urlTitle, 
    slug, 
    parentId, 
    metaTitle, 
    metaKeywords, 
    metaDescription, 
    description, 
    featuredImage, 
    featuredImageAlt, 
    featuredImageCaption,
    bannerImage,
    bannerImageAlt,
    bannerImageCaption,
    status
  } = req.body;

  // Validation
  if (!title || !urlTitle) {
    return res.status(400).json({ success: false, message: 'Title and URL Title are required' });
  }

  try {
    // Check if article exists
    const existingArticle = await getAsync('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existingArticle) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Generate slug from urlTitle if not provided
    const finalSlug = slug || urlTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Check if slug is already in use by another article
    const slugCheck = await getAsync('SELECT * FROM articles WHERE slug = ? AND id != ?', [finalSlug, id]);
    if (slugCheck) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    await runAsync(
      `UPDATE articles SET title = ?, urlTitle = ?, slug = ?, parentId = ?, metaTitle = ?, metaKeywords = ?, metaDescription = ?, description = ?, featuredImage = ?, featuredImageAlt = ?, featuredImageCaption = ?, bannerImage = ?, bannerImageAlt = ?, bannerImageCaption = ?, status = ?, updatedAt = ? WHERE id = ?`,
      [
        title.trim(),
        urlTitle.trim(),
        finalSlug,
        parentId || null,
        metaTitle || null,
        metaKeywords || null,
        metaDescription || null,
        description || null,
        featuredImage || null,
        featuredImageAlt || null,
        featuredImageCaption || null,
        bannerImage || null,
        bannerImageAlt || null,
        bannerImageCaption || null,
        status || 0,
        new Date().toISOString(),
        id
      ]
    );

    const updatedArticle = {
      id: parseInt(id),
      title: title.trim(),
      urlTitle: urlTitle.trim(),
      slug: finalSlug,
      parentId: parentId || null,
      metaTitle,
      metaKeywords,
      metaDescription,
      description,
      featuredImage,
      featuredImageAlt,
      featuredImageCaption,
      bannerImage,
      bannerImageAlt,
      bannerImageCaption,
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({ success: true, message: 'Article updated successfully', article: updatedArticle });
  } catch (err) {
    console.error('Error updating article:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete article by ID
app.delete('/api/articles/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Check if article exists
    const existingArticle = await getAsync('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existingArticle) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    await runAsync('DELETE FROM articles WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Article deleted successfully' });
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete multiple articles (bulk delete)
app.post('/api/articles/bulk-delete', async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No article IDs provided' });
  }

  try {
    // Create placeholders for SQL query
    const placeholders = ids.map(() => '?').join(',');
    const deleteSQL = `DELETE FROM articles WHERE id IN (${placeholders})`;
    
    const result = await runAsync(deleteSQL, ids);
    res.status(200).json({ 
      success: true, 
      message: `${result.changes} article(s) deleted successfully`,
      deletedCount: result.changes
    });
  } catch (err) {
    console.error('Error bulk deleting articles:', err);
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

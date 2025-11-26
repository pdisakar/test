const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// SQLite helper (db.js provides runAsync, getAsync, allAsync)
const { runAsync, getAsync, allAsync } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increase limit for base64 images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper to delete image file
const deleteImageFile = (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('/uploads/')) return;
  const filename = imageUrl.split('/uploads/')[1];
  if (!filename) return;
  const filePath = path.join(__dirname, 'uploads', filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') console.error(`Failed to delete ${filePath}:`, err);
  });
};

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
// IMAGE UPLOAD ENDPOINT
// ========================

// Upload image (converts base64 to file)
app.post('/api/upload/image', async (req, res) => {
  const { image, type = 'featured' } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, message: 'No image data provided' });
  }

  try {
    // Extract base64 data (remove data:image/png;base64, prefix if present)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${type}-${timestamp}.png`;
    const filepath = path.join(__dirname, 'uploads', filename);

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Write file to disk
    fs.writeFileSync(filepath, buffer);

    // Return the public URL path
    const publicPath = `/uploads/${filename}`;
    res.status(200).json({ 
      success: true, 
      message: 'Image uploaded successfully',
      path: publicPath 
    });
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});


// ========================
// ARTICLES API ENDPOINTS
// ========================

// Get all active articles (not deleted)
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await allAsync('SELECT * FROM articles WHERE deletedAt IS NULL ORDER BY createdAt DESC');
    res.json(articles);
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get deleted articles (Trash)
app.get('/api/articles/trash', async (req, res) => {
  try {
    const articles = await allAsync('SELECT * FROM articles WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC');
    res.json(articles);
  } catch (err) {
    console.error('Error fetching trash:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single article
app.get('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const article = await getAsync('SELECT * FROM articles WHERE id = ?', [id]);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    res.json({ success: true, article });
  } catch (err) {
    console.error('Error fetching article:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new article
app.post('/api/articles', async (req, res) => {
  const { 
    title, urlTitle, slug, parentId, 
    metaTitle, metaKeywords, metaDescription, 
    description, featuredImage, featuredImageAlt, featuredImageCaption,
    bannerImage, bannerImageAlt, bannerImageCaption,
    status 
  } = req.body;

  // Basic validation
  if (!title || !urlTitle || !slug) {
    return res.status(400).json({ success: false, message: 'Title, URL Title, and Slug are required' });
  }

  try {
    // Check if slug exists
    const existing = await getAsync('SELECT id FROM articles WHERE slug = ?', [slug]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const now = new Date().toISOString();
    const result = await runAsync(
      `INSERT INTO articles (
        title, urlTitle, slug, parentId, 
        metaTitle, metaKeywords, metaDescription, 
        description, featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, urlTitle, slug, parentId || null, 
        metaTitle, metaKeywords, metaDescription, 
        description, featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        status ? 1 : 0, now, now
      ]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Article created successfully',
      articleId: result.lastID 
    });
  } catch (err) {
    console.error('Error creating article:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update article
app.put('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    title, urlTitle, slug, parentId, 
    metaTitle, metaKeywords, metaDescription, 
    description, featuredImage, featuredImageAlt, featuredImageCaption,
    bannerImage, bannerImageAlt, bannerImageCaption,
    status 
  } = req.body;

  try {
    // Check if article exists
    const existingArticle = await getAsync('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existingArticle) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Check slug uniqueness if changed
    if (slug !== existingArticle.slug) {
      const slugCheck = await getAsync('SELECT id FROM articles WHERE slug = ? AND id != ?', [slug, id]);
      if (slugCheck) {
        return res.status(400).json({ success: false, message: 'Slug already exists' });
      }
    }

    // Delete old images if they are being replaced
    if (featuredImage && featuredImage !== existingArticle.featuredImage) {
      deleteImageFile(existingArticle.featuredImage);
    }
    if (bannerImage && bannerImage !== existingArticle.bannerImage) {
      deleteImageFile(existingArticle.bannerImage);
    }

    const now = new Date().toISOString();
    await runAsync(
      `UPDATE articles SET 
        title = ?, urlTitle = ?, slug = ?, parentId = ?, 
        metaTitle = ?, metaKeywords = ?, metaDescription = ?, 
        description = ?, featuredImage = ?, featuredImageAlt = ?, featuredImageCaption = ?,
        bannerImage = ?, bannerImageAlt = ?, bannerImageCaption = ?,
        status = ?, updatedAt = ?
       WHERE id = ?`,
      [
        title, urlTitle, slug, parentId || null, 
        metaTitle, metaKeywords, metaDescription, 
        description, featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        status ? 1 : 0, now, id
      ]
    );

    res.status(200).json({ success: true, message: 'Article updated successfully' });
  } catch (err) {
    console.error('Error updating article:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper to recursively get all descendant IDs
const getDescendantIds = async (parentId) => {
  try {
    const children = await allAsync('SELECT id FROM articles WHERE parentId = ?', [parentId]);
    let ids = children.map(c => c.id);
    for (const child of children) {
      const grandChildren = await getDescendantIds(child.id);
      ids = [...ids, ...grandChildren];
    }
    return ids;
  } catch (err) {
    console.error('Error getting descendants:', err);
    return [];
  }
};

// Soft Delete article by ID (Cascading)
app.delete('/api/articles/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existingArticle = await getAsync('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existingArticle) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const descendantIds = await getDescendantIds(id);
    const idsToDelete = [id, ...descendantIds];
    const now = new Date().toISOString();

    const placeholders = idsToDelete.map(() => '?').join(',');
    await runAsync(`UPDATE articles SET deletedAt = ? WHERE id IN (${placeholders})`, [now, ...idsToDelete]);
    
    res.status(200).json({ 
      success: true, 
      message: `Article and ${descendantIds.length} descendants moved to trash`,
      deletedCount: idsToDelete.length 
    });
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// Permanent Delete article by ID (Cascading)
app.delete('/api/articles/:id/permanent', async (req, res) => {
  const { id } = req.params;

  try {
    const existingArticle = await getAsync('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existingArticle) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const descendantIds = await getDescendantIds(id);
    const idsToDelete = [id, ...descendantIds];

    const placeholders = idsToDelete.map(() => '?').join(',');

    // Delete associated images
    const articlesToDelete = await allAsync(`SELECT featuredImage, bannerImage FROM articles WHERE id IN (${placeholders})`, idsToDelete);
    articlesToDelete.forEach(article => {
      deleteImageFile(article.featuredImage);
      deleteImageFile(article.bannerImage);
    });

    await runAsync(`DELETE FROM articles WHERE id IN (${placeholders})`, idsToDelete);
    
    res.status(200).json({ 
      success: true, 
      message: `Article and ${descendantIds.length} descendants permanently deleted`,
      deletedCount: idsToDelete.length 
    });
  } catch (err) {
    console.error('Error permanently deleting article:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Restore article by ID (Cascading)
app.post('/api/articles/:id/restore', async (req, res) => {
  const { id } = req.params;

  try {
    const existingArticle = await getAsync('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existingArticle) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const descendantIds = await getDescendantIds(id);
    const idsToRestore = [id, ...descendantIds];

    const placeholders = idsToRestore.map(() => '?').join(',');
    await runAsync(`UPDATE articles SET deletedAt = NULL WHERE id IN (${placeholders})`, idsToRestore);
    
    res.status(200).json({ 
      success: true, 
      message: `Article and ${descendantIds.length} descendants restored`,
      restoredCount: idsToRestore.length 
    });
  } catch (err) {
    console.error('Error restoring article:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk Soft Delete
app.post('/api/articles/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'No IDs provided' });

  try {
    let allIdsToDelete = new Set(ids);
    for (const id of ids) {
      const descendants = await getDescendantIds(id);
      descendants.forEach(dId => allIdsToDelete.add(dId));
    }
    
    const finalIds = Array.from(allIdsToDelete);
    const now = new Date().toISOString();
    const placeholders = finalIds.map(() => '?').join(',');
    
    const result = await runAsync(`UPDATE articles SET deletedAt = ? WHERE id IN (${placeholders})`, [now, ...finalIds]);
    res.status(200).json({ success: true, message: `${result.changes} articles moved to trash` });
  } catch (err) {
    console.error('Error bulk deleting:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk Permanent Delete
app.post('/api/articles/bulk-delete-permanent', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'No IDs provided' });

  try {
    let allIdsToDelete = new Set(ids);
    for (const id of ids) {
      const descendants = await getDescendantIds(id);
      descendants.forEach(dId => allIdsToDelete.add(dId));
    }
    
    const finalIds = Array.from(allIdsToDelete);
    const placeholders = finalIds.map(() => '?').join(',');
    
    // Delete associated images
    const articlesToDelete = await allAsync(`SELECT featuredImage, bannerImage FROM articles WHERE id IN (${placeholders})`, finalIds);
    articlesToDelete.forEach(article => {
      deleteImageFile(article.featuredImage);
      deleteImageFile(article.bannerImage);
    });

    const result = await runAsync(`DELETE FROM articles WHERE id IN (${placeholders})`, finalIds);
    res.status(200).json({ success: true, message: `${result.changes} articles permanently deleted` });
  } catch (err) {
    console.error('Error bulk permanent deleting:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk Restore
app.post('/api/articles/bulk-restore', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'No IDs provided' });

  try {
    let allIdsToRestore = new Set(ids);
    for (const id of ids) {
      const descendants = await getDescendantIds(id);
      descendants.forEach(dId => allIdsToRestore.add(dId));
    }
    
    const finalIds = Array.from(allIdsToRestore);
    const placeholders = finalIds.map(() => '?').join(',');
    
    const result = await runAsync(`UPDATE articles SET deletedAt = NULL WHERE id IN (${placeholders})`, finalIds);
    res.status(200).json({ success: true, message: `${result.changes} articles restored` });
  } catch (err) {
    console.error('Error bulk restoring:', err);
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

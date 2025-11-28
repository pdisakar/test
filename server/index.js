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

// Delete image
app.delete('/api/upload/image', (req, res) => {
  const { path: imagePath } = req.body;
  
  if (!imagePath) {
    return res.status(400).json({ success: false, message: 'No image path provided' });
  }

  // Security check: ensure path is within uploads directory
  if (!imagePath.includes('/uploads/')) {
    return res.status(400).json({ success: false, message: 'Invalid image path' });
  }

  deleteImageFile(imagePath);
  res.status(200).json({ success: true, message: 'Image deleted successfully' });
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

// ========================
// PLACES API ENDPOINTS
// ========================

// Helper to recursively get all descendant place IDs
const getPlaceDescendantIds = async (parentId) => {
  try {
    const children = await allAsync('SELECT id FROM places WHERE parentId = ?', [parentId]);
    let ids = children.map(c => c.id);
    for (const child of children) {
      const grandChildren = await getPlaceDescendantIds(child.id);
      ids = [...ids, ...grandChildren];
    }
    return ids;
  } catch (err) {
    console.error('Error getting place descendants:', err);
    return [];
  }
};

// Get all active places (not deleted)
app.get('/api/places', async (req, res) => {
  try {
    const places = await allAsync('SELECT * FROM places WHERE deletedAt IS NULL ORDER BY createdAt DESC');
    res.json(places);
  } catch (err) {
    console.error('Error fetching places:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get deleted places (Trash)
app.get('/api/places/trash', async (req, res) => {
  try {
    const places = await allAsync('SELECT * FROM places WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC');
    res.json(places);
  } catch (err) {
    console.error('Error fetching trash:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single place
app.get('/api/places/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const place = await getAsync('SELECT * FROM places WHERE id = ?', [id]);
    if (!place) {
      return res.status(404).json({ success: false, message: 'Place not found' });
    }
    res.json({ success: true, place });
  } catch (err) {
    console.error('Error fetching place:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new place
app.post('/api/places', async (req, res) => {
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
    const existing = await getAsync('SELECT id FROM places WHERE slug = ?', [slug]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const now = new Date().toISOString();
    const result = await runAsync(
      `INSERT INTO places (
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
      message: 'Place created successfully',
      placeId: result.lastID 
    });
  } catch (err) {
    console.error('Error creating place:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update place
app.put('/api/places/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    title, urlTitle, slug, parentId, 
    metaTitle, metaKeywords, metaDescription, 
    description, featuredImage, featuredImageAlt, featuredImageCaption,
    bannerImage, bannerImageAlt, bannerImageCaption,
    status 
  } = req.body;

  try {
    // Check if place exists
    const existingPlace = await getAsync('SELECT * FROM places WHERE id = ?', [id]);
    if (!existingPlace) {
      return res.status(404).json({ success: false, message: 'Place not found' });
    }

    // Check slug uniqueness if changed
    if (slug !== existingPlace.slug) {
      const slugCheck = await getAsync('SELECT id FROM places WHERE slug = ? AND id != ?', [slug, id]);
      if (slugCheck) {
        return res.status(400).json({ success: false, message: 'Slug already exists' });
      }
    }

    // Delete old images if they are being replaced
    if (featuredImage && featuredImage !== existingPlace.featuredImage) {
      deleteImageFile(existingPlace.featuredImage);
    }
    if (bannerImage && bannerImage !== existingPlace.bannerImage) {
      deleteImageFile(existingPlace.bannerImage);
    }

    const now = new Date().toISOString();
    await runAsync(
      `UPDATE places SET 
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

    res.status(200).json({ success: true, message: 'Place updated successfully' });
  } catch (err) {
    console.error('Error updating place:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========================
// PACKAGE ATTRIBUTES API
// ========================

// Get attributes by type
app.get('/api/attributes/:type', async (req, res) => {
  const { type } = req.params;
  try {
    const attributes = await allAsync('SELECT * FROM package_attributes WHERE type = ? ORDER BY name ASC', [type]);
    res.json(attributes);
  } catch (err) {
    console.error('Error fetching attributes:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new attribute
app.post('/api/attributes', async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) {
    return res.status(400).json({ success: false, message: 'Name and type are required' });
  }

  try {
    const now = new Date().toISOString();
    const result = await runAsync(
      'INSERT INTO package_attributes (name, type, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [name, type, now, now]
    );
    res.status(201).json({ 
      success: true, 
      message: 'Attribute created', 
      attribute: { id: result.lastID, name, type } 
    });
  } catch (err) {
    console.error('Error creating attribute:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete attribute
app.delete('/api/attributes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await runAsync('DELETE FROM package_attributes WHERE id = ?', [id]);
    res.json({ success: true, message: 'Attribute deleted' });
  } catch (err) {
    console.error('Error deleting attribute:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update attribute
app.put('/api/attributes/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

  try {
    const now = new Date().toISOString();
    await runAsync('UPDATE package_attributes SET name = ?, updatedAt = ? WHERE id = ?', [name, now, id]);
    res.json({ success: true, message: 'Attribute updated' });
  } catch (err) {
    console.error('Error updating attribute:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========================
// TRIP FACT CATEGORIES API
// ========================

// Get all categories
app.get('/api/fact-categories', async (req, res) => {
  try {
    const categories = await allAsync('SELECT * FROM trip_fact_categories ORDER BY createdAt ASC');
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create category
app.post('/api/fact-categories', async (req, res) => {
  const { label } = req.body;
  if (!label) return res.status(400).json({ success: false, message: 'Label is required' });

  try {
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const now = new Date().toISOString();
    
    // Check slug uniqueness
    const existing = await getAsync('SELECT id FROM trip_fact_categories WHERE slug = ?', [slug]);
    if (existing) return res.status(400).json({ success: false, message: 'Category already exists' });

    const result = await runAsync(
      'INSERT INTO trip_fact_categories (label, slug, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [label, slug, now, now]
    );
    res.status(201).json({ 
      success: true, 
      message: 'Category created', 
      category: { id: result.lastID, label, slug } 
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete category
app.delete('/api/fact-categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if it's a default category
    const category = await getAsync('SELECT slug, isDefault FROM trip_fact_categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    if (category.isDefault) {
      return res.status(403).json({ success: false, message: 'Cannot delete default category' });
    }
    
    // Also delete associated attributes
    await runAsync('DELETE FROM package_attributes WHERE type = ?', [category.slug]);
    await runAsync('DELETE FROM trip_fact_categories WHERE id = ?', [id]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update category
app.put('/api/fact-categories/:id', async (req, res) => {
  const { id } = req.params;
  const { label } = req.body;
  if (!label) return res.status(400).json({ success: false, message: 'Label is required' });

  try {
    const now = new Date().toISOString();
    await runAsync('UPDATE trip_fact_categories SET label = ?, updatedAt = ? WHERE id = ?', [label, now, id]);
    res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Soft Delete place by ID (Cascading)
app.delete('/api/places/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existingPlace = await getAsync('SELECT * FROM places WHERE id = ?', [id]);
    if (!existingPlace) {
      return res.status(404).json({ success: false, message: 'Place not found' });
    }

    const descendantIds = await getPlaceDescendantIds(id);
    const idsToDelete = [id, ...descendantIds];
    const now = new Date().toISOString();

    const placeholders = idsToDelete.map(() => '?').join(',');
    await runAsync(`UPDATE places SET deletedAt = ? WHERE id IN (${placeholders})`, [now, ...idsToDelete]);
    
    res.status(200).json({ 
      success: true, 
      message: `Place and ${descendantIds.length} descendants moved to trash`,
      deletedCount: idsToDelete.length 
    });
  } catch (err) {
    console.error('Error deleting place:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Permanent Delete place by ID (Cascading)
app.delete('/api/places/:id/permanent', async (req, res) => {
  const { id } = req.params;

  try {
    const existingPlace = await getAsync('SELECT * FROM places WHERE id = ?', [id]);
    if (!existingPlace) {
      return res.status(404).json({ success: false, message: 'Place not found' });
    }

    const descendantIds = await getPlaceDescendantIds(id);
    const idsToDelete = [id, ...descendantIds];

    const placeholders = idsToDelete.map(() => '?').join(',');

    // Delete associated images
    const placesToDelete = await allAsync(`SELECT featuredImage, bannerImage FROM places WHERE id IN (${placeholders})`, idsToDelete);
    placesToDelete.forEach(place => {
      deleteImageFile(place.featuredImage);
      deleteImageFile(place.bannerImage);
    });

    await runAsync(`DELETE FROM places WHERE id IN (${placeholders})`, idsToDelete);
    
    res.status(200).json({ 
      success: true, 
      message: `Place and ${descendantIds.length} descendants permanently deleted`,
      deletedCount: idsToDelete.length 
    });
  } catch (err) {
    console.error('Error permanently deleting place:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Restore place by ID (Cascading)
app.post('/api/places/:id/restore', async (req, res) => {
  const { id } = req.params;

  try {
    const existingPlace = await getAsync('SELECT * FROM places WHERE id = ?', [id]);
    if (!existingPlace) {
      return res.status(404).json({ success: false, message: 'Place not found' });
    }

    const descendantIds = await getPlaceDescendantIds(id);
    const idsToRestore = [id, ...descendantIds];

    const placeholders = idsToRestore.map(() => '?').join(',');
    await runAsync(`UPDATE places SET deletedAt = NULL WHERE id IN (${placeholders})`, idsToRestore);
    
    res.status(200).json({ 
      success: true, 
      message: `Place and ${descendantIds.length} descendants restored`,
      restoredCount: idsToRestore.length 
    });
  } catch (err) {
    console.error('Error restoring place:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk Soft Delete
app.post('/api/places/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'No IDs provided' });

  try {
    let allIdsToDelete = new Set(ids);
    for (const id of ids) {
      const descendants = await getPlaceDescendantIds(id);
      descendants.forEach(dId => allIdsToDelete.add(dId));
    }
    
    const finalIds = Array.from(allIdsToDelete);
    const now = new Date().toISOString();
    const placeholders = finalIds.map(() => '?').join(',');
    
    const result = await runAsync(`UPDATE places SET deletedAt = ? WHERE id IN (${placeholders})`, [now, ...finalIds]);
    res.status(200).json({ success: true, message: `${result.changes} places moved to trash` });
  } catch (err) {
    console.error('Error bulk deleting:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk Permanent Delete
app.post('/api/places/bulk-delete-permanent', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'No IDs provided' });

  try {
    let allIdsToDelete = new Set(ids);
    for (const id of ids) {
      const descendants = await getPlaceDescendantIds(id);
      descendants.forEach(dId => allIdsToDelete.add(dId));
    }
    
    const finalIds = Array.from(allIdsToDelete);
    const placeholders = finalIds.map(() => '?').join(',');
    
    // Delete associated images
    const placesToDelete = await allAsync(`SELECT featuredImage, bannerImage FROM places WHERE id IN (${placeholders})`, finalIds);
    placesToDelete.forEach(place => {
      deleteImageFile(place.featuredImage);
      deleteImageFile(place.bannerImage);
    });

    const result = await runAsync(`DELETE FROM places WHERE id IN (${placeholders})`, finalIds);
    res.status(200).json({ success: true, message: `${result.changes} places permanently deleted` });
  } catch (err) {
    console.error('Error bulk permanent deleting:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk Restore
app.post('/api/places/bulk-restore', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'No IDs provided' });

  try {
    let allIdsToRestore = new Set(ids);
    for (const id of ids) {
      const descendants = await getPlaceDescendantIds(id);
      descendants.forEach(dId => allIdsToRestore.add(dId));
    }
    
    const finalIds = Array.from(allIdsToRestore);
    const placeholders = finalIds.map(() => '?').join(',');
    
    const result = await runAsync(`UPDATE places SET deletedAt = NULL WHERE id IN (${placeholders})`, finalIds);
    res.status(200).json({ success: true, message: `${result.changes} places restored` });
  } catch (err) {
    console.error('Error bulk restoring:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new package
app.post('/api/packages', async (req, res) => {
  const {
    packageTitle, urlTitle, slug, durationValue, durationUnit,
    placeIds, metaTitle, metaKeywords, metaDescription,
    abstract, details, defaultPrice, groupPriceEnabled, groupPrices,
    costInclude, costExclude,
    featuredImage, featuredImageAlt, featuredImageCaption,
    bannerImage, bannerImageAlt, bannerImageCaption,
    tripMapImage, tripMapImageAlt, tripMapImageCaption,
    statusRibbon, groupSize, maxAltitude,
    tripHighlights, departureNote, goodToKnow, extraFAQs,
    relatedTrip, itineraryTitle, status, featured,
    tripFacts, itinerary
  } = req.body;

  // Basic validation
  if (!packageTitle || !urlTitle || !slug) {
    return res.status(400).json({ success: false, message: 'Title, URL Title, and Slug are required' });
  }

  try {
    // Check if slug exists
    const existing = await getAsync('SELECT id FROM packages WHERE slug = ?', [slug]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const now = new Date().toISOString();
    
    // Insert package
    const result = await runAsync(
      `INSERT INTO packages (
        title, urlTitle, slug, duration, durationUnit,
        metaTitle, metaKeywords, metaDescription,
        abstract, details, defaultPrice, groupPriceEnabled,
        costInclude, costExclude,
        featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        tripMapImage, tripMapImageAlt, tripMapImageCaption,
        statusRibbon, groupSize, maxAltitude,
        tripHighlights, departureNote, goodToKnow, extraFAQs,
        relatedTrip, itineraryTitle, status, featured,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        packageTitle, urlTitle, slug, durationValue || 0, durationUnit || 'days',
        metaTitle, metaKeywords, metaDescription,
        abstract, details, defaultPrice || 0, groupPriceEnabled ? 1 : 0,
        costInclude, costExclude,
        featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        tripMapImage, tripMapImageAlt, tripMapImageCaption,
        statusRibbon, groupSize, maxAltitude,
        tripHighlights, departureNote, goodToKnow, extraFAQs,
        relatedTrip, itineraryTitle, status ? 1 : 0, featured ? 1 : 0,
        now, now
      ]
    );

    const packageId = result.lastID;

    // Insert Places
    if (placeIds && Array.isArray(placeIds)) {
      for (const placeId of placeIds) {
        await runAsync(
          `INSERT INTO package_places (packageId, placeId) VALUES (?, ?)`,
          [packageId, placeId]
        );
      }
    }

    // Insert Trip Facts
    if (tripFacts && typeof tripFacts === 'object') {
      for (const [categorySlug, attributeId] of Object.entries(tripFacts)) {
        if (attributeId) {
          await runAsync(
            `INSERT INTO package_trip_facts (packageId, categorySlug, attributeId) VALUES (?, ?, ?)`,
            [packageId, categorySlug, attributeId]
          );
        }
      }
    }

    // Insert Itinerary
    if (itinerary && Array.isArray(itinerary)) {
      for (const day of itinerary) {
        await runAsync(
          `INSERT INTO package_itinerary (
            packageId, dayNumber, title, description,
            meals, accommodation, distance, origin, destination, 
            originElevation, destinationElevation, walkingHours, transportation
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            packageId, day.dayNumber, day.title, day.description,
            day.meals, day.accommodation, day.distance, day.origin, day.destination,
            day.originElevation, day.destinationElevation, day.walkingHours, day.transportation
          ]
        );
      }
    }

    // Insert Group Prices
    if (groupPriceEnabled && groupPrices && Array.isArray(groupPrices)) {
      for (const gp of groupPrices) {
        await runAsync(
          `INSERT INTO package_group_pricing (packageId, minPerson, maxPerson, price) VALUES (?, ?, ?, ?)`,
          [packageId, gp.minPerson, gp.maxPerson, gp.price]
        );
      }
    }

    // Insert Gallery Images
    if (req.body.galleryImages && Array.isArray(req.body.galleryImages)) {
      for (const imageUrl of req.body.galleryImages) {
        await runAsync(
          `INSERT INTO package_gallery (packageId, imageUrl, createdAt) VALUES (?, ?, ?)`,
          [packageId, imageUrl, now]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      packageId: packageId
    });

  } catch (err) {
    console.error('Error creating package:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all packages (paginated)
app.get('/api/packages', async (req, res) => {
  const { page = 1, limit = 10, search, status } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM packages WHERE deletedAt IS NULL';
    let countQuery = 'SELECT COUNT(*) as count FROM packages WHERE deletedAt IS NULL';
    const params = [];

    if (search) {
      query += ' AND (title LIKE ? OR slug LIKE ?)';
      countQuery += ' AND (title LIKE ? OR slug LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status !== undefined) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const packages = await allAsync(query, params);
    const countResult = await getAsync(countQuery, params.slice(0, params.length - 2));
    const total = countResult.count;

    res.status(200).json({
      success: true,
      packages,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error fetching packages:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single package by ID or Slug
app.get('/api/packages/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;
  
  try {
    let packageData;
    if (!isNaN(idOrSlug)) {
      packageData = await getAsync('SELECT * FROM packages WHERE id = ? AND deletedAt IS NULL', [idOrSlug]);
    } else {
      packageData = await getAsync('SELECT * FROM packages WHERE slug = ? AND deletedAt IS NULL', [idOrSlug]);
    }

    if (!packageData) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    const packageId = packageData.id;

    // Fetch relationships
    const places = await allAsync(
      `SELECT p.* FROM places p 
       JOIN package_places pp ON p.id = pp.placeId 
       WHERE pp.packageId = ?`, 
      [packageId]
    );

    const tripFacts = await allAsync(
      `SELECT categorySlug, attributeId FROM package_trip_facts WHERE packageId = ?`,
      [packageId]
    );

    const itinerary = await allAsync(
      `SELECT * FROM package_itinerary WHERE packageId = ? ORDER BY dayNumber ASC`,
      [packageId]
    );

    const groupPrices = await allAsync(
      `SELECT * FROM package_group_pricing WHERE packageId = ? ORDER BY minPerson ASC`,
      [packageId]
    );

    const galleryImages = await allAsync(
      `SELECT imageUrl FROM package_gallery WHERE packageId = ? ORDER BY createdAt ASC`,
      [packageId]
    );

    // Format trip facts as object { categorySlug: attributeId }
    const tripFactsObj = {};
    tripFacts.forEach(tf => {
      tripFactsObj[tf.categorySlug] = tf.attributeId;
    });

    res.status(200).json({
      success: true,
      package: {
        ...packageData,
        places,
        tripFacts: tripFactsObj,
        itinerary,
        groupPrices,
        galleryImages: galleryImages.map(g => g.imageUrl)
      }
    });

  } catch (err) {
    console.error('Error fetching package details:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update package
app.put('/api/packages/:id', async (req, res) => {
  const { id } = req.params;
  const {
    packageTitle, urlTitle, slug, durationValue, durationUnit,
    placeIds, metaTitle, metaKeywords, metaDescription,
    abstract, details, defaultPrice, groupPriceEnabled, groupPrices,
    costInclude, costExclude,
    featuredImage, featuredImageAlt, featuredImageCaption,
    bannerImage, bannerImageAlt, bannerImageCaption,
    tripMapImage, tripMapImageAlt, tripMapImageCaption,
    statusRibbon, groupSize, maxAltitude,
    tripHighlights, departureNote, goodToKnow, extraFAQs,
    relatedTrip, itineraryTitle, status, featured,
    tripFacts, itinerary
  } = req.body;

  // Basic validation
  if (!packageTitle || !urlTitle || !slug) {
    return res.status(400).json({ success: false, message: 'Title, URL Title, and Slug are required' });
  }

  try {
    // Check if package exists
    const existingPackage = await getAsync('SELECT * FROM packages WHERE id = ?', [id]);
    if (!existingPackage) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Check if slug exists (excluding current package)
    const slugCheck = await getAsync('SELECT id FROM packages WHERE slug = ? AND id != ?', [slug, id]);
    if (slugCheck) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    // Handle image cleanup (if new image provided, delete old)
    if (featuredImage && featuredImage !== existingPackage.featuredImage) {
      deleteImageFile(existingPackage.featuredImage);
    }
    if (bannerImage && bannerImage !== existingPackage.bannerImage) {
      deleteImageFile(existingPackage.bannerImage);
    }
    if (tripMapImage && tripMapImage !== existingPackage.tripMapImage) {
      deleteImageFile(existingPackage.tripMapImage);
    }

    const now = new Date().toISOString();

    // Update package
    await runAsync(
      `UPDATE packages SET
        title = ?, urlTitle = ?, slug = ?, duration = ?, durationUnit = ?,
        metaTitle = ?, metaKeywords = ?, metaDescription = ?,
        abstract = ?, details = ?, defaultPrice = ?, groupPriceEnabled = ?,
        costInclude = ?, costExclude = ?,
        featuredImage = ?, featuredImageAlt = ?, featuredImageCaption = ?,
        bannerImage = ?, bannerImageAlt = ?, bannerImageCaption = ?,
        tripMapImage = ?, tripMapImageAlt = ?, tripMapImageCaption = ?,
        statusRibbon = ?, groupSize = ?, maxAltitude = ?,
        tripHighlights = ?, departureNote = ?, goodToKnow = ?, extraFAQs = ?,
        relatedTrip = ?, itineraryTitle = ?, status = ?, featured = ?,
        updatedAt = ?
      WHERE id = ?`,
      [
        packageTitle, urlTitle, slug, durationValue || 0, durationUnit || 'days',
        metaTitle, metaKeywords, metaDescription,
        abstract, details, defaultPrice || 0, groupPriceEnabled ? 1 : 0,
        costInclude, costExclude,
        featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        tripMapImage, tripMapImageAlt, tripMapImageCaption,
        statusRibbon, groupSize, maxAltitude,
        tripHighlights, departureNote, goodToKnow, extraFAQs,
        relatedTrip, itineraryTitle, status ? 1 : 0, featured ? 1 : 0,
        now, id
      ]
    );

    // Update Places (Delete all and re-insert)
    await runAsync('DELETE FROM package_places WHERE packageId = ?', [id]);
    if (placeIds && Array.isArray(placeIds)) {
      for (const placeId of placeIds) {
        await runAsync(
          `INSERT INTO package_places (packageId, placeId) VALUES (?, ?)`,
          [id, placeId]
        );
      }
    }

    // Update Trip Facts (Delete all and re-insert)
    await runAsync('DELETE FROM package_trip_facts WHERE packageId = ?', [id]);
    if (tripFacts && typeof tripFacts === 'object') {
      for (const [categorySlug, attributeId] of Object.entries(tripFacts)) {
        if (attributeId) {
          await runAsync(
            `INSERT INTO package_trip_facts (packageId, categorySlug, attributeId) VALUES (?, ?, ?)`,
            [id, categorySlug, attributeId]
          );
        }
      }
    }

    // Update Itinerary (Delete all and re-insert)
    await runAsync('DELETE FROM package_itinerary WHERE packageId = ?', [id]);
    if (itinerary && Array.isArray(itinerary)) {
      for (const day of itinerary) {
        await runAsync(
          `INSERT INTO package_itinerary (
            packageId, dayNumber, title, description,
            meals, accommodation, distance, origin, destination, 
            originElevation, destinationElevation, walkingHours, transportation
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, day.dayNumber, day.title, day.description,
            day.meals, day.accommodation, day.distance, day.origin, day.destination,
            day.originElevation, day.destinationElevation, day.walkingHours, day.transportation
          ]
        );
      }
    }

    // Update Group Prices (Delete all and re-insert)
    await runAsync('DELETE FROM package_group_pricing WHERE packageId = ?', [id]);
    if (groupPriceEnabled && groupPrices && Array.isArray(groupPrices)) {
      for (const gp of groupPrices) {
        await runAsync(
          `INSERT INTO package_group_pricing (packageId, minPerson, maxPerson, price) VALUES (?, ?, ?, ?)`,
          [id, gp.minPerson, gp.maxPerson, gp.price]
        );
      }
    }

    // Update Gallery Images (Delete all and re-insert)
    console.log('[DEBUG] Received galleryImages:', req.body.galleryImages);
    
    // Delete all from database
    await runAsync('DELETE FROM package_gallery WHERE packageId = ?', [id]);
    
    // Insert new gallery images
    const newImageUrls = req.body.galleryImages || [];
    if (Array.isArray(newImageUrls)) {
      console.log('[DEBUG] Inserting', newImageUrls.length, 'gallery images');
      for (const imageUrl of newImageUrls) {
        await runAsync(
          `INSERT INTO package_gallery (packageId, imageUrl, createdAt) VALUES (?, ?, ?)`,
          [id, imageUrl, now]
        );
      }
    }
    // Note: Files are deleted immediately when user clicks delete button in frontend

    res.status(200).json({ success: true, message: 'Package updated successfully' });

  } catch (err) {
    console.error('Error updating package:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete package (Soft delete)
app.delete('/api/packages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const now = new Date().toISOString();
    await runAsync('UPDATE packages SET deletedAt = ? WHERE id = ?', [now, id]);
    res.status(200).json({ success: true, message: 'Package deleted successfully' });
  } catch (err) {
    console.error('Error deleting package:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get deleted packages (Trash)
app.get('/api/packages/trash/all', async (req, res) => {
  try {
    const packages = await allAsync('SELECT * FROM packages WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC');
    res.status(200).json(packages);
  } catch (err) {
    console.error('Error fetching trash:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Restore package
app.put('/api/packages/:id/restore', async (req, res) => {
  const { id } = req.params;
  try {
    await runAsync('UPDATE packages SET deletedAt = NULL WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Package restored successfully' });
  } catch (err) {
    console.error('Error restoring package:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Permanent delete package
app.delete('/api/packages/:id/permanent', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get package to find images
    const pkg = await getAsync('SELECT * FROM packages WHERE id = ?', [id]);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // 2. Delete images from filesystem
    const imagesToDelete = [
      pkg.featuredImage,
      pkg.bannerImage,
      pkg.tripMapImage
    ].filter(Boolean);

    for (const imagePath of imagesToDelete) {
      deleteImageFile(imagePath);
    }

    // 2.1 Delete gallery images from filesystem
    const galleryImages = await allAsync('SELECT imageUrl FROM package_gallery WHERE packageId = ?', [id]);
    if (galleryImages && galleryImages.length > 0) {
      for (const img of galleryImages) {
        deleteImageFile(img.imageUrl);
      }
    }

    // 3. Delete from database (Cascade should handle related tables)
    await runAsync('DELETE FROM packages WHERE id = ?', [id]);

    res.status(200).json({ success: true, message: 'Package permanently deleted' });
  } catch (err) {
    console.error('Error permanently deleting package:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========== AUTHORS ENDPOINTS ==========

// Create new author
app.post('/api/authors', async (req, res) => {
  const {
    fullName, urlTitle, slug, email, description,
    avatar, avatarCaption, bannerImage,
    metaTitle, metaKeywords, metaDescription, status
  } = req.body;

  // Validation
  if (!fullName || !urlTitle || !slug || !email) {
    return res.status(400).json({ success: false, message: 'Full Name, URL Title, Slug, and Email are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  try {
    // Check if email already exists
    const existing = await getAsync('SELECT * FROM authors WHERE LOWER(email) = LOWER(?)', [email]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Check if URL title already exists
    const existingUrl = await getAsync('SELECT * FROM authors WHERE urlTitle = ?', [urlTitle]);
    if (existingUrl) {
      return res.status(400).json({ success: false, message: 'URL Title already exists' });
    }

    // Check if slug already exists
    const existingSlug = await getAsync('SELECT * FROM authors WHERE slug = ?', [slug]);
    if (existingSlug) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const now = new Date().toISOString();
    const result = await runAsync(
      `INSERT INTO authors (
        fullName, urlTitle, slug, email, description,
        avatar, avatarCaption, bannerImage,
        metaTitle, metaKeywords, metaDescription,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName, urlTitle, slug, email, description,
        avatar, avatarCaption, bannerImage,
        metaTitle, metaKeywords, metaDescription,
        status !== undefined ? status : 1, now, now
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Author created successfully',
      authorId: result.lastID
    });
  } catch (err) {
    console.error('Error creating author:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all authors (exclude deleted)
app.get('/api/authors', async (req, res) => {
  try {
    const authors = await allAsync('SELECT * FROM authors WHERE deletedAt IS NULL ORDER BY createdAt DESC');
    res.status(200).json(authors);
  } catch (err) {
    console.error('Error fetching authors:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single author by ID
app.get('/api/authors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const author = await getAsync('SELECT * FROM authors WHERE id = ?', [id]);
    if (!author) {
      return res.status(404).json({ success: false, message: 'Author not found' });
    }
    res.status(200).json(author);
  } catch (err) {
    console.error('Error fetching author:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update author
app.put('/api/authors/:id', async (req, res) => {
  const { id } = req.params;
  const {
    fullName, urlTitle, slug, email, description,
    avatar, avatarCaption, bannerImage,
    metaTitle, metaKeywords, metaDescription, status
  } = req.body;

  // Validation
  if (!fullName || !urlTitle || !slug || !email) {
    return res.status(400).json({ success: false, message: 'Full Name, URL Title, Slug, and Email are required' });
  }

  try {
    // Check if author exists
    const existing = await getAsync('SELECT * FROM authors WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Author not found' });
    }

    // Check if email is taken by another author
    const emailCheck = await getAsync('SELECT * FROM authors WHERE LOWER(email) = LOWER(?) AND id != ?', [email, id]);
    if (emailCheck) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Check if URL title is taken by another author
    const urlCheck = await getAsync('SELECT * FROM authors WHERE urlTitle = ? AND id != ?', [urlTitle, id]);
    if (urlCheck) {
      return res.status(400).json({ success: false, message: 'URL Title already exists' });
    }

    // Check if slug is taken by another author
    const slugCheck = await getAsync('SELECT * FROM authors WHERE slug = ? AND id != ?', [slug, id]);
    if (slugCheck) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const now = new Date().toISOString();
    await runAsync(
      `UPDATE authors SET
        fullName = ?, urlTitle = ?, slug = ?, email = ?, description = ?,
        avatar = ?, avatarCaption = ?, bannerImage = ?,
        metaTitle = ?, metaKeywords = ?, metaDescription = ?,
        status = ?, updatedAt = ?
      WHERE id = ?`,
      [
        fullName, urlTitle, slug, email, description,
        avatar, avatarCaption, bannerImage,
        metaTitle, metaKeywords, metaDescription,
        status, now, id
      ]
    );

    res.status(200).json({ success: true, message: 'Author updated successfully' });
  } catch (err) {
    console.error('Error updating author:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  
  }
});

// Delete author (Soft delete)
app.delete('/api/authors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const now = new Date().toISOString();
    await runAsync('UPDATE authors SET deletedAt = ? WHERE id = ?', [now, id]);
    res.status(200).json({ success: true, message: 'Author deleted successfully' });
  } catch (err) {
    console.error('Error deleting author:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get deleted authors (Trash)
app.get('/api/authors/trash/all', async (req, res) => {
  try {
    const authors = await allAsync('SELECT * FROM authors WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC');
    res.status(200).json(authors);
  } catch (err) {
    console.error('Error fetching trash:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Restore author
app.put('/api/authors/:id/restore', async (req, res) => {
  const { id } = req.params;
  try {
    await runAsync('UPDATE authors SET deletedAt = NULL WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Author restored successfully' });
  } catch (err) {
    console.error('Error restoring author:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Permanent delete author
app.delete('/api/authors/:id/permanent', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get author to find images
    const author = await getAsync('SELECT * FROM authors WHERE id = ?', [id]);
    if (!author) {
      return res.status(404).json({ success: false, message: 'Author not found' });
    }

    // 2. Delete images from filesystem
    const imagesToDelete = [
      author.avatar,
      author.bannerImage
    ].filter(Boolean);

    for (const imagePath of imagesToDelete) {
      deleteImageFile(imagePath);
    }

    // 3. Delete from database
    await runAsync('DELETE FROM authors WHERE id = ?', [id]);

    res.status(200).json({ success: true, message: 'Author permanently deleted' });
  } catch (err) {
    console.error('Error permanently deleting author:', err);
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

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

// Helper to check if slug exists globally across all content types
const checkSlugExists = async (slug, excludeTable = null, excludeId = null) => {
  // 1. Check Reserved Slugs
  const reservedSlugs = [
    'admin', 'login', 'about', 'contact', 'blogs', 'packages',
    'api', 'uploads', '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml',
    'search', 'dashboard', 'profile', 'settings', 'auth'
  ];

  if (reservedSlugs.includes(slug.toLowerCase())) {
    return { exists: true, table: 'System Route' };
  }

  // 2. Check Database Tables
  const tables = ['places', 'packages', 'articles', 'blogs'];

  for (const table of tables) {
    // Skip the table we're updating (if provided)
    if (table === excludeTable && excludeId) {
      const existing = await getAsync(
        `SELECT id FROM ${table} WHERE slug = ? AND id != ? AND deletedAt IS NULL`,
        [slug, excludeId]
      );
      if (existing) {
        return { exists: true, table, id: existing.id };
      }
    } else if (table !== excludeTable) {
      const existing = await getAsync(
        `SELECT id FROM ${table} WHERE slug = ? AND deletedAt IS NULL`,
        [slug]
      );
      if (existing) {
        return { exists: true, table, id: existing.id };
      }
    }
  }

  return { exists: false };
};

// Helper to format meta data from entity
const formatMeta = (entity) => {
  if (!entity) return null;
  return {
    ...entity,
    meta: {
      title: entity.metaTitle,
      keywords: entity.metaKeywords,
      description: entity.metaDescription
    },
    metaTitle: undefined,
    metaKeywords: undefined,
    metaDescription: undefined
  };
};

// Helper to enrich place with children and packages
const enrichPlace = async (place) => {
  if (!place) return null;
  
  // Fetch children places
  const children = await allAsync('SELECT * FROM places WHERE parentId = ? AND deletedAt IS NULL', [place.id]);
  
  // Fetch packages associated with this place
  const packages = await allAsync(
    `SELECT p.* 
     FROM packages p 
     JOIN package_places pp ON p.id = pp.packageId 
     WHERE pp.placeId = ? AND p.deletedAt IS NULL AND p.status = 1`,
    [place.id]
  );

  return formatMeta({
    ...place,
    children,
    packages
  });
};

// Helper to enrich article with children
const enrichArticle = async (article) => {
  if (!article) return null;
  
  // Fetch children articles
  const children = await allAsync('SELECT * FROM articles WHERE parentId = ? AND deletedAt IS NULL', [article.id]);

  return formatMeta({
    ...article,
    children
  });
};

// Helper to enrich package with all related data
const enrichPackage = async (pkg) => {
  if (!pkg) return null;

  const itinerary = await allAsync('SELECT * FROM package_itinerary WHERE packageId = ? ORDER BY dayNumber ASC', [pkg.id]);
  const galleryImages = await allAsync('SELECT imageUrl FROM package_gallery WHERE packageId = ?', [pkg.id]);
  const groupPrices = await allAsync('SELECT * FROM package_group_pricing WHERE packageId = ?', [pkg.id]);

  // Fetch trip facts with labels
  const tripFacts = await allAsync(
    `SELECT ptf.categorySlug, pa.name 
     FROM package_trip_facts ptf
     JOIN package_attributes pa ON ptf.attributeId = pa.id
     WHERE ptf.packageId = ?`,
    [pkg.id]
  );

  // Fetch all categories to ensure complete structure
  const allCategories = await allAsync('SELECT slug FROM trip_fact_categories');

  // Format trip facts as object { categorySlug: attributeName }
  const tripFactsObj = {};
  allCategories.forEach(cat => {
    tripFactsObj[cat.slug] = null;
  });

  tripFacts.forEach(tf => {
    tripFactsObj[tf.categorySlug] = tf.name;
  });

  // Inject static fields into tripFacts
  tripFactsObj['status-ribbon'] = pkg.statusRibbon || null;
  tripFactsObj['group-size'] = pkg.groupSize ? String(pkg.groupSize) : null;
  tripFactsObj['max-altitude'] = pkg.maxAltitude ? String(pkg.maxAltitude) : null;

  // Fetch testimonials for this package (exclude soft-deleted)
  const testimonials = await allAsync('SELECT * FROM testimonials WHERE packageId = ? AND deletedAt IS NULL', [pkg.id]);

  // Remove statusRibbon from root package object as it's already in tripFacts
  const { statusRibbon, ...pkgWithoutStatusRibbon } = pkg;

  return formatMeta({
    ...pkgWithoutStatusRibbon,
    itinerary,
    galleryImages: galleryImages.map(img => img.imageUrl),
    groupPrices,
    tripFacts: tripFactsObj,
    testimonials,
    total_testimonials: testimonials.length
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
    const formattedArticles = articles.map(formatMeta);
    res.json(formattedArticles);
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get deleted articles (Trash)
app.get('/api/articles/trash', async (req, res) => {
  try {
    const articles = await allAsync('SELECT * FROM articles WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC');
    const formattedArticles = articles.map(formatMeta);
    res.json(formattedArticles);
  } catch (err) {
    console.error('Error fetching trash:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Home Content
app.get('/api/homecontent', async (req, res) => {
  try {
    const article = await getAsync('SELECT * FROM articles WHERE slug = ?', ['home-content']);
    if (!article) {
      return res.json({ 
        title: 'Home Content', 
        content: '', 
        bannerImage: '',
        meta: { title: '', keywords: '', description: '' }
      });
    }
    res.json(formatMeta(article));
  } catch (err) {
    console.error('Error fetching home content:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Home Content
app.post('/api/homecontent', async (req, res) => {
  const { content, bannerImage, meta } = req.body;
  try {
    const existing = await getAsync('SELECT id FROM articles WHERE slug = ?', ['home-content']);
    
    if (existing) {
      await runAsync(
        'UPDATE articles SET content = ?, bannerImage = ?, metaTitle = ?, metaKeywords = ?, metaDescription = ?, updatedAt = CURRENT_TIMESTAMP WHERE slug = ?',
        [
          content, 
          bannerImage, 
          meta?.title || null, 
          meta?.keywords || null, 
          meta?.description || null, 
          'home-content'
        ]
      );
    } else {
      await runAsync(
        'INSERT INTO articles (title, urlTitle, slug, content, bannerImage, metaTitle, metaKeywords, metaDescription, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [
          'Home Content', 
          'Home Content', 
          'home-content', 
          content, 
          bannerImage,
          meta?.title || null, 
          meta?.keywords || null, 
          meta?.description || null
        ]
      );
    }
    
    res.json({ success: true, message: 'Home content updated successfully' });
  } catch (err) {
    console.error('Error updating home content:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Home Content
app.get('/api/homecontent', async (req, res) => {
  try {
    const article = await getAsync('SELECT * FROM articles WHERE slug = ?', ['home-content']);
    
    if (!article) {
      return res.status(404).json({ success: false, message: 'Home content not found' });
    }

    const formattedArticle = {
      ...article,
      meta: {
        title: article.metaTitle,
        keywords: article.metaKeywords,
        description: article.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    };
    
    res.json(formattedArticle);
  } catch (err) {
    console.error('Error fetching home content:', err);
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

    const enrichedArticle = await enrichArticle(article);
    res.json({ success: true, article: enrichedArticle });
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
    // Check if slug exists globally across all content types
    const slugCheck = await checkSlugExists(slug);
    if (slugCheck.exists) {
      return res.status(400).json({
        success: false,
        message: `Slug already exists in ${slugCheck.table}`
      });
    }

    const now = new Date().toISOString();
    const result = await runAsync(
      `INSERT INTO articles (
        title, urlTitle, slug, parentId, 
        metaTitle, metaKeywords, metaDescription, 
        description, featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        status, pageType, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, urlTitle, slug, parentId || null,
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
        description, featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        status ? 1 : 0, req.body.pageType || 'default', now, now
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

    // Check slug uniqueness globally if changed
    if (slug !== existingArticle.slug) {
      const slugCheck = await checkSlugExists(slug, 'articles', id);
      if (slugCheck.exists) {
        return res.status(400).json({
          success: false,
          message: `Slug already exists in ${slugCheck.table}`
        });
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
        status = ?, pageType = ?, updatedAt = ?
       WHERE id = ?`,
      [
        title, urlTitle, slug, parentId || null,
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
        description, featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        status ? 1 : 0, req.body.pageType || 'default', now, id
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
  const { isFeatured } = req.query;
  try {
    let query = 'SELECT * FROM places WHERE deletedAt IS NULL';
    const params = [];
    
    if (isFeatured !== undefined) {
      query += ' AND isFeatured = ?';
      params.push(isFeatured === 'true' || isFeatured === '1' ? 1 : 0);
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const places = await allAsync(query, params);
    const formattedPlaces = places.map(formatMeta);
    res.json(formattedPlaces);
  } catch (err) {
    console.error('Error fetching places:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get deleted places (Trash)
app.get('/api/places/trash', async (req, res) => {
  try {
    const places = await allAsync('SELECT * FROM places WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC');
    const formattedPlaces = places.map(formatMeta);
    res.json(formattedPlaces);
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
    const formattedPlace = formatMeta(place);
    res.json({ success: true, place: formattedPlace });
  } catch (err) {
    console.error('Error fetching place:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single place by slug
app.get('/api/places/slug/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const place = await getAsync('SELECT * FROM places WHERE slug = ?', [slug]);
    if (!place) {
      return res.status(404).json({ success: false, message: 'Place not found' });
    }

    const enrichedPlace = await enrichPlace(place);
    res.json({ success: true, place: enrichedPlace });
  } catch (err) {
    console.error('Error fetching place by slug:', err);
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
    status, isFeatured
  } = req.body;

  // Basic validation
  if (!title || !urlTitle || !slug) {
    return res.status(400).json({ success: false, message: 'Title, URL Title, and Slug are required' });
  }

  try {
    // Check if slug exists globally across all content types
    const slugCheck = await checkSlugExists(slug);
    if (slugCheck.exists) {
      return res.status(400).json({
        success: false,
        message: `Slug already exists in ${slugCheck.table}`
      });
    }

    const now = new Date().toISOString();
    const result = await runAsync(
      `INSERT INTO places (
        title, urlTitle, slug, parentId, 
        metaTitle, metaKeywords, metaDescription, 
        description, featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        status, isFeatured, pageType, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, urlTitle, slug, parentId || null,
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
        description, featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        status ? 1 : 0, isFeatured ? 1 : 0, req.body.pageType || 'default', now, now
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
    status, isFeatured
  } = req.body;

  try {
    // Check if place exists
    const existingPlace = await getAsync('SELECT * FROM places WHERE id = ?', [id]);
    if (!existingPlace) {
      return res.status(404).json({ success: false, message: 'Place not found' });
    }

    // Check slug uniqueness globally if changed
    if (slug !== existingPlace.slug) {
      const slugCheck = await checkSlugExists(slug, 'places', id);
      if (slugCheck.exists) {
        return res.status(400).json({
          success: false,
          message: `Slug already exists in ${slugCheck.table}`
        });
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
        status = ?, isFeatured = ?, pageType = ?, updatedAt = ?
       WHERE id = ?`,
      [
        title, urlTitle, slug, parentId || null,
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
        description, featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        status ? 1 : 0, isFeatured ? 1 : 0, req.body.pageType || 'default', now, id
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
    relatedTrip, itineraryTitle, status, featured, isBestselling,
    tripFacts, itinerary
  } = req.body;

  // Basic validation
  if (!packageTitle || !urlTitle || !slug) {
    return res.status(400).json({ success: false, message: 'Title, URL Title, and Slug are required' });
  }

  try {
    // Check if slug exists globally across all content types
    const slugCheck = await checkSlugExists(slug);
    if (slugCheck.exists) {
      return res.status(400).json({
        success: false,
        message: `Slug already exists in ${slugCheck.table}`
      });
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
        relatedTrip, itineraryTitle, status, featured, isBestselling, pageType,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        packageTitle, urlTitle, slug, durationValue || 0, durationUnit || 'days',
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
        abstract, details, defaultPrice || 0, groupPriceEnabled ? 1 : 0,
        costInclude, costExclude,
        featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        tripMapImage, tripMapImageAlt, tripMapImageCaption,
        statusRibbon, groupSize, maxAltitude,
        tripHighlights, departureNote, goodToKnow, extraFAQs,
        relatedTrip, itineraryTitle, status ? 1 : 0, featured ? 1 : 0, isBestselling ? 1 : 0, req.body.pageType || 'default',
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
  const { page = 1, limit = 10, search, status, featured, isBestselling } = req.query;
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

    // New featured filter: only include packages where featured flag is true (1)
    if (featured !== undefined) {
      query += ' AND featured = ?';
      countQuery += ' AND featured = ?';
      params.push(featured);
    }

    // New bestselling filter
    if (isBestselling !== undefined) {
      query += ' AND isBestselling = ?';
      countQuery += ' AND isBestselling = ?';
      params.push(isBestselling);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const packages = await allAsync(query, params);
    const countResult = await getAsync(countQuery, params.slice(0, params.length - 2));
    const total = countResult.count;

    // After fetching packages, enrich each with tripFacts JSON string
    // Fetch all categories to ensure complete structure
    const allCategories = await allAsync('SELECT slug FROM trip_fact_categories');

    // After fetching packages, enrich each with tripFacts JSON string
    const enrichedPackages = await Promise.all(packages.map(async (pkg) => {
      try {
        const facts = await allAsync(`
          SELECT ptf.categorySlug, pa.name 
          FROM package_trip_facts ptf
          JOIN package_attributes pa ON ptf.attributeId = pa.id
          WHERE ptf.packageId = ?
        `, [pkg.id]);

        const tripFactsObj = {};
        // Initialize all categories with null
        allCategories.forEach(cat => {
          tripFactsObj[cat.slug] = null;
        });

        // Populate with actual data
        facts.forEach(f => {
          if (f.categorySlug) tripFactsObj[f.categorySlug] = f.name;
        });

        // Inject static fields into tripFacts
        tripFactsObj['status-ribbon'] = pkg.statusRibbon || null;
        tripFactsObj['group-size'] = pkg.groupSize ? String(pkg.groupSize) : null;
        tripFactsObj['max-altitude'] = pkg.maxAltitude ? String(pkg.maxAltitude) : null;

        // Store as JSON string so client can parse it
        pkg.tripFacts = JSON.stringify(tripFactsObj);
      } catch (e) {
        console.error('Error fetching tripFacts for package', pkg.id, e);
        // Fallback with nulls
        const tripFactsObj = {};
        allCategories.forEach(cat => {
          tripFactsObj[cat.slug] = null;
        });
        pkg.tripFacts = JSON.stringify(tripFactsObj);
      }

      // Fetch testimonials for this package
      try {
        const testimonials = await allAsync('SELECT * FROM testimonials WHERE packageId = ? AND deletedAt IS NULL', [pkg.id]);
        pkg.testimonials = testimonials; // keep as array
        pkg.total_testimonials = testimonials.length;
      } catch (e) {
        console.error('Error fetching testimonials for package', pkg.id, e);
        pkg.testimonials = [];
        pkg.total_testimonials = 0;
      }

      // Filter fields if it's a featured request (or just generally optimize)
      // User requested: defaultPrice, duration, durationUnit, featuredImage, featuredImageAlt, featuredImageCaption, groupSize, slug, tripFacts
      // And specifically asked to remove statusRibbon from root if it's there (it is in 'pkg' because 'pkg' is SELECT *).
      
      return {
        id: pkg.id,
        title: pkg.title, // Usually needed for display even if not explicitly listed, but I'll stick to the list + title/id for safety
        defaultPrice: pkg.defaultPrice,
        duration: pkg.duration,
        durationUnit: pkg.durationUnit,
        featuredImage: pkg.featuredImage,
        featuredImageAlt: pkg.featuredImageAlt,
        featuredImageCaption: pkg.featuredImageCaption,
        // groupSize is excluded from root as it is in tripFacts
        slug: pkg.slug,
        tripFacts: pkg.tripFacts,
        // statusRibbon is intentionally excluded from root
        // testimonials array is excluded from featured/list view to save bandwidth
        total_testimonials: pkg.total_testimonials,
        meta: {
          title: pkg.metaTitle,
          keywords: pkg.metaKeywords,
          description: pkg.metaDescription
        }
      };
    }));
    res.status(200).json({
      success: true,
      packages: enrichedPackages,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
    return;

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



    const itinerary = await allAsync(
      `SELECT * FROM package_itinerary WHERE packageId = ? ORDER BY dayNumber ASC`,
      [packageId]
    );

    const groupPrices = await allAsync(
      `SELECT * FROM package_group_pricing WHERE packageId = ? ORDER BY minPerson ASC`,
      [packageId]
    );

    const tripFacts = await allAsync(
      `SELECT ptf.categorySlug, pa.name 
       FROM package_trip_facts ptf
       JOIN package_attributes pa ON ptf.attributeId = pa.id
       WHERE ptf.packageId = ?`,
      [packageId]
    );

    // Fetch all categories to ensure complete structure
    const allCategories = await allAsync('SELECT slug FROM trip_fact_categories');

    // Format trip facts as object { categorySlug: attributeName }
    const tripFactsObj = {};
    allCategories.forEach(cat => {
      tripFactsObj[cat.slug] = null;
    });

    tripFacts.forEach(tf => {
      tripFactsObj[tf.categorySlug] = tf.name;
    });

    // Inject static fields into tripFacts
    tripFactsObj['status-ribbon'] = packageData.statusRibbon || null;
    tripFactsObj['group-size'] = packageData.groupSize ? String(packageData.groupSize) : null;
    tripFactsObj['max-altitude'] = packageData.maxAltitude ? String(packageData.maxAltitude) : null;

    const galleryImages = await allAsync(
      `SELECT imageUrl FROM package_gallery WHERE packageId = ? ORDER BY createdAt ASC`,
      [packageId]
    );

    const testimonials = await allAsync('SELECT * FROM testimonials WHERE packageId = ? AND deletedAt IS NULL', [packageId]);

    res.status(200).json({
      success: true,
      package: {
        ...packageData,
        places,
        tripFacts: tripFactsObj,
        itinerary,
        groupPrices,
        galleryImages: galleryImages.map(g => g.imageUrl),
        testimonials,
        total_testimonials: testimonials.length,
        meta: {
          title: packageData.metaTitle,
          keywords: packageData.metaKeywords,
          description: packageData.metaDescription
        },
        metaTitle: undefined,
        metaKeywords: undefined,
        metaDescription: undefined
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
    relatedTrip, itineraryTitle, status, featured, isBestselling,
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

    // Check slug uniqueness globally if changed
    if (slug !== existingPackage.slug) {
      const slugCheck = await checkSlugExists(slug, 'packages', id);
      if (slugCheck.exists) {
        return res.status(400).json({
          success: false,
          message: `Slug already exists in ${slugCheck.table}`
        });
      }
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
        relatedTrip = ?, itineraryTitle = ?, status = ?, featured = ?, isBestselling = ?, pageType = ?,
        updatedAt = ?
      WHERE id = ?`,
      [
        packageTitle, urlTitle, slug, durationValue || 0, durationUnit || 'days',
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
        abstract, details, defaultPrice || 0, groupPriceEnabled ? 1 : 0,
        costInclude, costExclude,
        featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        tripMapImage, tripMapImageAlt, tripMapImageCaption,
        statusRibbon, groupSize, maxAltitude,
        tripHighlights, departureNote, goodToKnow, extraFAQs,
        relatedTrip, itineraryTitle, status ? 1 : 0, featured ? 1 : 0, isBestselling ? 1 : 0, req.body.pageType || 'default',
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
    avatar, avatarAlt, avatarCaption, bannerImage, bannerImageAlt, bannerImageCaption,
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
        avatar, avatarAlt, avatarCaption, bannerImage, bannerImageAlt, bannerImageCaption,
        metaTitle, metaKeywords, metaDescription,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName, urlTitle, slug, email, description,
        avatar, avatarAlt, avatarCaption, bannerImage, bannerImageAlt, bannerImageCaption,
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
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
    const formattedAuthors = authors.map(a => ({
      ...a,
      meta: {
        title: a.metaTitle,
        keywords: a.metaKeywords,
        description: a.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    }));
    res.status(200).json(formattedAuthors);
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
    const formattedAuthor = {
      ...author,
      meta: {
        title: author.metaTitle,
        keywords: author.metaKeywords,
        description: author.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    };
    res.status(200).json(formattedAuthor);
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
    avatar, avatarAlt, avatarCaption, bannerImage, bannerImageAlt, bannerImageCaption,
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
        avatar = ?, avatarAlt = ?, avatarCaption = ?, bannerImage = ?, bannerImageAlt = ?, bannerImageCaption = ?,
        metaTitle = ?, metaKeywords = ?, metaDescription = ?,
        status = ?, updatedAt = ?
      WHERE id = ?`,
      [
        fullName, urlTitle, slug, email, description,
        avatar, avatarAlt, avatarCaption, bannerImage, bannerImageAlt, bannerImageCaption,
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
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
    const formattedAuthors = authors.map(a => ({
      ...a,
      meta: {
        title: a.metaTitle,
        keywords: a.metaKeywords,
        description: a.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    }));
    res.status(200).json(formattedAuthors);
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

// ========================
// TEAMS API ENDPOINTS
// ========================

// Create new team member
app.post('/api/teams', async (req, res) => {
  const {
    fullName, urlTitle, slug, email, description,
    avatar, avatarAlt, avatarCaption, bannerImage, bannerImageAlt, bannerImageCaption,
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
    const existing = await getAsync('SELECT * FROM teams WHERE LOWER(email) = LOWER(?)', [email]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Check if URL title already exists
    const existingUrl = await getAsync('SELECT * FROM teams WHERE urlTitle = ?', [urlTitle]);
    if (existingUrl) {
      return res.status(400).json({ success: false, message: 'URL Title already exists' });
    }

    // Check if slug already exists
    const existingSlug = await getAsync('SELECT * FROM teams WHERE slug = ?', [slug]);
    if (existingSlug) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const now = new Date().toISOString();
    const result = await runAsync(
      `INSERT INTO teams (
        fullName, urlTitle, slug, email, description,
        avatar, avatarAlt, avatarCaption, bannerImage, bannerImageAlt, bannerImageCaption,
        metaTitle, metaKeywords, metaDescription,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName, urlTitle, slug, email, description,
        avatar, avatarAlt, avatarCaption, bannerImage, bannerImageAlt, bannerImageCaption,
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
        status !== undefined ? status : 1, now, now
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Team member created successfully',
      teamId: result.lastID
    });
  } catch (err) {
    console.error('Error creating team member:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all team members (exclude deleted)
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await allAsync('SELECT * FROM teams WHERE deletedAt IS NULL ORDER BY createdAt DESC');
    const formattedTeams = teams.map(t => ({
      ...t,
      meta: {
        title: t.metaTitle,
        keywords: t.metaKeywords,
        description: t.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    }));
    res.status(200).json(formattedTeams);
  } catch (err) {
    console.error('Error fetching team members:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single team member by ID
app.get('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const team = await getAsync('SELECT * FROM teams WHERE id = ?', [id]);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }
    const formattedTeam = {
      ...team,
      meta: {
        title: team.metaTitle,
        keywords: team.metaKeywords,
        description: team.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    };
    res.status(200).json(formattedTeam);
  } catch (err) {
    console.error('Error fetching team member:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update team member
app.put('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  const {
    fullName, urlTitle, slug, email, description,
    avatar, avatarAlt, avatarCaption, bannerImage, bannerImageAlt, bannerImageCaption,
    metaTitle, metaKeywords, metaDescription, status
  } = req.body;

  // Validation
  if (!fullName || !urlTitle || !slug || !email) {
    return res.status(400).json({ success: false, message: 'Full Name, URL Title, Slug, and Email are required' });
  }

  try {
    // Check if team member exists
    const existing = await getAsync('SELECT * FROM teams WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    // Check if email is taken by another team member
    const emailCheck = await getAsync('SELECT * FROM teams WHERE LOWER(email) = LOWER(?) AND id != ?', [email, id]);
    if (emailCheck) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Check if URL title is taken by another team member
    const urlCheck = await getAsync('SELECT * FROM teams WHERE urlTitle = ? AND id != ?', [urlTitle, id]);
    if (urlCheck) {
      return res.status(400).json({ success: false, message: 'URL Title already exists' });
    }

    // Check if slug is taken by another team member
    const slugCheck = await getAsync('SELECT * FROM teams WHERE slug = ? AND id != ?', [slug, id]);
    if (slugCheck) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const now = new Date().toISOString();
    await runAsync(
      `UPDATE teams SET
        fullName = ?, urlTitle = ?, slug = ?, email = ?, description = ?,
        avatar = ?, avatarAlt = ?, avatarCaption = ?, bannerImage = ?, bannerImageAlt = ?, bannerImageCaption = ?,
        metaTitle = ?, metaKeywords = ?, metaDescription = ?,
        status = ?, updatedAt = ?
      WHERE id = ?`,
      [
        fullName, urlTitle, slug, email, description,
        avatar, avatarAlt, avatarCaption, bannerImage, bannerImageAlt, bannerImageCaption,
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
        status, now, id
      ]
    );

    res.status(200).json({ success: true, message: 'Team member updated successfully' });
  } catch (err) {
    console.error('Error updating team member:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete team member (Soft delete)
app.delete('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const now = new Date().toISOString();
    await runAsync('UPDATE teams SET deletedAt = ? WHERE id = ?', [now, id]);
    res.status(200).json({ success: true, message: 'Team member deleted successfully' });
  } catch (err) {
    console.error('Error deleting team member:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get deleted team members (Trash)
app.get('/api/teams/trash/all', async (req, res) => {
  try {
    const teams = await allAsync('SELECT * FROM teams WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC');
    const formattedTeams = teams.map(t => ({
      ...t,
      meta: {
        title: t.metaTitle,
        keywords: t.metaKeywords,
        description: t.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    }));
    res.status(200).json(formattedTeams);
  } catch (err) {
    console.error('Error fetching trash:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Restore team member
app.put('/api/teams/:id/restore', async (req, res) => {
  const { id } = req.params;
  try {
    await runAsync('UPDATE teams SET deletedAt = NULL WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Team member restored successfully' });
  } catch (err) {
    console.error('Error restoring team member:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Permanent delete team member
app.delete('/api/teams/:id/permanent', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get team member to find images
    const team = await getAsync('SELECT * FROM teams WHERE id = ?', [id]);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    // 2. Delete images from filesystem
    const imagesToDelete = [
      team.avatar,
      team.bannerImage
    ].filter(Boolean);

    for (const imagePath of imagesToDelete) {
      deleteImageFile(imagePath);
    }

    // 3. Delete from database
    await runAsync('DELETE FROM teams WHERE id = ?', [id]);

    res.status(200).json({ success: true, message: 'Team member permanently deleted' });
  } catch (err) {
    console.error('Error permanently deleting team member:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========================
// BLOGS API ENDPOINTS
// ========================

// Get all active blogs
app.get('/api/blogs', async (req, res) => {
  const { isFeatured, isBestselling } = req.query;
  try {
    let query = 'SELECT * FROM blogs WHERE deletedAt IS NULL';
    const params = [];
    if (isFeatured !== undefined) {
      query += ' AND isFeatured = ?';
      params.push(isFeatured);
    }
    if (isBestselling !== undefined) {
      query += ' AND isBestselling = ?';
      params.push(isBestselling);
    }
    query += ' ORDER BY createdAt DESC';
    const blogs = await allAsync(query, params);
    const formattedBlogs = blogs.map(b => ({
      ...b,
      meta: {
        title: b.metaTitle,
        keywords: b.metaKeywords,
        description: b.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    }));
    res.json(formattedBlogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get blogs trash (must be before /:id route)
app.get('/api/blogs/trash', async (req, res) => {
  try {
    const blogs = await allAsync('SELECT * FROM blogs WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC');
    const formattedBlogs = blogs.map(b => ({
      ...b,
      meta: {
        title: b.metaTitle,
        keywords: b.metaKeywords,
        description: b.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    }));
    res.json(formattedBlogs);
  } catch (err) {
    console.error('Error fetching blogs trash:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single blog (by ID or slug)
app.get('/api/blogs/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;
  try {
    let blog;
    if (!isNaN(idOrSlug)) {
      blog = await getAsync('SELECT * FROM blogs WHERE id = ? AND deletedAt IS NULL', [idOrSlug]);
    } else {
      blog = await getAsync('SELECT * FROM blogs WHERE slug = ? AND deletedAt IS NULL', [idOrSlug]);
    }

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    const formattedBlog = {
      ...blog,
      meta: {
        title: blog.metaTitle,
        keywords: blog.metaKeywords,
        description: blog.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    };
    res.json({ success: true, blog: formattedBlog });
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new blog
app.post('/api/blogs', async (req, res) => {
  const {
    title, urlTitle, slug, authorId, publishedDate,
    status, isFeatured, isBestselling, abstract, description,
    metaTitle, metaKeywords, metaDescription,
    featuredImage, featuredImageAlt, featuredImageCaption,
    bannerImage, bannerImageAlt, bannerImageCaption
  } = req.body;

  if (!title || !urlTitle || !slug) {
    return res.status(400).json({ success: false, message: 'Title, URL Title, and Slug are required' });
  }

  try {
    // Check if slug exists globally across all content types
    const slugCheck = await checkSlugExists(slug);
    if (slugCheck.exists) {
      return res.status(400).json({
        success: false,
        message: `Slug already exists in ${slugCheck.table}`
      });
    }

    const now = new Date().toISOString();
    const result = await runAsync(
      `INSERT INTO blogs (
        title, urlTitle, slug, authorId, publishedDate,
        status, isFeatured, isBestselling, abstract, description,
        metaTitle, metaKeywords, metaDescription,
        featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        pageType,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, urlTitle, slug, authorId || null, publishedDate,
        status ? 1 : 0, isFeatured ? 1 : 0, isBestselling ? 1 : 0, abstract, description,
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
        featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        req.body.pageType || 'default',
        now, now
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      blogId: result.lastID
    });
  } catch (err) {
    console.error('Error creating blog:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update blog
app.put('/api/blogs/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title, urlTitle, slug, authorId, publishedDate,
    status, isFeatured, isBestselling, abstract, description,
    metaTitle, metaKeywords, metaDescription,
    featuredImage, featuredImageAlt, featuredImageCaption,
    bannerImage, bannerImageAlt, bannerImageCaption
  } = req.body;

  try {
    const existingBlog = await getAsync('SELECT * FROM blogs WHERE id = ?', [id]);
    if (!existingBlog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Check slug uniqueness globally if changed
    if (slug !== existingBlog.slug) {
      const slugCheck = await checkSlugExists(slug, 'blogs', id);
      if (slugCheck.exists) {
        return res.status(400).json({
          success: false,
          message: `Slug already exists in ${slugCheck.table}`
        });
      }
    }

    // Delete old images if replaced
    if (featuredImage && featuredImage !== existingBlog.featuredImage) {
      deleteImageFile(existingBlog.featuredImage);
    }
    if (bannerImage && bannerImage !== existingBlog.bannerImage) {
      deleteImageFile(existingBlog.bannerImage);
    }

    const now = new Date().toISOString();
    await runAsync(
      `UPDATE blogs SET
        title = ?, urlTitle = ?, slug = ?, authorId = ?, publishedDate = ?,
        status = ?, isFeatured = ?, isBestselling = ?, abstract = ?, description = ?,
        metaTitle = ?, metaKeywords = ?, metaDescription = ?,
        featuredImage = ?, featuredImageAlt = ?, featuredImageCaption = ?,
        bannerImage = ?, bannerImageAlt = ?, bannerImageCaption = ?,
        pageType = ?,
        updatedAt = ?
      WHERE id = ?`,
      [
        title, urlTitle, slug, authorId || null, publishedDate,
        status ? 1 : 0, isFeatured ? 1 : 0, isBestselling ? 1 : 0, abstract, description,
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
        featuredImage, featuredImageAlt, featuredImageCaption,
        bannerImage, bannerImageAlt, bannerImageCaption,
        req.body.pageType || 'default',
        now, id
      ]
    );

    res.status(200).json({ success: true, message: 'Blog updated successfully' });
  } catch (err) {
    console.error('Error updating blog:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Soft delete blog
app.delete('/api/blogs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const now = new Date().toISOString();
    await runAsync('UPDATE blogs SET deletedAt = ? WHERE id = ?', [now, id]);
    res.json({ success: true, message: 'Blog moved to trash' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk Soft Delete Blogs
app.post('/api/blogs/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'No IDs provided' });

  try {
    const now = new Date().toISOString();
    const placeholders = ids.map(() => '?').join(',');

    const result = await runAsync(`UPDATE blogs SET deletedAt = ? WHERE id IN (${placeholders})`, [now, ...ids]);
    res.status(200).json({ success: true, message: `${result.changes} blogs moved to trash` });
  } catch (err) {
    console.error('Error bulk deleting blogs:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Restore single blog
app.post('/api/blogs/:id/restore', async (req, res) => {
  const { id } = req.params;
  try {
    await runAsync('UPDATE blogs SET deletedAt = NULL WHERE id = ?', [id]);
    res.json({ success: true, message: 'Blog restored' });
  } catch (err) {
    console.error('Error restoring blog:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk Restore Blogs
app.post('/api/blogs/bulk-restore', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'No IDs provided' });

  try {
    const placeholders = ids.map(() => '?').join(',');
    const result = await runAsync(`UPDATE blogs SET deletedAt = NULL WHERE id IN (${placeholders})`, ids);
    res.status(200).json({ success: true, message: `${result.changes} blogs restored` });
  } catch (err) {
    console.error('Error bulk restoring blogs:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk Permanent Delete Blogs
app.post('/api/blogs/bulk-delete-permanent', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'No IDs provided' });

  try {
    const placeholders = ids.map(() => '?').join(',');

    // Delete associated images
    const blogsToDelete = await allAsync(`SELECT featuredImage, bannerImage FROM blogs WHERE id IN (${placeholders})`, ids);
    blogsToDelete.forEach(blog => {
      deleteImageFile(blog.featuredImage);
      deleteImageFile(blog.bannerImage);
    });

    const result = await runAsync(`DELETE FROM blogs WHERE id IN (${placeholders})`, ids);
    res.status(200).json({ success: true, message: `${result.changes} blogs permanently deleted` });
  } catch (err) {
    console.error('Error bulk permanent deleting blogs:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========================
// TESTIMONIALS API ENDPOINTS
// ========================

// Create new testimonial
app.post('/api/testimonials', async (req, res) => {
  const {
    reviewTitle, urlTitle, slug, fullName, address, packageId, teamId, date, credit, rating,
    status, isFeatured, isBestselling, description, metaTitle, metaKeywords, metaDescription,
    avatar, avatarAlt, avatarCaption
  } = req.body;

  // Validation
  if (!reviewTitle || !urlTitle || !slug || !fullName || !date || !metaTitle) {
    return res.status(400).json({ success: false, message: 'Review Title, URL Title, Slug, Full Name, Date, and Meta Title are required' });
  }

  try {
    // Check if slug exists
    const existing = await getAsync('SELECT id FROM testimonials WHERE slug = ?', [slug]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const now = new Date().toISOString();
    const result = await runAsync(
      `INSERT INTO testimonials (
        reviewTitle, urlTitle, slug, fullName, address, packageId, teamId, date, credit, rating,
        status, isFeatured, isBestselling, description, metaTitle, metaKeywords, metaDescription,
        avatar, avatarAlt, avatarCaption, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reviewTitle, urlTitle, slug, fullName, address, packageId || null, teamId || null, date, credit, rating,
        status ? 1 : 0, isFeatured ? 1 : 0, isBestselling ? 1 : 0, description, 
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
        avatar, avatarAlt, avatarCaption, now, now
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      testimonialId: result.lastID
    });
  } catch (err) {
    console.error('Error creating testimonial:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all testimonials (exclude deleted)
app.get('/api/testimonials', async (req, res) => {
  const { isFeatured, isBestselling } = req.query;
  try {
    let query = 'SELECT * FROM testimonials WHERE deletedAt IS NULL';
    const params = [];
    if (isFeatured !== undefined) {
      query += ' AND isFeatured = ?';
      params.push(isFeatured);
    }
    if (isBestselling !== undefined) {
      query += ' AND isBestselling = ?';
      params.push(isBestselling);
    }
    query += ' ORDER BY createdAt DESC';
    const testimonials = await allAsync(query, params);
    const formattedTestimonials = testimonials.map(t => ({
      ...t,
      meta: {
        title: t.metaTitle,
        keywords: t.metaKeywords,
        description: t.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    }));
    res.status(200).json(formattedTestimonials);
  } catch (err) {
    console.error('Error fetching testimonials:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single testimonial by ID
app.get('/api/testimonials/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const testimonial = await getAsync('SELECT * FROM testimonials WHERE id = ?', [id]);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    const formattedTestimonial = {
      ...testimonial,
      meta: {
        title: testimonial.metaTitle,
        keywords: testimonial.metaKeywords,
        description: testimonial.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    };
    res.status(200).json(formattedTestimonial);
  } catch (err) {
    console.error('Error fetching testimonial:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update testimonial
app.put('/api/testimonials/:id', async (req, res) => {
  const { id } = req.params;
  const {
    reviewTitle, urlTitle, slug, fullName, address, packageId, teamId, date, credit, rating,
    status, isFeatured, isBestselling, description, metaTitle, metaKeywords, metaDescription,
    avatar, avatarAlt, avatarCaption
  } = req.body;

  // Validation
  if (!reviewTitle || !urlTitle || !slug || !fullName || !date || !metaTitle) {
    return res.status(400).json({ success: false, message: 'Review Title, URL Title, Slug, Full Name, Date, and Meta Title are required' });
  }

  try {
    // Check if testimonial exists
    const existing = await getAsync('SELECT * FROM testimonials WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    // Check slug uniqueness if changed
    if (slug !== existing.slug) {
      const slugCheck = await getAsync('SELECT id FROM testimonials WHERE slug = ? AND id != ?', [slug, id]);
      if (slugCheck) {
        return res.status(400).json({ success: false, message: 'Slug already exists' });
      }
    }

    const now = new Date().toISOString();
    await runAsync(
      `UPDATE testimonials SET
        reviewTitle = ?, urlTitle = ?, slug = ?, fullName = ?, address = ?, packageId = ?, teamId = ?, date = ?, credit = ?, rating = ?,
        status = ?, isFeatured = ?, isBestselling = ?, description = ?, metaTitle = ?, metaKeywords = ?, metaDescription = ?,
        avatar = ?, avatarAlt = ?, avatarCaption = ?, updatedAt = ?
      WHERE id = ?`,
      [
        reviewTitle, urlTitle, slug, fullName, address, packageId || null, teamId || null, date, credit, rating,
        status ? 1 : 0, isFeatured ? 1 : 0, isBestselling ? 1 : 0, description, 
        req.body.meta?.title || metaTitle, 
        req.body.meta?.keywords || metaKeywords, 
        req.body.meta?.description || metaDescription,
        avatar, avatarAlt, avatarCaption, now, id
      ]
    );

    res.status(200).json({ success: true, message: 'Testimonial updated successfully' });
  } catch (err) {
    console.error('Error updating testimonial:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Soft delete testimonial
app.delete('/api/testimonials/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const now = new Date().toISOString();
    await runAsync('UPDATE testimonials SET deletedAt = ? WHERE id = ?', [now, id]);
    res.status(200).json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (err) {
    console.error('Error deleting testimonial:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get deleted testimonials (Trash)
app.get('/api/testimonials/trash/all', async (req, res) => {
  try {
    const testimonials = await allAsync('SELECT * FROM testimonials WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC');
    const formattedTestimonials = testimonials.map(t => ({
      ...t,
      meta: {
        title: t.metaTitle,
        keywords: t.metaKeywords,
        description: t.metaDescription
      },
      metaTitle: undefined,
      metaKeywords: undefined,
      metaDescription: undefined
    }));
    res.status(200).json(formattedTestimonials);
  } catch (err) {
    console.error('Error fetching trash:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Restore testimonial
app.put('/api/testimonials/:id/restore', async (req, res) => {
  const { id } = req.params;
  try {
    await runAsync('UPDATE testimonials SET deletedAt = NULL WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Testimonial restored successfully' });
  } catch (err) {
    console.error('Error restoring testimonial:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Permanent delete testimonial
app.delete('/api/testimonials/:id/permanent', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get testimonial to find images
    const testimonial = await getAsync('SELECT * FROM testimonials WHERE id = ?', [id]);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    // 2. Delete images from filesystem
    if (testimonial.avatar) {
      deleteImageFile(testimonial.avatar);
    }

    // 3. Delete from database
    await runAsync('DELETE FROM testimonials WHERE id = ?', [id]);

    res.status(200).json({ success: true, message: 'Testimonial permanently deleted' });
  } catch (err) {
    console.error('Error permanently deleting testimonial:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk delete testimonials (soft delete)
app.post('/api/testimonials/bulk-delete', async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No testimonial IDs provided' });
  }

  try {
    const now = new Date().toISOString();
    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE testimonials SET deletedAt = ? WHERE id IN (${placeholders})`;
    await runAsync(query, [now, ...ids]);

    res.status(200).json({ success: true, message: `${ids.length} testimonial(s) deleted successfully` });
  } catch (err) {
    console.error('Error bulk deleting testimonials:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk restore testimonials
app.post('/api/testimonials/bulk-restore', async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No testimonial IDs provided' });
  }

  try {
    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE testimonials SET deletedAt = NULL WHERE id IN (${placeholders})`;
    await runAsync(query, ids);

    res.status(200).json({ success: true, message: `${ids.length} testimonial(s) restored successfully` });
  } catch (err) {
    console.error('Error bulk restoring testimonials:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk permanent delete testimonials
app.post('/api/testimonials/bulk-delete-permanent', async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No testimonial IDs provided' });
  }

  try {
    // 1. Get all testimonials to find images
    const placeholders = ids.map(() => '?').join(',');
    const testimonials = await allAsync(`SELECT * FROM testimonials WHERE id IN (${placeholders})`, ids);

    // 2. Delete images from filesystem
    for (const testimonial of testimonials) {
      if (testimonial.avatar) {
        deleteImageFile(testimonial.avatar);
      }
    }

    // 3. Delete from database
    const deleteQuery = `DELETE FROM testimonials WHERE id IN (${placeholders})`;
    await runAsync(deleteQuery, ids);

    res.status(200).json({ success: true, message: `${ids.length} testimonial(s) permanently deleted` });
  } catch (err) {
    console.error('Error bulk deleting testimonials permanently:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========================
// MENUS API ENDPOINTS
// ========================

// Get all menus
app.get('/api/menus', async (req, res) => {
  try {
    const menus = await allAsync("SELECT * FROM menus WHERE deletedAt IS NULL AND (urlSegmentType != 'package' OR urlSegmentType IS NULL) ORDER BY displayOrder, createdAt");
    res.status(200).json(menus);
  } catch (err) {
    console.error('Error fetching menus:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get menus by type (header/footer)
app.get('/api/menus/type/:type', async (req, res) => {
  const { type } = req.params;
  try {
    const menus = await allAsync("SELECT * FROM menus WHERE type = ? AND status = 1 AND deletedAt IS NULL AND (urlSegmentType != 'package' OR urlSegmentType IS NULL) ORDER BY displayOrder, createdAt", [type]);
    
    // Build hierarchical structure
    const buildTree = (items, packagesByPlace) => {
      const itemMap = new Map();
      const roots = [];

      // First pass: create map of all items with children array
      items.forEach(item => {
        itemMap.set(item.id, { ...item, children: [] });
      });

      // Second pass: build tree structure
      items.forEach(item => {
        const node = itemMap.get(item.id);
        
        // Dynamic Package Injection: If this is a Place menu item, add its packages
        if (item.urlSegmentType === 'place' && item.urlSegmentId) {
          const placePackages = packagesByPlace[item.urlSegmentId] || [];
          placePackages.forEach(pkg => {
            node.children.push({
              id: `pkg-${pkg.id}`, // specific ID format to avoid collision
              title: pkg.title,
              url: `/package/${pkg.slug}`, // Assuming package URL structure
              type: item.type,
              parentId: item.id,
              children: [], // Packages don't have children for now
              isDynamic: true // Flag to identify dynamic items
            });
          });
        }

        if (item.parentId === null || item.parentId === 0) {
          roots.push(node);
        } else {
          const parent = itemMap.get(item.parentId);
          if (parent) {
            parent.children.push(node);
          }
        }
      });

      return roots;
    };

    // Fetch all packages linked to places
    const packages = await allAsync(`
      SELECT p.id, p.title, p.slug, pp.placeId 
      FROM packages p 
      JOIN package_places pp ON p.id = pp.packageId 
      WHERE p.status = 1 AND p.deletedAt IS NULL
    `);

    // Group packages by placeId
    const packagesByPlace = {};
    packages.forEach(pkg => {
      if (!packagesByPlace[pkg.placeId]) {
        packagesByPlace[pkg.placeId] = [];
      }
      packagesByPlace[pkg.placeId].push(pkg);
    });

    const tree = buildTree(menus, packagesByPlace);
    res.status(200).json(tree);
  } catch (err) {
    console.error('Error fetching menus by type:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single menu by ID
app.get('/api/menus/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const menu = await getAsync('SELECT * FROM menus WHERE id = ?', [id]);
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }
    res.status(200).json(menu);
  } catch (err) {
    console.error('Error fetching menu:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new menu
app.post('/api/menus', async (req, res) => {
  const { title, type, parentId, urlSegmentType, urlSegmentId, url, status, displayOrder } = req.body;

  if (!title || !type) {
    return res.status(400).json({ success: false, message: 'Title and type are required' });
  }

  try {
    const now = new Date().toISOString();

    const result = await runAsync(
      `INSERT INTO menus (title, type, parentId, urlSegmentType, urlSegmentId, url, status, displayOrder, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, type, parentId || null, urlSegmentType || null, urlSegmentId || null, url || null, status ? 1 : 0, displayOrder || 0, now, now]
    );

    const newMenuId = result.lastID;

    // Automatically import child places/articles as sub-menus
    if (urlSegmentType && urlSegmentId) {
      try {
        // Recursive function to handle deep place hierarchy
        const createPlaceHierarchy = async (parentEntityId, parentMenuId) => {
          // 1. Find child places
          const childPlaces = await allAsync('SELECT * FROM places WHERE parentId = ? AND deletedAt IS NULL', [parentEntityId]);

          for (const child of childPlaces) {
            const childUrl = `/${child.slug}`;
            const res = await runAsync(
              `INSERT INTO menus (title, type, parentId, urlSegmentType, urlSegmentId, url, status, displayOrder, createdAt, updatedAt) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [child.title, type, parentMenuId, 'place', child.id, childUrl, 1, 0, now, now]
            );
            const childMenuId = res.lastID;

            // 2. Recurse for deeper places (Grandchildren, etc.)
            await createPlaceHierarchy(child.id, childMenuId);

            // 3. Add packages for this child place
            const linkedPackages = await allAsync(`
              SELECT p.* 
              FROM packages p
              JOIN package_places pp ON p.id = pp.packageId
              WHERE pp.placeId = ? AND p.deletedAt IS NULL AND p.status = 1
            `, [child.id]);

            if (linkedPackages && linkedPackages.length > 0) {
              for (const pkg of linkedPackages) {
                const pkgUrl = `/${pkg.slug}`;
                await runAsync(
                  `INSERT INTO menus (title, type, parentId, urlSegmentType, urlSegmentId, url, status, displayOrder, createdAt, updatedAt) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [pkg.title, type, childMenuId, 'package', pkg.id, pkgUrl, 1, 0, now, now]
                );
              }
            }
          }
        };

        if (urlSegmentType === 'place') {
          // Start recursion for the root place
          await createPlaceHierarchy(urlSegmentId, newMenuId);

          // Also check for packages directly linked to the ROOT place
          const rootPackages = await allAsync(`
              SELECT p.* 
              FROM packages p
              JOIN package_places pp ON p.id = pp.packageId
              WHERE pp.placeId = ? AND p.deletedAt IS NULL AND p.status = 1
            `, [urlSegmentId]);

          if (rootPackages && rootPackages.length > 0) {
            for (const pkg of rootPackages) {
              const pkgUrl = `/${pkg.slug}`;
              await runAsync(
                `INSERT INTO menus (title, type, parentId, urlSegmentType, urlSegmentId, url, status, displayOrder, createdAt, updatedAt) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [pkg.title, type, newMenuId, 'package', pkg.id, pkgUrl, 1, 0, now, now]
              );
            }
          }

        } else if (urlSegmentType === 'article') {
          // Keep simple logic for articles (single level for now)
          const children = await allAsync('SELECT * FROM articles WHERE parentId = ? AND deletedAt IS NULL', [urlSegmentId]);
          for (const child of children) {
            const childUrl = `/${child.slug}`;
            await runAsync(
              `INSERT INTO menus (title, type, parentId, urlSegmentType, urlSegmentId, url, status, displayOrder, createdAt, updatedAt) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [child.title, type, newMenuId, 'article', child.id, childUrl, 1, 0, now, now]
            );
          }
        }

      } catch (autoErr) {
        console.error('Error auto-creating sub-menus:', autoErr);
        // Don't fail the main request if auto-creation fails, but log it.
      }
    }

    res.status(201).json({
      success: true,
      message: 'Menu created successfully',
      menuId: newMenuId
    });
  } catch (err) {
    console.error('Error creating menu:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update menu
app.put('/api/menus/:id', async (req, res) => {
  const { id } = req.params;
  const { title, type, parentId, urlSegmentType, urlSegmentId, url, status, displayOrder } = req.body;

  if (!title || !type) {
    return res.status(400).json({ success: false, message: 'Title and type are required' });
  }

  try {
    const existing = await getAsync('SELECT * FROM menus WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    const now = new Date().toISOString();

    await runAsync(
      `UPDATE menus SET title = ?, type = ?, parentId = ?, urlSegmentType = ?, urlSegmentId = ?, url = ?, status = ?, displayOrder = ?, updatedAt = ? WHERE id = ?`,
      [title, type, parentId || null, urlSegmentType || null, urlSegmentId || null, url || null, status ? 1 : 0, displayOrder || 0, now, id]
    );

    res.status(200).json({ success: true, message: 'Menu updated successfully' });
  } catch (err) {
    console.error('Error updating menu:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete menu
app.delete('/api/menus/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const now = new Date().toISOString();
    // Soft delete child menus
    await runAsync('UPDATE menus SET deletedAt = ? WHERE parentId = ?', [now, id]);
    // Soft delete parent menu
    await runAsync('UPDATE menus SET deletedAt = ? WHERE id = ?', [now, id]);
    res.status(200).json({ success: true, message: 'Menu deleted successfully' });
  } catch (err) {
    console.error('Error deleting menu:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get deleted menus (Trash)
app.get('/api/menus/trash/all', async (req, res) => {
  try {
    const menus = await allAsync('SELECT * FROM menus WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC');
    res.status(200).json(menus);
  } catch (err) {
    console.error('Error fetching trash:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Restore menu
app.put('/api/menus/:id/restore', async (req, res) => {
  const { id } = req.params;
  try {
    await runAsync('UPDATE menus SET deletedAt = NULL WHERE id = ?', [id]);
    // Also restore children? Maybe not automatically, or yes?
    // Usually restore is per item, but if parent is restored, children might be expected.
    // But for simplicity, let's just restore the item.
    // Actually, if we soft-deleted children, we should probably restore them too if they were deleted at the same time?
    // But tracking that is hard. Let's just restore the item for now.
    res.status(200).json({ success: true, message: 'Menu restored successfully' });
  } catch (err) {
    console.error('Error restoring menu:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/menus/:id/permanent', async (req, res) => {
  const { id } = req.params;
  try {
    // Hard delete children first
    await runAsync('DELETE FROM menus WHERE parentId = ?', [id]);
    // Hard delete parent
    await runAsync('DELETE FROM menus WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Menu permanently deleted' });
  } catch (err) {
    console.error('Error permanently deleting menu:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk delete menus (soft delete)
app.post('/api/menus/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid menu IDs' });
  }

  try {
    const now = new Date().toISOString();
    for (const id of ids) {
      await runAsync('UPDATE menus SET deletedAt = ? WHERE id = ?', [now, id]);
      // Also soft delete children
      await runAsync('UPDATE menus SET deletedAt = ? WHERE parentId = ?', [now, id]);
    }
    res.status(200).json({ success: true, message: 'Menus deleted successfully' });
  } catch (err) {
    console.error('Error bulk deleting menus:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk restore menus
app.post('/api/menus/bulk-restore', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid menu IDs' });
  }

  try {
    for (const id of ids) {
      await runAsync('UPDATE menus SET deletedAt = NULL WHERE id = ?', [id]);
    }
    res.status(200).json({ success: true, message: 'Menus restored successfully' });
  } catch (err) {
    console.error('Error bulk restoring menus:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk permanent delete menus
app.post('/api/menus/bulk-delete-permanent', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid menu IDs' });
  }

  try {
    for (const id of ids) {
      // Hard delete children first
      await runAsync('DELETE FROM menus WHERE parentId = ?', [id]);
      // Hard delete parent
      await runAsync('DELETE FROM menus WHERE id = ?', [id]);
    }
    res.status(200).json({ success: true, message: 'Menus permanently deleted' });
  } catch (err) {
    console.error('Error bulk permanent deleting menus:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ========================
// SLUG RESOLUTION
// ========================

app.get('/api/resolve-slug/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    // 1. Check Places
    const place = await getAsync('SELECT * FROM places WHERE slug = ? AND deletedAt IS NULL', [slug]);
    if (place) {
      const enrichedPlace = await enrichPlace(place);
      return res.json({
        datatype: 'place',
        content: enrichedPlace
      });
    }

    // 2. Check Packages
    const pkg = await getAsync('SELECT * FROM packages WHERE slug = ? AND deletedAt IS NULL', [slug]);
    if (pkg) {
      const enrichedPackage = await enrichPackage(pkg);
      return res.json({
        datatype: 'package',
        content: enrichedPackage
      });
    }

    // 3. Check Articles
    const article = await getAsync('SELECT * FROM articles WHERE slug = ? AND deletedAt IS NULL', [slug]);
    if (article) {
      const enrichedArticle = await enrichArticle(article);
      return res.json({
        datatype: 'article',
        content: enrichedArticle
      });
    }

    // 4. Check Blogs
    const blog = await getAsync('SELECT * FROM blogs WHERE slug = ? AND deletedAt IS NULL', [slug]);
    if (blog) {
      return res.json({
        datatype: 'blog',
        content: formatMeta(blog)
      });
    }

    // If no match found
    return res.status(404).json({ success: false, message: 'Content not found' });

  } catch (err) {
    console.error('Error resolving slug:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========================
// GLOBAL SETTINGS API
// ========================

// Get global settings
app.get('/api/settings', async (req, res) => {
  try {
    // We assume there's only one row for settings, or we take the first one
    const settings = await getAsync('SELECT * FROM settings ORDER BY id ASC LIMIT 1');
    if (settings) {
      const formattedSettings = {
        ...settings,
        defaultMeta: {
          title: settings.defaultMetaTitle,
          keywords: settings.defaultMetaKeywords,
          description: settings.defaultMetaDescription
        },
        defaultMetaTitle: undefined,
        defaultMetaKeywords: undefined,
        defaultMetaDescription: undefined
      };
      res.json(formattedSettings);
    } else {
      res.json({});
    }
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Public Global Data endpoint
app.get('/api/GlobalData', async (req, res) => {
  try {
    const settings = await getAsync('SELECT * FROM settings ORDER BY id ASC LIMIT 1');
    if (settings) {
      const formattedSettings = {
        ...settings,
        defaultMeta: {
          title: settings.defaultMetaTitle,
          keywords: settings.defaultMetaKeywords,
          description: settings.defaultMetaDescription
        },
        defaultMetaTitle: undefined,
        defaultMetaKeywords: undefined,
        defaultMetaDescription: undefined
      };
      res.json(formattedSettings);
    } else {
      res.json({});
    }
  } catch (err) {
    console.error('Error fetching global data:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update global settings
app.post('/api/settings', async (req, res) => {
  const {
    viatorLink, tourradarLink, tripAdvisorLink,
    defaultMetaTitle, defaultMetaKeywords, defaultMetaDescription,
    youtubeLink, pinterestLink, linkedinLink, instagramLink, twitterLink, facebookLink,
    contactPerson1, contactPerson2, establishedYear, shortDescription,
    mobileNumber1, mobileNumber2, phoneNumber, postBox, address, googleMapLocation, companyName
  } = req.body;

  try {
    // Check if a row exists
    const existing = await getAsync('SELECT id FROM settings ORDER BY id ASC LIMIT 1');
    const now = new Date().toISOString();

    if (existing) {
      // Update existing
      await runAsync(`
        UPDATE settings SET
          viatorLink = ?, tourradarLink = ?, tripAdvisorLink = ?,
          defaultMetaDescription = ?, defaultMetaKeywords = ?, defaultMetaTitle = ?,
          youtubeLink = ?, pinterestLink = ?, linkedinLink = ?, instagramLink = ?, twitterLink = ?, facebookLink = ?,
          contactPerson1 = ?, contactPerson2 = ?, establishedYear = ?, shortDescription = ?,
          mobileNumber1 = ?, mobileNumber2 = ?, phoneNumber = ?, postBox = ?, address = ?, googleMapLocation = ?, companyName = ?,
          updatedAt = ?
        WHERE id = ?
      `, [
        viatorLink, tourradarLink, tripAdvisorLink,
        req.body.defaultMeta?.description || defaultMetaDescription, 
        req.body.defaultMeta?.keywords || defaultMetaKeywords, 
        req.body.defaultMeta?.title || defaultMetaTitle,
        youtubeLink, pinterestLink, linkedinLink, instagramLink, twitterLink, facebookLink,
        contactPerson1, contactPerson2, establishedYear, shortDescription,
        mobileNumber1, mobileNumber2, phoneNumber, postBox, address, googleMapLocation, companyName,
        now, existing.id
      ]);
      res.json({ success: true, message: 'Settings updated' });
    } else {
      // Insert new
      await runAsync(`
        INSERT INTO settings (
          viatorLink, tourradarLink, tripAdvisorLink,
          defaultMetaDescription, defaultMetaKeywords, defaultMetaTitle,
          youtubeLink, pinterestLink, linkedinLink, instagramLink, twitterLink, facebookLink,
          contactPerson1, contactPerson2, establishedYear, shortDescription,
          mobileNumber1, mobileNumber2, phoneNumber, postBox, address, googleMapLocation, companyName,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        viatorLink, tourradarLink, tripAdvisorLink,
        req.body.defaultMeta?.description || defaultMetaDescription, 
        req.body.defaultMeta?.keywords || defaultMetaKeywords, 
        req.body.defaultMeta?.title || defaultMetaTitle,
        youtubeLink, pinterestLink, linkedinLink, instagramLink, twitterLink, facebookLink,
        contactPerson1, contactPerson2, establishedYear, shortDescription,
        mobileNumber1, mobileNumber2, phoneNumber, postBox, address, googleMapLocation, companyName,
        now
      ]);
      res.json({ success: true, message: 'Settings created' });
    }
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========================
// HERO SECTION API
// ========================

// Get hero section
app.get('/api/hero', async (req, res) => {
  try {
    const hero = await getAsync('SELECT * FROM hero_sections ORDER BY id ASC LIMIT 1');
    res.json(hero || {});
  } catch (err) {
    console.error('Error fetching hero section:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update hero section
app.post('/api/hero', async (req, res) => {
  const { image, title, subtitle } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, message: 'Image is required' });
  }

  try {
    const existing = await getAsync('SELECT id FROM hero_sections ORDER BY id ASC LIMIT 1');
    const now = new Date().toISOString();

    if (existing) {
      await runAsync(`
        UPDATE hero_sections SET
          image = ?, title = ?, subtitle = ?, updatedAt = ?
        WHERE id = ?
      `, [image, title, subtitle, now, existing.id]);
      res.json({ success: true, message: 'Hero section updated' });
    } else {
      await runAsync(`
        INSERT INTO hero_sections (image, title, subtitle, updatedAt)
        VALUES (?, ?, ?, ?)
      `, [image, title, subtitle, now]);
      res.json({ success: true, message: 'Hero section created' });
    }
  } catch (err) {
    console.error('Error saving hero section:', err);
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

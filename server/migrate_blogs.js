const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath);

const run = (sql) => {
  return new Promise((resolve, reject) => {
    db.run(sql, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const migrate = async () => {
  try {
    console.log('Creating blogs table...');
    await run(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        urlTitle TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        authorId INTEGER,
        publishedDate TEXT,
        status INTEGER DEFAULT 0,
        isFeatured INTEGER DEFAULT 0,
        abstract TEXT,
        description TEXT,
        metaTitle TEXT,
        metaKeywords TEXT,
        metaDescription TEXT,
        featuredImage TEXT,
        featuredImageAlt TEXT,
        featuredImageCaption TEXT,
        bannerImage TEXT,
        bannerImageAlt TEXT,
        bannerImageCaption TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        deletedAt TEXT,
        FOREIGN KEY (authorId) REFERENCES authors(id)
      )
    `);
    console.log('Blogs table created successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.close();
  }
};

migrate();

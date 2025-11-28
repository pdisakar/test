// db.js – simple SQLite helper for the server
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open SQLite DB:', err);
  } else {
    console.log('Connected to SQLite DB at', dbPath);
  }
});

// Run migrations – create tables if they don't exist
const init = () => {
  const createUsersTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      userType TEXT NOT NULL CHECK(userType IN ('super-user','admin')),
      status INTEGER NOT NULL CHECK(status IN (0,1)),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `;
  
  const createArticlesTableSQL = `
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      urlTitle TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      parentId INTEGER,
      metaTitle TEXT,
      metaKeywords TEXT,
      metaDescription TEXT,
      description TEXT,
      featuredImage TEXT,
      featuredImageAlt TEXT,
      featuredImageCaption TEXT,
      bannerImage TEXT,
      bannerImageAlt TEXT,
      bannerImageCaption TEXT,
      status INTEGER DEFAULT 0,
      deletedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (parentId) REFERENCES articles(id)
    );
  `;
  
  const createPlacesTableSQL = `
    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      urlTitle TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      parentId INTEGER,
      metaTitle TEXT,
      metaKeywords TEXT,
      metaDescription TEXT,
      description TEXT,
      featuredImage TEXT,
      featuredImageAlt TEXT,
      featuredImageCaption TEXT,
      bannerImage TEXT,
      bannerImageAlt TEXT,
      bannerImageCaption TEXT,
      status INTEGER DEFAULT 0,
      deletedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (parentId) REFERENCES places(id)
    );
  `;
  
  db.run(createUsersTableSQL, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('Users table ready');
  });
  
  db.run(createArticlesTableSQL, (err) => {
    if (err) console.error('Error creating articles table:', err);
    else console.log('Articles table ready');
  });
  
  db.run(createPlacesTableSQL, (err) => {
    if (err) console.error('Error creating places table:', err);
    else console.log('Places table ready');
  });

  const createPackageAttributesTableSQL = `
    CREATE TABLE IF NOT EXISTS package_attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT
    );
  `;

  db.run(createPackageAttributesTableSQL, (err) => {
    if (err) console.error('Error creating package_attributes table:', err);
    else console.log('Package attributes table ready');
  });

  const createTripFactCategoriesTableSQL = `
    CREATE TABLE IF NOT EXISTS trip_fact_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      createdAt TEXT,
      updatedAt TEXT
    );
  `;

  db.run(createTripFactCategoriesTableSQL, (err) => {
    if (err) console.error('Error creating trip_fact_categories table:', err);
    else console.log('Trip fact categories table ready');
  });

  const createAuthorsTableSQL = `
    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      urlTitle TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      description TEXT,
      avatar TEXT,
      avatarCaption TEXT,
      bannerImage TEXT,
      metaTitle TEXT,
      metaKeywords TEXT,
      metaDescription TEXT,
      status INTEGER DEFAULT 1,
      deletedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `;

  db.run(createAuthorsTableSQL, (err) => {
    if (err) console.error('Error creating authors table:', err);
    else console.log('Authors table ready');
  });
};

init();

// Helper wrappers returning promises
const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // this.lastID, this.changes
    });
  });
};

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  runAsync,
  getAsync,
  allAsync,
};

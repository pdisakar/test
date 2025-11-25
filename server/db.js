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

// Run migrations – create users table if it doesn't exist
const init = () => {
  const createTableSQL = `
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
  db.run(createTableSQL, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('Users table ready');
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

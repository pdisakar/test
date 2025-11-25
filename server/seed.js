const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'users.db');

// Create a new connection just for seeding
const seedDB = async () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite DB for seeding');
      
      // Create table first
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
        if (err) {
          db.close();
          reject(err);
          return;
        }
        
        console.log('Users table ready');
        
        // Check if admin exists
        db.get('SELECT * FROM users WHERE email = ?', ['admin@mail.com'], (err, admin) => {
          if (err) {
            db.close();
            reject(err);
            return;
          }
          
          if (!admin) {
            // Insert admin
            db.run(
              `INSERT INTO users (name, email, password, userType, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                'Super Admin',
                'admin@mail.com',
                '1234567',
                'super-user',
                1,
                new Date().toISOString(),
                new Date().toISOString()
              ],
              (err) => {
                if (err) {
                  db.close();
                  reject(err);
                  return;
                }
                
                console.log('✅ Default admin user created successfully!');
                console.log('   Email: admin@mail.com');
                console.log('   Password: 1234567');
                
                // Close the database connection
                db.close((err) => {
                  if (err) reject(err);
                  else resolve();
                });
              }
            );
          } else {
            console.log('ℹ️  Default admin user already exists');
            console.log('   Email: admin@mail.com');
            console.log('   Password: 1234567');
            
            // Close the database connection
            db.close((err) => {
              if (err) reject(err);
              else resolve();
            });
          }
        });
      });
    });
  });
};

seedDB()
  .then(() => {
    console.log('\n✅ Seeding completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error seeding database:', err);
    process.exit(1);
  });

// Migration script to recreate menus table with correct schema
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to open SQLite DB:', err);
        process.exit(1);
    } else {
        console.log('Connected to SQLite DB at', dbPath);
    }
});

// Backup existing data (if any)
db.all("SELECT * FROM menus", (err, existingMenus) => {
    if (err) {
        console.error('Error reading existing menus:', err);
    } else if (existingMenus && existingMenus.length > 0) {
        console.log(`Found ${existingMenus.length} existing menu(s). Backing up...`);
        console.log(JSON.stringify(existingMenus, null, 2));
    }

    // Drop the old table
    db.run("DROP TABLE IF EXISTS menus", (err) => {
        if (err) {
            console.error('Error dropping old menus table:', err);
            db.close();
            process.exit(1);
        }

        console.log('✓ Dropped old menus table');

        // Create the new table with correct schema
        const createMenusTableSQL = `
      CREATE TABLE menus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        parentId INTEGER,
        urlSegmentType TEXT,
        urlSegmentId INTEGER,
        url TEXT,
        status INTEGER DEFAULT 1,
        displayOrder INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `;

        db.run(createMenusTableSQL, (err) => {
            if (err) {
                console.error('Error creating new menus table:', err);
                db.close();
                process.exit(1);
            }

            console.log('✓ Created new menus table with correct schema');

            // Verify the new structure
            db.all("PRAGMA table_info(menus)", (err, columns) => {
                if (err) {
                    console.error('Error verifying table:', err);
                } else {
                    console.log('\nNew menus table structure:');
                    console.log('---------------------------');
                    columns.forEach(col => {
                        console.log(`  ${col.name.padEnd(20)} ${col.type.padEnd(10)} ${col.notnull ? 'NOT NULL' : 'NULL'}`);
                    });
                }

                db.close();
                console.log('\n✓ Migration completed successfully!');
                process.exit(0);
            });
        });
    });
});

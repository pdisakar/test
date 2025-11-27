const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open SQLite DB:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite DB at', dbPath);
});

const runAsync = (sql) => {
  return new Promise((resolve, reject) => {
    db.run(sql, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const migrate = async () => {
  try {
    console.log('Starting packages migration...');

    // 1. packages table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        urlTitle TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        duration INTEGER NOT NULL,
        durationUnit TEXT NOT NULL DEFAULT 'days',
        metaTitle TEXT,
        metaKeywords TEXT,
        metaDescription TEXT,
        abstract TEXT,
        details TEXT,
        defaultPrice REAL,
        groupPriceEnabled INTEGER DEFAULT 0 CHECK(groupPriceEnabled IN (0,1)),
        costInclude TEXT,
        costExclude TEXT,
        featuredImage TEXT,
        featuredImageAlt TEXT,
        featuredImageCaption TEXT,
        bannerImage TEXT,
        bannerImageAlt TEXT,
        bannerImageCaption TEXT,
        tripMapImage TEXT,
        tripMapImageAlt TEXT,
        tripMapImageCaption TEXT,
        statusRibbon TEXT,
        groupSize TEXT,
        maxAltitude TEXT,
        tripHighlights TEXT,
        departureNote TEXT,
        goodToKnow TEXT,
        extraFAQs TEXT,
        relatedTrip TEXT,
        itineraryTitle TEXT,
        status INTEGER DEFAULT 1 CHECK(status IN (0,1)),
        featured INTEGER DEFAULT 0 CHECK(featured IN (0,1)),
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      );
    `);
    console.log('Created packages table');

    // 2. package_places table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS package_places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packageId INTEGER NOT NULL,
        placeId INTEGER NOT NULL,
        FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE,
        FOREIGN KEY (placeId) REFERENCES places(id) ON DELETE CASCADE,
        UNIQUE(packageId, placeId)
      );
    `);
    console.log('Created package_places table');

    // 3. package_trip_facts table
    // Note: attributeId links to trip_fact_attributes table (assumed name from previous context, 
    // but checking existing code, attributes table is likely 'attributes' or similar. 
    // Let's check db.js or seed files to be sure. 
    // Wait, previous context showed 'trip_fact_categories' and 'attributes'.
    // Let's assume 'attributes' table exists or we just store the ID.
    // Foreign key constraints are good but if table name differs, it might fail.
    // I will check table names in a moment, but for now I'll create the table.
    await runAsync(`
      CREATE TABLE IF NOT EXISTS package_trip_facts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packageId INTEGER NOT NULL,
        categorySlug TEXT NOT NULL,
        attributeId INTEGER NOT NULL,
        FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE,
        UNIQUE(packageId, categorySlug)
      );
    `);
    console.log('Created package_trip_facts table');

    // 4. package_itinerary table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS package_itinerary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packageId INTEGER NOT NULL,
        dayNumber INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        meals TEXT,
        accommodation TEXT,
        walkingHours TEXT,
        altitude TEXT,
        FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE,
        UNIQUE(packageId, dayNumber)
      );
    `);
    console.log('Created package_itinerary table');

    // 5. package_group_pricing table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS package_group_pricing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packageId INTEGER NOT NULL,
        minPerson INTEGER NOT NULL,
        maxPerson INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE,
        CHECK(minPerson <= maxPerson)
      );
    `);
    console.log('Created package_group_pricing table');

    console.log('Migration completed successfully.');
    db.close();
  } catch (error) {
    console.error('Migration failed:', error);
    db.close();
    process.exit(1);
  }
};

migrate();

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

  const createPackagesTableSQL = `
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
      pageType TEXT DEFAULT 'package',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT
    );
  `;

  const createPackagePlacesTableSQL = `
    CREATE TABLE IF NOT EXISTS package_places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      packageId INTEGER NOT NULL,
      placeId INTEGER NOT NULL,
      FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE,
      FOREIGN KEY (placeId) REFERENCES places(id) ON DELETE CASCADE,
      UNIQUE(packageId, placeId)
    );
  `;

  const createPackageTripFactsTableSQL = `
    CREATE TABLE IF NOT EXISTS package_trip_facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      packageId INTEGER NOT NULL,
      categorySlug TEXT NOT NULL,
      attributeId INTEGER NOT NULL,
      FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE,
      UNIQUE(packageId, categorySlug)
    );
  `;

  const createPackageItineraryTableSQL = `
    CREATE TABLE IF NOT EXISTS package_itinerary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      packageId INTEGER NOT NULL,
      dayNumber INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      meals TEXT,
      accommodation TEXT,
      distance TEXT,
      origin TEXT,
      destination TEXT,
      originElevation TEXT,
      destinationElevation TEXT,
      walkingHours TEXT,
      transportation TEXT,
      FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE,
      UNIQUE(packageId, dayNumber)
    );
  `;

  const createPackageGroupPricingTableSQL = `
    CREATE TABLE IF NOT EXISTS package_group_pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      packageId INTEGER NOT NULL,
      minPerson INTEGER NOT NULL,
      maxPerson INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE,
      CHECK(minPerson <= maxPerson)
    );
  `;

  const createPackageGalleryTableSQL = `
    CREATE TABLE IF NOT EXISTS package_gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      packageId INTEGER NOT NULL,
      imageUrl TEXT NOT NULL,
      caption TEXT,
      FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE
    );
  `;

  db.run(createPackagesTableSQL, (err) => {
    if (err) console.error('Error creating packages table:', err);
    else console.log('Packages table ready');
  });

  db.run(createPackagePlacesTableSQL, (err) => {
    if (err) console.error('Error creating package_places table:', err);
    else console.log('Package places table ready');
  });

  db.run(createPackageTripFactsTableSQL, (err) => {
    if (err) console.error('Error creating package_trip_facts table:', err);
    else console.log('Package trip facts table ready');
  });

  db.run(createPackageItineraryTableSQL, (err) => {
    if (err) console.error('Error creating package_itinerary table:', err);
    else console.log('Package itinerary table ready');
  });

  db.run(createPackageGroupPricingTableSQL, (err) => {
    if (err) console.error('Error creating package_group_pricing table:', err);
    else console.log('Package group pricing table ready');
  });

  db.run(createPackageGalleryTableSQL, (err) => {
    if (err) console.error('Error creating package_gallery table:', err);
    else console.log('Package gallery table ready');
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

  const createTeamsTableSQL = `
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      urlTitle TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      description TEXT,
      avatar TEXT,
      avatarAlt TEXT,
      avatarCaption TEXT,
      bannerImage TEXT,
      bannerImageAlt TEXT,
      bannerImageCaption TEXT,
      metaTitle TEXT,
      metaKeywords TEXT,
      metaDescription TEXT,
      status INTEGER DEFAULT 1,
      deletedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `;

  db.run(createTeamsTableSQL, (err) => {
    if (err) console.error('Error creating teams table:', err);
    else console.log('Teams table ready');
  });

  const createBlogsTableSQL = `
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
      deletedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (authorId) REFERENCES authors(id)
    );
  `;

  db.run(createBlogsTableSQL, (err) => {
    if (err) console.error('Error creating blogs table:', err);
    else console.log('Blogs table ready');
  });

  const createTestimonialsTableSQL = `
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewTitle TEXT NOT NULL,
      urlTitle TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      fullName TEXT NOT NULL,
      address TEXT,
      packageId INTEGER,
      teamId INTEGER,
      date TEXT NOT NULL,
      credit TEXT,
      rating INTEGER,
      status INTEGER DEFAULT 0,
      isFeatured INTEGER DEFAULT 0,
      description TEXT,
      metaTitle TEXT,
      metaKeywords TEXT,
      metaDescription TEXT,
      avatar TEXT,
      avatarAlt TEXT,
      avatarCaption TEXT,
      deletedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `;

  db.run(createTestimonialsTableSQL, (err) => {
    if (err) console.error('Error creating testimonials table:', err);
    else console.log('Testimonials table ready');
  });

  // Menus table
  const createMenusTableSQL = `
    CREATE TABLE IF NOT EXISTS menus (
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
    if (err) console.error('Error creating menus table:', err);
    else console.log('Menus table ready');
  });

  // Global Settings table
  const createSettingsTableSQL = `
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viatorLink TEXT,
      tourradarLink TEXT,
      tripAdvisorLink TEXT,
      defaultMetaDescription TEXT,
      defaultMetaKeywords TEXT,
      defaultMetaTitle TEXT,
      youtubeLink TEXT,
      pinterestLink TEXT,
      linkedinLink TEXT,
      instagramLink TEXT,
      twitterLink TEXT,
      facebookLink TEXT,
      contactPerson1 TEXT,
      contactPerson2 TEXT,
      establishedYear TEXT,
      shortDescription TEXT,
      mobileNumber1 TEXT,
      mobileNumber2 TEXT,
      phoneNumber TEXT,
      postBox TEXT,
      address TEXT,
      googleMapLocation TEXT,
      companyName TEXT,
      updatedAt TEXT
    );
  `;

  db.run(createSettingsTableSQL, (err) => {
    if (err) console.error('Error creating settings table:', err);
    else console.log('Settings table ready');
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

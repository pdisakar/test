const { db } = require('./db');

const attributes = [
  // Grade
  { name: 'Easy', type: 'grade' },
  { name: 'Moderate', type: 'grade' },
  { name: 'Intermediate', type: 'grade' },
  { name: 'Difficult', type: 'grade' },
  { name: 'Challenging', type: 'grade' },
  
  // Style
  { name: 'Trekking', type: 'style' },
  { name: 'Hiking', type: 'style' },
  { name: 'Mountaineering', type: 'style' },
  { name: 'Cultural Tour', type: 'style' },
  { name: 'Adventure', type: 'style' },
  
  // Transportation
  { name: 'Excursion bus', type: 'transportation' },
  { name: 'Private car', type: 'transportation' },
  { name: 'Flight', type: 'transportation' },
  { name: 'Walking', type: 'transportation' },
  { name: 'Mixed', type: 'transportation' },
  
  // Accommodation
  { name: 'Inn / Resort', type: 'accommodation' },
  { name: 'Hotel', type: 'accommodation' },
  { name: 'Lodge', type: 'accommodation' },
  { name: 'Tea House', type: 'accommodation' },
  { name: 'Camping', type: 'accommodation' },
  
  // Meals
  { name: 'Breakfast Lunch Dinner', type: 'meals' },
  { name: 'Breakfast only', type: 'meals' },
  { name: 'Half Board', type: 'meals' },
  { name: 'Full Board', type: 'meals' },
  { name: 'As per itinerary', type: 'meals' },
];

const seed = () => {
  const now = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO package_attributes (name, type, createdAt, updatedAt) VALUES (?, ?, ?, ?)');
  
  db.serialize(() => {
    // Clear existing
    db.run('DELETE FROM package_attributes');
    
    attributes.forEach(attr => {
      stmt.run(attr.name, attr.type, now, now);
    });
    
    stmt.finalize(() => {
      console.log('Seeding complete!');
      db.close();
    });
  });
};

seed();

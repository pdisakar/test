const { db } = require('./db');

const categories = [
  { label: 'Trip Grade', slug: 'grade' },
  { label: 'Trip Style', slug: 'style' },
  { label: 'Transportation', slug: 'transportation' },
  { label: 'Accommodation', slug: 'accommodation' },
  { label: 'Meals', slug: 'meals' },
];

const seed = () => {
  const now = new Date().toISOString();
  
  db.serialize(() => {
    // Insert only if not exists
    categories.forEach(cat => {
      db.get('SELECT id FROM trip_fact_categories WHERE slug = ?', [cat.slug], (err, row) => {
        if (!row) {
          db.run(
            'INSERT INTO trip_fact_categories (label, slug, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
            [cat.label, cat.slug, now, now],
            (err) => {
              if (err) console.error(`Error inserting ${cat.label}:`, err);
              else console.log(`✓ ${cat.label} added`);
            }
          );
        } else {
          console.log(`- ${cat.label} already exists`);
        }
      });
    });
    
    setTimeout(() => {
      console.log('Categories seeding complete!');
      db.close();
    }, 500);
  });
};

seed();

const { getAsync } = require('./db');

// Helper to generate breadcrumbs
const getBreadcrumbs = async (type, entity) => {
  const breadcrumbs = [{ title: 'Home', url: '/' }];

  if (type === 'place') {
    // Recursive function to get parents
    const getParents = async (parentId) => {
      if (!parentId) return [];
      const parent = await getAsync('SELECT id, title, slug, parentId FROM places WHERE id = ?', [parentId]);
      if (!parent) return [];
      const parents = await getParents(parent.parentId);
      return [...parents, { title: parent.title, url: `/${parent.slug}` }];
    };

    const parents = await getParents(entity.parentId);
    breadcrumbs.push(...parents);
    breadcrumbs.push({ title: entity.title, url: null });
  } 
  else if (type === 'package') {
     // Try to find a primary place for this package to build hierarchy
     const placeLink = await getAsync(
        `SELECT p.id, p.title, p.slug, p.parentId 
         FROM places p 
         JOIN package_places pp ON p.id = pp.placeId 
         WHERE pp.packageId = ? 
         LIMIT 1`, 
        [entity.id]
     );

     if (placeLink) {
        const getParents = async (parentId) => {
            if (!parentId) return [];
            const parent = await getAsync('SELECT id, title, slug, parentId FROM places WHERE id = ?', [parentId]);
            if (!parent) return [];
            const parents = await getParents(parent.parentId);
            return [...parents, { title: parent.title, url: `/${parent.slug}` }];
        };
        
        const parents = await getParents(placeLink.parentId);
        breadcrumbs.push(...parents);
        breadcrumbs.push({ title: placeLink.title, url: `/${placeLink.slug}` });
     }

     breadcrumbs.push({ title: entity.title, url: null });
  }
  else if (type === 'blog') {
    breadcrumbs.push({ title: 'Blogs', url: '/blogs' });
    breadcrumbs.push({ title: entity.title, url: null });
  }
  else if (type === 'article') {
    const getParents = async (parentId) => {
        if (!parentId) return [];
        const parent = await getAsync('SELECT id, title, slug, parentId FROM articles WHERE id = ?', [parentId]);
        if (!parent) return [];
        const parents = await getParents(parent.parentId);
        return [...parents, { title: parent.title, url: `/${parent.slug}` }];
    };

    const parents = await getParents(entity.parentId);
    breadcrumbs.push(...parents);
    breadcrumbs.push({ title: entity.title, url: null });
  }
  else if (type === 'testimonial') {
    breadcrumbs.push({ title: 'Testimonials', url: '/testimonials' });
    breadcrumbs.push({ title: entity.reviewTitle || 'Review', url: null });
  }

  return breadcrumbs;
};
module.exports = { getBreadcrumbs };

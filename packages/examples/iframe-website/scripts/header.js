/**
 * Header module - responsible for managing the site header
 */

export function initHeader() {
  const header = document.getElementById('site-header');
  
  // Apply inline styles
  Object.assign(header.style, {
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  });
  
  // Create logo
  const logo = document.createElement('div');
  logo.textContent = 'Brand Logo';
  Object.assign(logo.style, {
    fontWeight: 'bold',
    fontSize: '1.5rem',
  });
  
  // Create navigation
  const nav = document.createElement('nav');
  
  // Navigation links
  const links = ['Home', 'Features', 'Contact'];
  links.forEach(text => {
    const link = document.createElement('a');
    link.textContent = text;
    link.href = `#${text.toLowerCase()}`;
    Object.assign(link.style, {
      margin: '0 10px',
      textDecoration: 'none',
      color: '#495057',
    });
    nav.appendChild(link);
  });
  
  // Append elements to header
  header.appendChild(logo);
  header.appendChild(nav);
  
  console.log('Header initialized');
} 
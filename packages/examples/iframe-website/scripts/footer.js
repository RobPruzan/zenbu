/**
 * Footer module - responsible for managing the site footer
 */

export function initFooter() {
  const footer = document.getElementById('site-footer');
  
  // Apply inline styles
  Object.assign(footer.style, {
    backgroundColor: '#343a40',
    color: 'white',
    textAlign: 'center',
    padding: '3rem 2rem',
  });
  
  // Create footer content
  const currentYear = new Date().getFullYear();
  
  // Create container for footer content
  const container = document.createElement('div');
  Object.assign(container.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  });
  
  // Create social links
  const socialLinks = document.createElement('div');
  Object.assign(socialLinks.style, {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '2rem',
  });
  
  // Create social icons
  ['Twitter', 'Facebook', 'Instagram', 'LinkedIn'].forEach(platform => {
    const link = document.createElement('a');
    link.textContent = platform;
    link.href = '#';
    Object.assign(link.style, {
      color: 'white',
      textDecoration: 'none',
    });
    
    link.addEventListener('mouseenter', () => {
      link.style.color = '#4c6ef5';
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.color = 'white';
    });
    
    socialLinks.appendChild(link);
  });
  
  // Create copyright text
  const copyright = document.createElement('p');
  copyright.textContent = `© ${currentYear} Your Company. All rights reserved.`;
  Object.assign(copyright.style, {
    marginBottom: '1rem',
  });
  
  // Create simple navigation
  const footerNav = document.createElement('div');
  Object.assign(footerNav.style, {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  });
  
  // Create footer links
  ['Privacy Policy', 'Terms of Service', 'Contact Us'].forEach(text => {
    const link = document.createElement('a');
    link.textContent = text;
    link.href = '#';
    Object.assign(link.style, {
      color: '#adb5bd',
      textDecoration: 'none',
    });
    
    link.addEventListener('mouseenter', () => {
      link.style.color = 'white';
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.color = '#adb5bd';
    });
    
    footerNav.appendChild(link);
  });
  
  // Append elements to container
  container.appendChild(socialLinks);
  container.appendChild(copyright);
  container.appendChild(footerNav);
  
  // Append container to footer
  footer.appendChild(container);
  
  console.log('Footer initialized');
} 
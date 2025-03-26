/**
 * Hero module - responsible for managing the hero section
 */

export function initHero() {
  const heroSection = document.getElementById('hero');
  
  // Apply inline styles
  Object.assign(heroSection.style, {
    backgroundColor: '#4c6ef5',
    color: 'white',
    textAlign: 'center',
    padding: '6rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  });
  
  // Create hero content
  const title = document.createElement('h1');
  title.textContent = 'Welcome to Our Landing Page';
  Object.assign(title.style, {
    fontSize: '3rem',
    marginBottom: '1rem',
  });
  
  const subtitle = document.createElement('p');
  subtitle.textContent = 'A modular landing page built with vanilla JavaScript modules';
  Object.assign(subtitle.style, {
    fontSize: '1.25rem',
    marginBottom: '2rem',
    maxWidth: '700px',
  });
  
  const ctaButton = document.createElement('button');
  ctaButton.textContent = 'Get Started';
  Object.assign(ctaButton.style, {
    backgroundColor: 'white',
    color: '#4c6ef5',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  });
  
  // Add event listener to button
  ctaButton.addEventListener('click', () => {
    console.log('CTA button clicked');
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  });
  
  // Append elements to hero section
  heroSection.appendChild(title);
  heroSection.appendChild(subtitle);
  heroSection.appendChild(ctaButton);
  
  console.log('Hero section initialized');
} 
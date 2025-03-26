// Import all module components
import { initHeader } from './header.js';
import { initHero } from './hero.js';
import { initFeatures } from './features.js';
import { initContact } from './contact.js';
import { initFooter } from './footer.js';

// Initialize all sections
document.addEventListener('DOMContentLoaded', () => {
  // Initialize each section with their respective modules
  initHeader();
  initHero();
  initFeatures();
  initContact();
  initFooter();
  
  console.log('All modules initialized successfully');
}); 
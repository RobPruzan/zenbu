/**
 * Features module - responsible for managing the features section
 */

export function initFeatures() {
  const featuresSection = document.getElementById('features');
  
  // Apply inline styles
  Object.assign(featuresSection.style, {
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
    padding: '5rem 2rem',
  });
  
  // Create section header
  const sectionHeader = document.createElement('h2');
  sectionHeader.textContent = 'Features';
  Object.assign(sectionHeader.style, {
    fontSize: '2.5rem',
    marginBottom: '3rem',
  });
  
  // Create features container
  const featuresContainer = document.createElement('div');
  Object.assign(featuresContainer.style, {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  });
  
  // Feature data
  const featureData = [
    {
      title: 'Modular Design',
      description: 'Built with ES modules for clean, maintainable code structure',
      icon: '📦'
    },
    {
      title: 'Pure JavaScript',
      description: 'No frameworks or libraries needed, just vanilla JavaScript',
      icon: '🔧'
    },
    {
      title: 'Responsive',
      description: 'Looks great on any device, from mobile to desktop',
      icon: '📱'
    }
  ];
  
  // Create feature cards
  featureData.forEach(feature => {
    const card = document.createElement('div');
    Object.assign(card.style, {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      flex: '1 1 300px',
      maxWidth: '350px',
    });
    
    const icon = document.createElement('div');
    icon.textContent = feature.icon;
    Object.assign(icon.style, {
      fontSize: '3rem',
      marginBottom: '1rem',
    });
    
    const title = document.createElement('h3');
    title.textContent = feature.title;
    Object.assign(title.style, {
      fontSize: '1.5rem',
      marginBottom: '1rem',
    });
    
    const description = document.createElement('p');
    description.textContent = feature.description;
    Object.assign(description.style, {
      color: '#6c757d',
    });
    
    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(description);
    featuresContainer.appendChild(card);
  });
  
  // Append elements to features section
  featuresSection.appendChild(sectionHeader);
  featuresSection.appendChild(featuresContainer);
  
  console.log('Features section initialized');
} 
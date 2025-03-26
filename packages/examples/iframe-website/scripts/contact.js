/**
 * Contact module - responsible for managing the contact section
 * Enhanced version with better styling and user experience
 */

export function initContact() {
  const contactSection = document.getElementById('contact');
  
  // Apply modern styling to the contact section
  Object.assign(contactSection.style, {
    backgroundColor: '#f8f9fa',
    padding: '6rem 2rem',
    textAlign: 'center',
    borderTop: '1px solid #e9ecef',
    boxShadow: 'inset 0 5px 15px rgba(0,0,0,0.05)'
  });
  
  // Create container for better responsiveness
  const container = document.createElement('div');
  Object.assign(container.style, {
    maxWidth: '1140px',
    margin: '0 auto',
    padding: '0 15px'
  });
  
  // Create section header with improved styling
  const sectionHeader = document.createElement('h2');
  sectionHeader.textContent = 'Get In Touch';
  Object.assign(sectionHeader.style, {
    fontSize: '3rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#212529',
    position: 'relative',
    display: 'inline-block'
  });
  
  // Add decorative underline to header
  const headerUnderline = document.createElement('div');
  Object.assign(headerUnderline.style, {
    height: '4px',
    width: '80px',
    backgroundColor: '#4c6ef5',
    margin: '0 auto 2rem',
    borderRadius: '2px'
  });
  
  // Create description with improved copy
  const description = document.createElement('p');
  description.textContent = 'Wed love to hear from you! Send us a message and well respond as soon as possible.';
  Object.assign(description.style, {
    fontSize: '1.25rem',
    lineHeight: '1.7',
    marginBottom: '3.5rem',
    color: '#495057',
    maxWidth: '700px',
    margin: '0 auto 3.5rem',
  });
  
  // Create two-column layout for contact info and form
  const contactLayout = document.createElement('div');
  Object.assign(contactLayout.style, {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '0 -15px',
    justifyContent: 'center',
    alignItems: 'flex-start'
  });
  
  // Create contact info column
  const contactInfo = document.createElement('div');
  Object.assign(contactInfo.style, {
    flex: '0 0 100%',
    maxWidth: '350px',
    padding: '0 15px',
    marginBottom: '2rem',
    textAlign: 'left'
  });
  
  // Create contact form column
  const contactFormContainer = document.createElement('div');
  Object.assign(contactFormContainer.style, {
    flex: '0 0 100%',
    maxWidth: '600px',
    padding: '0 15px'
  });
  
  // Add contact info content
  const infoTitle = document.createElement('h3');
  infoTitle.textContent = 'Contact Information';
  Object.assign(infoTitle.style, {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    color: '#212529',
    fontWeight: '600'
  });
  
  // Helper function to create contact info items
  function createContactInfoItem(icon, title, content) {
    const item = document.createElement('div');
    Object.assign(item.style, {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '1.5rem'
    });
    
    const iconElement = document.createElement('div');
    iconElement.innerHTML = icon;
    Object.assign(iconElement.style, {
      width: '40px',
      height: '40px',
      backgroundColor: '#4c6ef5',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '1rem',
      color: 'white',
      flexShrink: '0'
    });
    
    const textContainer = document.createElement('div');
    
    const titleElement = document.createElement('h4');
    titleElement.textContent = title;
    Object.assign(titleElement.style, {
      fontSize: '1.1rem',
      marginBottom: '0.25rem',
      fontWeight: '600'
    });
    
    const contentElement = document.createElement('p');
    contentElement.textContent = content;
    Object.assign(contentElement.style, {
      color: '#6c757d',
      margin: '0'
    });
    
    textContainer.appendChild(titleElement);
    textContainer.appendChild(contentElement);
    
    item.appendChild(iconElement);
    item.appendChild(textContainer);
    
    return item;
  }
  
  // Add contact info items
  contactInfo.appendChild(infoTitle);
  contactInfo.appendChild(createContactInfoItem('📍', 'Address', '123 Business Avenue, New York, NY 10001'));
  contactInfo.appendChild(createContactInfoItem('📞', 'Phone', '+1 (555) 123-4567'));
  contactInfo.appendChild(createContactInfoItem('✉️', 'Email', 'contact@yourcompany.com'));
  
  // Add social media links
  const socialLinks = document.createElement('div');
  Object.assign(socialLinks.style, {
    display: 'flex',
    marginTop: '2rem'
  });
  
  // Helper function to create social media links
  function createSocialLink(icon) {
    const link = document.createElement('a');
    link.href = '#';
    link.innerHTML = icon;
    Object.assign(link.style, {
      width: '40px',
      height: '40px',
      backgroundColor: '#e9ecef',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '0.75rem',
      color: '#495057',
      textDecoration: 'none',
      transition: 'all 0.3s ease'
    });
    
    // Add hover effect
    link.onmouseover = () => {
      link.style.backgroundColor = '#4c6ef5';
      link.style.color = 'white';
      link.style.transform = 'translateY(-3px)';
    };
    
    link.onmouseout = () => {
      link.style.backgroundColor = '#e9ecef';
      link.style.color = '#495057';
      link.style.transform = 'translateY(0)';
    };
    
    return link;
  }
  
  // Add social media icons
  socialLinks.appendChild(createSocialLink('FB'));
  socialLinks.appendChild(createSocialLink('TW'));
  socialLinks.appendChild(createSocialLink('IG'));
  socialLinks.appendChild(createSocialLink('LI'));
  
  contactInfo.appendChild(socialLinks);
  
  // Create contact form with improved styling
  const form = document.createElement('form');
  Object.assign(form.style, {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
    textAlign: 'left'
  });
  
  // Create form title
  const formTitle = document.createElement('h3');
  formTitle.textContent = 'Send Us a Message';
  Object.assign(formTitle.style, {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    color: '#212529',
    fontWeight: '600'
  });
  
  // Helper function to create form fields with labels
  function createFormField(type, label, placeholder, required = true) {
    const fieldContainer = document.createElement('div');
    Object.assign(fieldContainer.style, {
      marginBottom: '1.5rem'
    });
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    Object.assign(labelElement.style, {
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.9rem',
      fontWeight: '500',
      color: '#495057'
    });
    
    const field = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') field.type = type;
    field.placeholder = placeholder;
    field.required = required;
    
    Object.assign(field.style, {
      width: '100%',
      padding: '0.75rem 1rem',
      borderRadius: '4px',
      border: '1px solid #ced4da',
      fontSize: '1rem',
      transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
    });
    
    // Add focus effect
    field.onfocus = () => {
      field.style.borderColor = '#4c6ef5';
      field.style.boxShadow = '0 0 0 0.2rem rgba(76, 110, 245, 0.25)';
    };
    
    field.onblur = () => {
      field.style.borderColor = '#ced4da';
      field.style.boxShadow = 'none';
    };
    
    if (type === 'textarea') {
      field.rows = 5;
    }
    
    fieldContainer.appendChild(labelElement);
    fieldContainer.appendChild(field);
    
    return { container: fieldContainer, input: field };
  }
  
  // Create form row for name and email
  const formRow = document.createElement('div');
  Object.assign(formRow.style, {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '0 -10px'
  });
  
  const nameFieldWrapper = document.createElement('div');
  const emailFieldWrapper = document.createElement('div');
  
  Object.assign(nameFieldWrapper.style, {
    flex: '1 0 50%',
    padding: '0 10px',
    minWidth: '250px'
  });
  
  Object.assign(emailFieldWrapper.style, {
    flex: '1 0 50%',
    padding: '0 10px',
    minWidth: '250px'
  });
  
  // Create form elements
  const nameField = createFormField('text', 'Full Name', 'John Doe');
  const emailField = createFormField('email', 'Email Address', 'john@example.com');
  const subjectField = createFormField('text', 'Subject', 'How can we help you?');
  const messageField = createFormField('textarea', 'Message', 'Tell us more about your project, needs and budget...');
  
  nameFieldWrapper.appendChild(nameField.container);
  emailFieldWrapper.appendChild(emailField.container);
  
  formRow.appendChild(nameFieldWrapper);
  formRow.appendChild(emailFieldWrapper);
  
  // Create submit button with improved styling
  const submitButton = document.createElement('button');
  submitButton.textContent = 'Send Message';
  submitButton.type = 'submit';
  Object.assign(submitButton.style, {
    backgroundColor: '#4c6ef5',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'all 0.3s ease',
    display: 'inline-block',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)'
  });
  
  // Add hover effect to button
  submitButton.onmouseover = () => {
    submitButton.style.backgroundColor = '#3b5bdb';
    submitButton.style.transform = 'translateY(-2px)';
    submitButton.style.boxShadow = '0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08)';
  };
  
  submitButton.onmouseout = () => {
    submitButton.style.backgroundColor = '#4c6ef5';
    submitButton.style.transform = 'translateY(0)';
    submitButton.style.boxShadow = '0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)';
  };
  
  // Add event listener to form submission with improved feedback
  form.addEventListener('submit', e => {
    e.preventDefault();
    
    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    submitButton.style.backgroundColor = '#6c757d';
    
    // Simulate sending (would be an actual API call in production)
    setTimeout(() => {
      console.log('Form submitted with data:', {
        name: nameField.input.value,
        email: emailField.input.value,
        subject: subjectField.input.value,
        message: messageField.input.value
      });
      
      // Show success message
      form.innerHTML = '';
      const successMessage = document.createElement('div');
      Object.assign(successMessage.style, {
        textAlign: 'center',
        padding: '2rem'
      });
      
      const successIcon = document.createElement('div');
      successIcon.innerHTML = '✓';
      Object.assign(successIcon.style, {
        width: '60px',
        height: '60px',
        backgroundColor: '#40c057',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
        fontSize: '2rem',
        fontWeight: 'bold'
      });
      
      const successTitle = document.createElement('h3');
      successTitle.textContent = 'Message Sent!';
      Object.assign(successTitle.style, {
        fontSize: '1.5rem',
        marginBottom: '1rem',
        color: '#212529'
      });
      
      const successText = document.createElement('p');
      successText.textContent = 'Thank you for reaching out. We will get back to you as soon as possible.';
      Object.assign(successText.style, {
        color: '#6c757d',
        marginBottom: '1.5rem'
      });
      
      const resetButton = document.createElement('button');
      resetButton.textContent = 'Send Another Message';
      Object.assign(resetButton.style, {
        backgroundColor: '#4c6ef5',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '4px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      });
      
      resetButton.onclick = () => {
        initContact(); // Reinitialize the contact section
      };
      
      successMessage.appendChild(successIcon);
      successMessage.appendChild(successTitle);
      successMessage.appendChild(successText);
      successMessage.appendChild(resetButton);
      
      form.appendChild(successMessage);
    }, 1500);
  });
  
  // Append form elements
  form.appendChild(formTitle);
  form.appendChild(formRow);
  form.appendChild(subjectField.container);
  form.appendChild(messageField.container);
  form.appendChild(submitButton);
  
  // Append elements to containers
  contactFormContainer.appendChild(form);
  contactLayout.appendChild(contactInfo);
  contactLayout.appendChild(contactFormContainer);
  
  container.appendChild(sectionHeader);
  container.appendChild(headerUnderline);
  container.appendChild(description);
  container.appendChild(contactLayout);
  
  // Clear and append to contact section
  contactSection.innerHTML = '';
  contactSection.appendChild(container);
  
  console.log('Enhanced contact section initialized');
}
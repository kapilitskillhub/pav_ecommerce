import React from 'react';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-container">
      <h1>Contact Us</h1>

      <p><strong>Address:</strong><br />
        Kapil Kavuri Hub, 2nd Floor, Financial District, Nanakramguda, Hyderabad,<br />
        Telangana, INDIA – 500 032
      </p>

      <p><strong>Phone:</strong><br />
        <span className="phone-number">+91 88850 30341</span><br />
        <span className="phone-number">+91 98898 86936</span>
      </p>

      <p><strong>Email:</strong> <a href="mailto:kapilitskillhub@gmail.com">kapilitskillhub@gmail.com</a></p>
    </div>
  );
};

export default Contact;

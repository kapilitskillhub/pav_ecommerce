import React from 'react';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-container">
      <h1 className="contact-header">Contact Us</h1>

      <div className="contact-content">
        <p>
          <span className="strong-text">Address:</span><br />
          Kapil Kavuri Hub, 2nd Floor, Financial District, Nanakramguda, Hyderabad,<br />
          Telangana, INDIA – 500 032
        </p>

        <p>
          <span className="strong-text">Phone:</span><br />
          <a href="tel:+918885030341" className="phone-number">+91 88850 30341</a><br />
          <a href="tel:+919889886936" className="phone-number phone-number-2">+91 98898 86936</a>
        </p>

        <p>
          <span className="strong-text">Email:</span> <a href="mailto:kapilitskillhub@gmail.com" className="email-link">pavaman@gmail.com</a>
        </p>
      </div>
    </div>
  );
};

export default Contact;

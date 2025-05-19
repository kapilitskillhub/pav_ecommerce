import React from 'react';
import './B2B.css';

const B2B = () => {
  return (
    <div className="b2b-container">
      <h1>Special Offers for Business Customers</h1>
      <p>
        We value our business partners! For exclusive offers and deals tailored
        just for your business, please contact us directly.
      </p>
      <div className="b2b-contact-box">
        <h2>Business Contact Number</h2>
        <p className="b2b-phone">📞 +1-800-123-4567</p>
        <p>Or email us at <a href="mailto:b2b@pavaman.com">b2b@pavaman.com</a></p>
      </div>
    </div>
  );
};

export default B2B;

import React from 'react';
import "../CustomerFooter/CustomerFooter.css";
import logo from '../../../assets/images/logo.png';
 // replace with your logo path

const PavamanFooter = () => {
  return (
    <footer className="pav-footer">
      <div className="footer-top">
        <div className="footer-logo-section">
          <img src={logo} alt="Pavaman Logo" className="footer-logo" />
          <p className="tagline">Your Dreams, Our Efforts</p>
          <p className="support-hours">Got Questions? Call us between 9:15 AM to 6:15 PM (Mon - Sat)</p>
          <p className="support-phone">1800 123 4567, 020 76543210</p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>Information</h4>
            <ul>
              <li><a href="#">Track Your Order</a></li>
              <li><a href="#">Videos</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>My Account</h4>
            <ul>
              <li><a href="#">Cart</a></li>
              <li><a href="#">Checkout</a></li>
              <li><a href="#">My Account</a></li>
              <li><a href="#">Payment Options</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Services</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Pavaman B2B</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Policies</h4>
            <ul>
              <li><a href="#">Investor Relations</a></li>
              <li><a href="#">CSR</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Shipping & Refund</a></li>
              <li><a href="#">E-Waste Collection</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© <strong>Pavaman</strong> is a registered trademark - All Rights Reserved</p>
      </div>
    </footer>
  );
};

export default PavamanFooter;

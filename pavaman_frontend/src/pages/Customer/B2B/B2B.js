import './B2B.css';
import { FaPhoneAlt, FaEnvelope } from 'react-icons/fa';

const B2B = () => {
  return (
    <div className="b2b-container">
      <h1>Special Offers for Business Customers</h1>
      <p className='b2b-container-info'>
        We value our business partners! For exclusive offers and deals tailored
        just for your business, please contact us directly.
      </p>
      <div className="b2b-contact-box">
        <h2>Business Contact</h2>
        <div className="b2b-contact-line">
          <FaPhoneAlt className="contact-icon phone-icon" />&nbsp;
          <span className="b2b-contact-text">+1-800-123-4567</span>
        </div>
        <div className="b2b-contact-line">
          <FaEnvelope className="contact-icon email-icon" />&nbsp;&nbsp;
          <span className="b2b-contact-text">
            Email us at <a href="mailto:b2b@pavaman.com">b2b@pavaman.com</a>
          </span>
        </div>
      </div>
    </div>
  );
};

export default B2B;

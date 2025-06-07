import './Contact.css';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
const Contact = () => {
  return (
    <div className="contact-container">
      <h1 className="contact-header">Contact Us</h1>
      <p className="contact-intro">
        Have questions or need assistance? Our customer support team is here to help you!
        Whether you need product information, order help, or want to share feedback, feel free to reach out.
      </p>
      <div className="contact-content">
        <div className="contact-item">
          <FaMapMarkerAlt className="contact-icon address" />
          <div>
            <span className="strong-text">Address:</span><br />
            <p>Kapil Kavuri Hub, 2nd Floor, Financial District,<br />
              Nanakramguda, Hyderabad, Telangana, INDIA – 500 032</p>
          </div>
        </div>
        <div className="contact-item">
          <FaPhoneAlt className="contact-icon phone" />
          <div>
            <span className="strong-text">Phone:</span><br />
            <a href="tel:+919063133028" className="phone-number">+91 906 313 3028</a><br />
            {/* <a href="tel:+919889886936" className="phone-number">+91 98898 86936</a> */}
          </div>
        </div>
        <div className="contact-item">
          <FaEnvelope className="contact-icon email" />   <div>
            <span className="strong-text">Email:</span><br />
            <a href="mailto:pavaman@gmail.com" className="email-link">pavaman@gmail.com</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

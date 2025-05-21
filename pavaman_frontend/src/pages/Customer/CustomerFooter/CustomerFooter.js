import "../CustomerFooter/CustomerFooter.css";
import logo from '../../../assets/images/logo.png';
import { useNavigate } from 'react-router-dom';
const PavamanFooter = () => {
  const navigate = useNavigate();
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
            <h4>Address</h4>
            <p>
              Kapil Kavuri Hub, 2nd Floor ,
            </p>
            <p>
              Financial District, Nanakramguda,
            </p>
            <p>Hyderabad,Telangana,</p>
            <p>
              INDIA – 500 032
            </p>
          </div>
          <div className="footer-column">
            <h4>My Account</h4>
            <ul className='my-account-contact'>
              <li><span onClick={() => navigate('/view-cart-products')}>Cart</span></li>
              <li><span onClick={() => navigate('/my-orders')}>Checkout</span></li>
              <li><span onClick={() => navigate('/profile')}>My Account</span></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Services</h4>
            <ul className='service-options'>
              <li><span onClick={() => navigate('/contact')}>Contact Us</span></li>
             <li><span onClick={() => navigate('/b2b')}>Pavaman B2B</span></li>
               <li><span onClick={() => navigate('/policies')}>Policies</span></li>
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

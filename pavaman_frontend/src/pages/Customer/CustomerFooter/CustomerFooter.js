import "../CustomerFooter/CustomerFooter.css";
import logo from '../../../assets/images/footer logo.svg';

import { useNavigate } from 'react-router-dom';
import { FaFacebook , FaInstagram ,FaTwitter  ,FaYoutube ,FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
const PavamanFooter = () => {
  const navigate = useNavigate();
  return (
    <footer className="pav-footer">
      <div className="footer-top">
        <div className="footer-logo-section">
          <img src={logo} alt="Pavaman Logo" className="footer-logo" />
          <p className="tagline">Let's Your Vison take a Flight</p>
          <p className="support-hours">Got Questions? Call us between 9:15 AM to 6:15 PM (Mon - Sat)</p>
          <p className="support-phone">1800 123 4567, 020 76543210 , <br/>+91 906 313 3028</p>
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
           <p><a href="https://www.pavaman.in/">wwww.pavaman.in</a></p>
          </div>
          <div className="footer-column">
            <h4>My Account</h4>
            <ul className='my-account-contact'>
              <li><span onClick={() =>{ window.scrollTo(0, 0); navigate('/view-cart-products'); }}>Cart</span></li>
              <li><span onClick={() =>{ window.scrollTo(0, 0); navigate('/my-orders'); }}>My Orders</span></li>
              <li><span onClick={() => { window.scrollTo(0, 0); navigate('/profile'); }}>My Account</span></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Services</h4>
            <ul className='service-options'>
              <li><span onClick={() =>  { window.scrollTo(0, 0); navigate('/contact'); }}>Contact Us</span></li>
              <li><span onClick={() => { window.scrollTo(0, 0); navigate('/b2b'); }}>Pavaman B2B</span></li>
              <li><span onClick={() => { window.scrollTo(0, 0); navigate('/policies'); }}>Policies</span></li>
            </ul>
          </div>
           <div className="footer-column">
            <h4>Social Media</h4>
            <ul className='service-options social-media'>
              <li><a href="https://www.facebook.com/PavamanAviation/"><FaFacebook/></a></li>
              <li><a href="https://www.instagram.com/pavamanaviation/"><FaInstagram/></a></li>
              <li><a href="https://www.linkedin.com/company/pavaman-aviation/"><FaLinkedin/></a></li>
              <li><a href="https://x.com/ThePavaman"><FaXTwitter/></a></li>
              <li><a href="https://youtube.com/@pavamanaviation"><FaYoutube/></a></li>

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

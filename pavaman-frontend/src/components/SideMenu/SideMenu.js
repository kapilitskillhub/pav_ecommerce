import React from "react";
import { Link , useNavigate} from "react-router-dom";
import "../SideMenu/SideMenu.css";
import DashboardIcon from '../../assets/images/dashboard-icon.svg';
import ProductIcon from '../../assets/images/products-icon.svg';
import OrdersIcon from '../../assets/images/orders-icon.svg';
import ReportsIcon from '../../assets/images/reports-icon.svg';
import BannerIcon from '../../assets/images/banner-icon.svg';

import { BiLogOut } from "react-icons/bi";

const SideMenu = ({setIsAuthenticated}) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.clear(); 
        setIsAuthenticated(false);
         // Clear session storage
        navigate("/admin-login"); // Navigate to admin login page
    };
    return (
        <div className="sidemenu">
            <Link to='/dashboard' className="sidemenu-item">
                <img src={DashboardIcon} alt="Dashboard Icon" />
                <span className="sidemenu-label">Dashboard</span>
            </Link>
            <Link to="/view-categories" className="sidemenu-item">
                <img src={ProductIcon} alt="Product Icon" />
                <span className="sidemenu-label">Products</span>
            </Link>
            {/* <div className="sidemenu-item">
                <img src={ProductIcon} alt="Product Icon" />
                <span className="sidemenu-label">Products</span>
            </div> */}
            <Link to="/orders"className="sidemenu-item">
                <img src={OrdersIcon} alt="OrdersIcon" />
                <span className="sidemenu-label">Orders</span>
            </Link>
            {/* <Link to="/reports"className="sidemenu-item">
                <img src={ReportsIcon} alt="Reports Icon" />
                <span className="sidemenu-label">Reports</span>
            </Link>
            <Link to="/banner" className="sidemenu-item">
                <img src={BannerIcon} alt="Banner Icon" />
                <span className="sidemenu-label">Banner</span>
            </Link> */}
  {/* <button className="sidemenu-item logout-button" onClick={handleLogout}>
  <BiLogOut /><span className="sidemenu-label">Logout</span>
            </button> */}
              <Link to="/admin-login" className="sidemenu-item logout-link" onClick={handleLogout}>
                <BiLogOut />
                <span className="sidemenu-label">Logout</span>
            </Link>
        </div>
    );
};

export default SideMenu;
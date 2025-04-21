import React from "react";
import { Link , useNavigate} from "react-router-dom";
import "../SideMenu/SideMenu.css";



// import DashboardIcon from '../../assets/images/dashboard-icon.svg';
// import ProductIcon from '../../assets/images/products-icon.svg';
// import OrdersIcon from '../../assets/images/orders-icon.svg';
// import CustomersIcon from '../../assets/images/customer-icon.svg';
// import ReportsIcon from '../../assets/images/reports-icon.svg';
// import BannerIcon from '../../assets/images/banner-icon.svg';
import { MdDashboard } from "react-icons/md";
import { BiLogOut } from "react-icons/bi";
import { FaBoxOpen } from "react-icons/fa6";
import { TbTruckDelivery } from "react-icons/tb";
import { IoMdPeople } from "react-icons/io";
import { TbReportSearch } from "react-icons/tb";

const SideMenu = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        sessionStorage.clear(); 
        // setIsAuthenticated(false);
         // Clear session storage
        navigate("/admin-login"); // Navigate to admin login page
    };
    return (
    
        <div className="sidemenu">
            <Link to='/dashboard' className="sidemenu-item">
                <MdDashboard className="sidemenu-img"/>
                <span className="sidemenu-label">Dashboard</span>
            </Link>
            <Link to="/view-categories" className="sidemenu-item">
                <FaBoxOpen className="sidemenu-img"/>
                <span className="sidemenu-label">Products</span>
            </Link>
            <Link to="/reports"className="sidemenu-item">
            <TbReportSearch  className="sidemenu-img"/>

                <span className="sidemenu-label">Reports</span>
            </Link>


            <Link to="/customers" className="sidemenu-item ">
                <IoMdPeople className="sidemenu-img"/>

                <span className="sidemenu-label">Customers</span>
            </Link>

            <Link to="/orders" className="sidemenu-item ">
                
                <TbTruckDelivery className="sidemenu-img"/>
                <span className="sidemenu-label">Orders</span>
            </Link>

              <Link to="/admin-login" className="sidemenu-item logout-link" onClick={handleLogout}>
                <BiLogOut className="sidemenu-img" />
                <span className="sidemenu-label">Logout</span>
            </Link>
        </div>
        
    );
};

export default SideMenu;

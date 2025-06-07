import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerProfileOptions.css";
import { IoIosArrowForward } from "react-icons/io";
import { FiLogOut } from "react-icons/fi";
import axios from "axios";
import API_BASE_URL from "../../../config";

const CustomerProfileOptions = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const customerId = localStorage.getItem("customer_id");
    if (customerId) {
      setIsLoggedIn(true);
      axios
        .post(`${API_BASE_URL}/get-customer-profile`, {customer_id: customerId,})
        .then((response) => {
         const data = response.data;
          const profile = data.profile;
          if (profile?.first_name && profile?.last_name) {
            const fullName = `${profile.first_name} ${profile.last_name}`;
            setCustomerName(fullName);
            localStorage.setItem("customer_name", fullName);
          }
        })
        .catch((error) => {
          console.error("Error fetching customer profile:", error);
        });
    } else {
      setIsLoggedIn(false);
      setCustomerName("Guest");
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate("/"); 
  };

  return (
    <div className="mobile-profile-options">
      <div className="profile-header">
        <h2>Hello, {customerName || "Guest"} 👋</h2>
      </div>
      {isLoggedIn ? (
        <>
          <div className="profile-option" onClick={() => navigate("/profile")}>
            <span>My Profile</span>
            <IoIosArrowForward />
          </div>

          <div className="profile-option" onClick={() => navigate("/my-orders")}>
            <span>My Orders</span>
            <IoIosArrowForward />
          </div>

          <div className="profile-option" onClick={() => navigate("/address")}>
            <span>Address</span>
            <IoIosArrowForward />
          </div>

          <div className="profile-option" onClick={() => navigate("/contact")}>
            <span>Contact</span>
            <IoIosArrowForward />
          </div>

          <div className="profile-option logout" onClick={handleLogout}>
            <span>Logout</span>
            <FiLogOut />
          </div>
        </>
      ) : (
        <>
          <div className="profile-option" onClick={() => navigate("/customer-login")}>
            <span>Login</span>
            <IoIosArrowForward />
          </div>
          <div className="profile-option" onClick={() => navigate("/customer-login")}>
            <span>Signup</span>
            <IoIosArrowForward />
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerProfileOptions;

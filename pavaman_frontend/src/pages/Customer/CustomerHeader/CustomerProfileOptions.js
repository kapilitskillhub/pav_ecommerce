import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerProfileOptions.css";
import { IoIosArrowForward } from "react-icons/io";
import { FiLogOut } from "react-icons/fi";
import axios from "axios";

const CustomerProfileOptions = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const customerId = localStorage.getItem("customer_id");
    if (customerId) {
      setIsLoggedIn(true);
      axios
        .get(`http://127.0.0.1:8000/get-customer-profile/${customerId}/`)
        .then((response) => {
          const data = response.data;
          if (data.first_name && data.last_name) {
            setCustomerName(`${data.first_name} ${data.last_name}`);
            localStorage.setItem("customer_name", `${data.first_name} ${data.last_name}`);
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
    navigate("/"); // Redirect to homepage after logout
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

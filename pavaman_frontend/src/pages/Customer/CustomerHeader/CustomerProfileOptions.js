import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerProfileOptions.css";
import { IoIosArrowForward } from "react-icons/io";
import { FiLogOut } from "react-icons/fi";
import axios from "axios";

const CustomerProfileOptions = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const customerId = localStorage.getItem("customer_id"); // get ID from localStorage
    if (customerId) {
      axios
        .get(`http://127.0.0.1:8000/get-customer-profile/${customerId}/`) // send customerId in URL
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
      // No customer ID in localStorage
      setCustomerName("Guest");
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="mobile-profile-options">
      <div className="profile-header">
        <h2>Hello, {customerName || "Guest"} 👋</h2>
      </div>

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

      <div className="profile-option logout" onClick={handleLogout}>
        <span>Logout</span>
        <FiLogOut />
      </div>
    </div>
  );
};

export default CustomerProfileOptions;

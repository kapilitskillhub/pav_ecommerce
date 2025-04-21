import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../SignIn/Signin.css";
import Logo from "../../assets/images/aviation-logo.png";
import LogInImage from "../../assets/images/signinpage-image.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const SignIn = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  const showPopup = (text, type) => {
    setPopupMessage({ text, type });

    // Remove popup after 5 seconds
    setTimeout(() => {
      setPopupMessage({ text: "", type: "" });
    }, 3000);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      showPopup("Email and password are required.", "error");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/admin-login", { email, password });

      if (response.data.status_code === 200) {
        showPopup("Login successful!", "success");
        setIsAuthenticated(true);
        sessionStorage.setItem("adminData", JSON.stringify(response.data));
        sessionStorage.setItem("admin_id", response.data.id);
        setTimeout(() => navigate("/admin/dashboard"), 1000);
      } else {
        showPopup(response.data.error || "Login failed.", "error");
      }
    } catch (error) {
      showPopup(error.response?.data?.error || "Something went wrong.", "error");
    }
  };

  return (
    <div className="login-container">
      

      <div className="login-form-section">
        <div>
          <img src={Logo} className="login-logo" alt="Logo" />
        </div>

        <div className="login-text">Login</div>
        <div className="login-form-info">Fill the fields below to continue.</div>
        {popupMessage.text && (
        <div className={`popup-message ${popupMessage.type}`}>
          {popupMessage.text}
        </div>
      )}
        <div className="login-form-fields">
          <label className="email-label">Email</label>
          <input
            type="email"
            className="login-input-field"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="login-form-fields">
          <label className="password-label">Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              className="login-input-field password-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>
{/* Floating Popup Message */}

        <div className="login-wrapper">
          <button className="login-btn" onClick={handleSignIn}>
            <p className="login-btn-text">Login</p>
          </button>
        </div>
      </div>

      <div className="login-image-section">
        <div className="image-text">
          “Power On with <span>Confidence.”</span>
        </div>
        <img className="login-image" alt="Sign In" src={LogInImage} />
      </div>
    </div>
  );
};

export default SignIn;

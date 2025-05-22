
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "../CustomerLogin/CustomerLogin.css";
import Logo from "../../../assets/images/aviation-logo.png";
import LogInImage from "../../../assets/images/signinpage-image.png";
import { FaEye, FaEyeSlash, FaInfoCircle } from "react-icons/fa";
import PhoneInput from "react-phone-input-2";
import { useLocation } from "react-router-dom";
import PopupMessage from "../../../components/Popup/Popup";
import API_BASE_URL from "../../../config";

const CustomerLogin = ({ setCustomerAuthenticated }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [showResendLink, setShowResendLink] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [googleUserId, setGoogleUserId] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });


    const [showMobilePopup, setShowMobilePopup] = useState(false);
    const location = useLocation();

    const showPopup = (text, type) => {
        setPopupMessage({ text, type });
        setTimeout(() => setPopupMessage({ text: "", type: "" }), 10000000);
    };


    const handleLogin = async () => {
        if (!email || !password) {
            showPopup("Please fill all fields", "error");
            return;
        }


        if (!password) {
            showPopup("Please enter your password", "error");
            return;
        }
        try {
            const response = await axios.post(`${API_BASE_URL}/customer-login`, { email, password });

            if (response.data.status_code === 200) {
                showPopup("Login successful!", "success");
                setCustomerAuthenticated(true);
                localStorage.setItem("customerData", JSON.stringify(response.data));
                localStorage.setItem("customer_id", response.data.customer_id);
                navigate("/");
            } else {
                showPopup(response.data.error || "Invalid credentials.", "error");
            }
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.error || "Login failed. Try again.";

            if (status === 403) {
                showPopup("Your account is not verified. Please check your email.", "error");
                setShowResendLink(true);
                setUserEmail(error.response.data.email);
            } else {
                showPopup(message, "error");
            }
        }


    };
    const handleGoogleSuccess = async (response) => {
        if (!response.credential) {
            showPopup("Google Sign-In failed. No credential received.", "error");
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/google-login`,
                { token: response.credential },
                { headers: { "Content-Type": "application/json" } }
            );

            if (res.data.existing_customer) {
                if (res.data.register_status === 0) {
                    console.log("Setting Google User ID:", res.data.customer_id);
                    setGoogleUserId(res.data.customer_id);
                    setShowMobilePopup(true);
                } else {
                    showPopup("Login successful!", "success");

                    localStorage.setItem("customerData", JSON.stringify(res.data));
                    localStorage.setItem("customer_id", res.data.customer_id);

                    setCustomerAuthenticated(true);

                    setTimeout(() => {
                        navigate("/");
                    }, 100);
                }
            } else if (res.data.new_customer) {
                showPopup("Account created successfully! A verification email has been sent to your email address. Please check for verification link in  spam folder if not available in inbox.  Please verify before logging in.", "success");
                localStorage.setItem("pending_email", res.data.email);
            }
        } catch (error) {
            if (error.response?.status === 403) {
                showPopup("Your account is not verified. Please check your email.", "error");
                setShowResendLink(true);
                setUserEmail(error.response.data.email);
            } else {
                showPopup(error.response?.data?.error || "Google login failed. Please try again later.", "error");
            }
            console.error(error);
        }
    };


    const handleResendVerification = async () => {
        if (!email) {
            showPopup("User email is required to resend verification.", "error");
            return;
        }

        try {
            setShowResendLink(false); 

            const response = await axios.post(`${API_BASE_URL}/resend-verification-email`, { email});

            if (response.data.message) {
                showPopup("Verification email resent successfully.", "success");
            } else {
                showPopup(response.data.error || "Failed to resend verification email.", "error");
                setShowResendLink(true);
            }
        } catch (error) {
            showPopup(error.response?.data?.error || "Error resending verification email. Please try again later.", "error");
            setShowResendLink(true); 
        }
    };
    const handleSubmitMobile = async () => {
        const formattedNumber = mobileNumber.startsWith("+") ? mobileNumber : "+" + mobileNumber;

        if (!formattedNumber || formattedNumber.length < 10) {
            showPopup("Please enter a valid mobile number.", "error");
            return;
        }

        if (!googleUserId) {
            showPopup("User ID is missing. Try signing in again.", "error");
            return;
        }

        if (!mobileNumber) {
            showPopup("Please enter a valid mobile number.", "error");
            return;
        }


        console.log("Submitting Data:", { customer_id: googleUserId, mobile_no: mobileNumber }); 

        try {
            const response = await axios.post(`${API_BASE_URL}/google-submit-mobile`, {
                customer_id: googleUserId,
                mobile_no: formattedNumber,
            });

            if (response.data.message) {
                showPopup("Mobile number added successfully!", "success");
                localStorage.setItem("customerData", JSON.stringify(response.data));
                localStorage.setItem("customer_id", googleUserId); 
                setShowMobilePopup(false);
                navigate("/");
            }
        } catch (error) {
            showPopup(error.response?.data?.error || "Failed to save mobile number.", "error");

        }
    };

    const [showForgotPasswordPopup, setShowForgotPasswordPopup] = useState(false);
    const [forgotPasswordIdentifier, setForgotPasswordIdentifier] = useState("");
    const [showOTPVerification, setShowOTPVerification] = useState(false);
    const [resetLink, setResetLink] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showResetPasswordPopup, setShowResetPasswordPopup] = useState(false);
    const [otpTimer, setOtpTimer] = useState(120); 
    const [resendDisabled, setResendDisabled] = useState(true); 

    const handleForgotPassword = async () => {
        if (!forgotPasswordIdentifier) {
            showPopup("Please enter Email or Mobile Number", "error");
            return;
        }

        if (!isNaN(forgotPasswordIdentifier) && !forgotPasswordIdentifier.startsWith("+")) {
            showPopup("Please enter a valid mobile number with country code.", "error");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/otp-generate`, {
                identifier: forgotPasswordIdentifier,
            });

            if (response.data.message) {
                showPopup(response.data.message, "success");
                setResetLink(response.data.reset_token);
                setShowForgotPasswordPopup(false);
                setShowOTPVerification(true);
                setResendDisabled(true);
                setOtpTimer(120); 
            }

        } catch (error) {
            showPopup(error.response?.data?.error || "Failed to send OTP.", "error");

        }
    };

    useEffect(() => {
        if (showOTPVerification && otpTimer > 0) {
            const interval = setInterval(() => {
                setOtpTimer((prev) => {
                    if (prev === 1) {
                        clearInterval(interval);
                        setResendDisabled(false); 
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval); 
        }
    }, [showOTPVerification, otpTimer]);


    const [otp, setOtp] = useState(["", "", "", "", "", ""]); 

    const handleInputChange = (e, index) => {
        const value = e.target.value;
        if (!/^\d*$/.test(value)) return; 

        let newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1); 

        setOtp(newOtp);
        if (value && index < otp.length - 1) {
            document.getElementById(`otp-input-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            document.getElementById(`otp-input-${index - 1}`).focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
        if (pastedData.length === 6) {
            setOtp(pastedData);
        }
    };

    const handleVerifyOTP = async () => {
        const enteredOTP = otp.join(""); 
        if (enteredOTP.length !== 6) {
            showPopup("Please enter a valid 6-digit OTP.", "error");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
                identifier: forgotPasswordIdentifier,
                otp: enteredOTP,
                reset_link: resetLink,
            });

            if (response.data.message) {
                showPopup(response.data.message, "success");
                setShowOTPVerification(false);
                setShowResetPasswordPopup(true);
            }
        } catch (error) {
            showPopup(error.response?.data?.error || "OTP verification failed.", "error");

        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            showPopup("Please enter and confirm your new password.", "error");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/set-new-password`, {
                identifier: forgotPasswordIdentifier,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });

            if (response.data.message) {
                showPopup("Password reset successful!", "success");
                setShowResetPasswordPopup(false);
            }
        } catch (error) {
            showPopup(error.response?.data?.error || "Password reset failed.", "error");

        }
    };

    useEffect(() => {
        if (location.state && location.state.successMessage) {
            setPopupMessage({
                text: location.state.successMessage,
                type: "success"
            });
        }
    }, [location]);
    return (
        <div className="customer-login-container">
            <div className="customer-login-form-section">
                <div>
                    <img src={Logo} className="customer-login-logo" alt="Logo" />
                </div>
                <div className="customer-login-text">Customer Login</div>


                {showMobilePopup && (
                    <div className="mobile-popup">
                        <div className="mobile-popup-content">
                            <p>Enter Mobile Number</p>
                            <PhoneInput
                                country={"in"}
                                value={mobileNumber}
                                onChange={(value) => setMobileNumber(value)}
                            />
                            <div className="mobile-buttons">
                                <button className="cart-place-order" onClick={handleSubmitMobile}>Submit</button>
                                <button className="cart-delete-selected" onClick={() => setShowMobilePopup(false)}>Cancel</button>
                            </div> </div>
                    </div>
                )}

                <div className="customer-login-form-fields">
                    {popupMessage.text && (
                        <PopupMessage
                            message={popupMessage.text}
                            type={popupMessage.type}
                            onClose={() => setPopupMessage({ text: "", type: "" })}
                        />
                    )}


                    {showResendLink && (
                        <div className="resend-verification">
                            <p className="resend-text">Your account is not verified. Please click on the link below to resend verification link.</p>
                            <button className="resend-button" onClick={handleResendVerification}>Resend Verification Email</button>
                        </div>
                    )}
                    <label className="customer-login-label">Email<span className="required-star">*</span></label>

                    <input
                        type="email"
                        className="customer-login-input-field"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>


                <div className="customer-login-form-fields" >
                    <label className="customer-login-label">
                        Password
                        <span
                            className="password-tooltip-icon"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}

                        ><span className="required-star">*</span>
                            <FaInfoCircle />
                        </span>
                    </label>
                    {showTooltip && (
                        <div className="password-tool-tip">
                            <ul className="password-tool-tip-list" >
                                <li>At least 8 characters long</li>
                                <li>Contains an uppercase letter</li>
                                <li>Contains a lowercase letter</li>
                                <li>Contains a special character</li>
                                <li>Contains a number</li>
                            </ul>
                        </div>
                    )}
                    <div className="customer-login-password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="customer-login-input-field customer-login-password-input"

                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        required
                        />
                        <span
                            className="customer-login-password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                    <div className="forgot-password" onClick={() => setShowForgotPasswordPopup(true)}>
                        Forgot Password?
                    </div>
                </div>

                <div className="customer-login-wrapper">
                    <button className="customer-login-btn" onClick={handleLogin}>
                        <p className="customer-login-btn-text">Login</p>
                    </button>
                </div>
                <hr className="customer-login-divider" />

                <div className="customer-login-actions">

                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => showPopup("Google Sign-In failed.", "error")} />

                    <button className="customer-register-btn" onClick={() => navigate("/customer-register")}>
                        <p className="customer-register-btn-text">Create Account</p>
                    </button>
                </div>
            </div>

            <div className="customer-login-image-section">
                <div className="customer-login-image-text">
                    “Power On with <span>Confidence.”</span>
                </div>
                <img className="customer-login-image" alt="LogIn" src={LogInImage} />
            </div>
            {showForgotPasswordPopup && (
                <div className="forgot-password-popup">
                    <div className="popup-content">
                        <h3>Forgot Password</h3>

                        {!forgotPasswordIdentifier || isNaN(forgotPasswordIdentifier) ? (
                            <input
                                type="email"
                                placeholder="Enter Email/Mobile No."
                                value={forgotPasswordIdentifier}
                                onChange={(e) => setForgotPasswordIdentifier(e.target.value)}
                            />
                        ) : (
            
                            <PhoneInput
                                className="forgot-phone-input-otp"
                                country={"in"}
                                value={forgotPasswordIdentifier}
                                onChange={(value) => setForgotPasswordIdentifier("+" + value)} 
                                inputProps={{
                                    required: true,
                                }}
                            />

                        )}
                        <div className="forget_buttons">
                            <button className="sendotp" onClick={handleForgotPassword}>Send OTP</button>
                            <button className="cancel" onClick={() => setShowForgotPasswordPopup(false)}>Cancel</button>
                        </div>
                    </div>

                </div>
            )}
            {showOTPVerification && (
                <div className="otp-verification-popup">
                    <div className="verify-popup-content">
                        <h3 className="verify-otp-heading">Verify OTP</h3>
                        <p className="subtitle">Enter the 6-digit verification OTP.</p>

                        <div className="otp-container" onPaste={handlePaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-input-${index}`}
                                    type="text"
                                    maxLength="1"
                                    className="otp-input"
                                    value={digit}
                                    onChange={(e) => handleInputChange(e, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                />
                            ))}
                        </div>
                        <div className="forget_buttons">
                            <button className="verifyOTP" onClick={handleVerifyOTP}>Verify OTP</button>
                            <button className="verify-cancel" onClick={() => setShowOTPVerification(false)}>Cancel</button>
                        
                        </div>
                        <div className="resend-container">
                            <p className="resend" disabled={resendDisabled} onClick={handleForgotPassword}>
                                Resend OTP {resendDisabled ? `(${otpTimer}s)` : ""}
                            </p>
                        </div>

                    </div>
                </div>
            )}
            {showResetPasswordPopup && (
                <div className="reset-password-popup">
                    <div className="popup-content">
                        <h3>Set New Password</h3>
                        <input
                            type="password"
                            placeholder="Enter New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <div className="reset_buttons">
                            <button className="reset_password" onClick={handleResetPassword}>Reset Password</button>
                            <button className="reset-cancel" onClick={() => setShowResetPasswordPopup(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CustomerLogin;
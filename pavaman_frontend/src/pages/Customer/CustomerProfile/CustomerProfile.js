import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerProfile.css";
import CustomerIcon from "../../../assets/images/contact-icon.avif";
import { BiSolidPencil } from "react-icons/bi";
import { FaTimes } from "react-icons/fa";

const CustomerProfile = ({ refresh }) => {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);

    const customerId = localStorage.getItem("customer_id");
    const [editField, setEditField] = useState(null);
    const [tempData, setTempData] = useState({});
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");

    const fetchCustomerProfile = async () => {
        if (!customerId) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/get-customer-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id: customerId }),
            });

            const data = await response.json();
            if (response.ok) {
                setCustomer(data.profile);
            } else {
                setError(data.error || "Failed to fetch customer profile");
                triggerPopup(data.error || "Failed to fetch customer profile", "error");
            }
        } catch (error) {
            const message = "Fetch error: " + error.message;
            setError(message);
            triggerPopup(message, "error");
        } finally {
            setLoading(false);
        }
    };

    const triggerPopup = (text, type) => {
        setPopupMessage({ text, type });
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
    };

    useEffect(() => {
        fetchCustomerProfile();
    }, [customerId, refresh]);


    if (!customerId) {
        return (
            <div className="customer-profile-container">
                <div className="customer-not-logged-in-box">
                    Customer is not logged in.
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="loading-box">Loading profile...</div>;
    }

    if (error) {
        return (
            <div className="customer-profile-container">
                <div className="customer-error">{error}</div>
            </div>
        );
    }

    const handleEditClick = (field) => {
        setEditField(field);
        setTempData({ ...customer });
        setOtp("");
        setOtpSent(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTempData((prev) => ({ ...prev, [name]: value }));
    };

    const sendEmailOtp = async () => {
        const response = await fetch("http://127.0.0.1:8000/edit-profile-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "send_email_otp",
                customer_id: customerId,
                email: tempData.email,
                first_name: tempData.first_name,
            }),
        });
        const data = await response.json();
        if (response.ok) {
            setOtpSent(true);
            triggerPopup(data.message, "success");
        } else {
            triggerPopup(data.error, "error");
        }
    };
    
    // Verify email OTP
    const verifyEmailOtp = async () => {
        const response = await fetch("http://127.0.0.1:8000/edit-profile-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "verify_email_otp",
                customer_id: customerId,
                verification_link: otp,
            }),
        });
        const data = await response.json();
        if (response.ok) {
            triggerPopup(data.message, "success");
            fetchCustomerProfile(); // refresh profile
            setEditField(null);
        } else {
            triggerPopup(data.error, "error");
        }
    };

    return (
        <div className="customer-profile-container">
            {showPopup && (
                <div className={`popup-message ${popupMessage.type}`}>
                    {popupMessage.text}
                </div>
            )}

            <div className="customer-profile-card">
                <div className="customer-avatar-section">
                    <img src={CustomerIcon} alt="Customer" className="customer-avatar" />
                    <div className="customer-avatar-name">
                        {customer.first_name} {customer.last_name}
                    </div>
                </div>

                {/* Personal Info */}
                <div className="customer-profile-header">
                    <h3 className="profile-edit-main-heading">Personal Information</h3>
                    <BiSolidPencil className="edit-icon" onClick={() => handleEditClick("name")} />
                </div>
                <div className="customer-input-row">
                    <h3 className="profile-edit-heading">First Name</h3>
                    <input type="text" value={customer.first_name || "-"} readOnly className="customer-input-row-profile" />
                    <h3 className="profile-edit-heading">Last Name</h3>
                    <input type="text" value={customer.last_name || "-"} readOnly className="customer-input-row-profile" />
                </div>

                {/* Email */}
                <div className="customer-profile-header">
                    <h3 className="profile-edit-heading">Email Address</h3>
                    <BiSolidPencil className="edit-icon" onClick={() => handleEditClick("email")} />
                </div>
                <div className="customer-input-single">
                    <input type="email" value={customer.email || "-"} readOnly className="customer-input-row-profile" />
                </div>

                {/* Mobile */}
                <div className="customer-profile-header">
                    <h3 className="profile-edit-heading">Mobile Number</h3>
                    <BiSolidPencil className="edit-icon" onClick={() => handleEditClick("mobile_no")} />
                </div>
                <div className="customer-input-single">
                    <input type="text" value={customer.mobile_no || "-"} readOnly className="customer-input-row-profile" />
                </div>
            </div>
            {editField === "email" && (
    <div className="edit-popup-box">
        <input
            type="email"
            name="email"
            value={tempData.email}
            onChange={handleInputChange}
            className="edit-input"
            placeholder="Enter new email"
        />
        {!otpSent ? (
            <button className="send-otp-btn" onClick={sendEmailOtp}>
                Send OTP
            </button>
        ) : (
            <>
                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="edit-input"
                />
                <button className="verify-otp-btn" onClick={verifyEmailOtp}>
                    Verify
                </button>
            </>
        )}
        <FaTimes className="edit-cancel-icon" onClick={() => setEditField(null)} />
    </div>
)}

        </div>
    );
};

export default CustomerProfile;

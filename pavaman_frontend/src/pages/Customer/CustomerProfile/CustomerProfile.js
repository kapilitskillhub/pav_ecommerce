import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerProfile.css";
import CustomerIcon from "../../../assets/images/contact-icon.avif";

const CustomerProfile = ({ refresh }) => {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);

    const customerId = localStorage.getItem("customer_id");

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

    const handleEditClick = () => {
        navigate("/edit-profile", { state: { customer } });
    };

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
        return (
            <div >
                <div className="loading-box">Loading profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="customer-profile-container">
                <div className="customer-error">{error}</div>
            </div>
        );
    }

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
                <div className="customer-profile-header">
                    <h3 className="profile-edit-main-heading">Personal Information</h3>
                    <span className="customer-edit-link" onClick={handleEditClick}>
                        Edit
                    </span>
                </div>

                <div className="customer-input-row">
                    <h3 className="profile-edit-heading">First Name</h3>
                    <input
                        className="customer-input-row-profile"
                        type="text"
                        value={customer.first_name || "-"}
                        readOnly
                    />
                    <h3 className="profile-edit-heading">Last Name</h3>
                    <input
                        className="customer-input-row-profile"
                        type="text"
                        value={customer.last_name || "-"}
                        readOnly
                    />
                </div>

                <div className="customer-profile-header">
                    <h3 className="profile-edit-heading">Email Address</h3>
                </div>
                <div className="customer-input-single">
                    <input
                        className="customer-input-row-profile"
                        type="email"
                        value={customer.email || "-"}
                        readOnly
                    />
                </div>

                <div className="customer-profile-header">
                    <h3 className="profile-edit-heading">Mobile Number</h3>
                </div>
                <div className="customer-input-single">
                    <input
                        className="customer-input-row-profile"
                        type="text"
                        value={customer.mobile_no || "-"}
                        readOnly
                    />
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;


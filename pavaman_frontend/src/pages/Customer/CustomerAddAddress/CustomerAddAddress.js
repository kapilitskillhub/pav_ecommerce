import React, { useState, useEffect } from "react";
import "../CustomerAddAddress/CustomerAddAddress.css";
import PopupMessage from "../../../components/Popup/Popup";


const AddCustomerAddress = ({ onAddressAdded }) => {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        mobile_number: "",
        alternate_mobile: "",
        pincode: "",
        locality: "",
        address: "",
        city: "",
        email: "",
        state: "",
        landmark: "",
        district: "",
        street: "",
        addressType: "home",
    });

    const [loading, setLoading] = useState(false);
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);

    const displayPopup = (text, type = "success") => {
        setPopupMessage({ text, type });
        setShowPopup(true);

        setTimeout(() => {
            setShowPopup(false);
        }, 10000);
    };


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Auto-fetch district and state from pincode
    useEffect(() => {
        const fetchLocationDetails = async () => {
            if (formData.pincode.length === 6) {
                try {
                    const response = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`);
                    const result = await response.json();

                    if (result[0].Status === "Success") {
                        const postOffice = result[0].PostOffice[0];
                        setFormData(prev => ({
                            ...prev,
                            district: postOffice.District,
                            state: postOffice.State
                        }));
                    } else {
                        console.error("Invalid pincode");
                        setFormData(prev => ({
                            ...prev,
                            district: "",
                            state: ""
                        }));
                    }
                } catch (error) {
                    console.error("Failed to fetch pincode details:", error);
                }
            }
        };

        fetchLocationDetails();
    }, [formData.pincode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPopupMessage("");

        const customer_id = localStorage.getItem("customer_id");

        if (!customer_id) {
            alert("Please log in to continue.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/add-customer-address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id, ...formData }),
            });

            const data = await response.json();

            if (data.status_code === 200) {
                displayPopup("Address added successfully!","success");
                setTimeout(() => {
                    onAddressAdded();
                }, 3000);
            } else {
                displayPopup(data.error || "Failed to add address.", "error");
            }
        } catch (error) {
            displayPopup("An unexpected error occurred.","error");
            console.error("API Error:", error);
            onAddressAdded("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fedit-address">
            <h3 className="manage-form-title">ADD A NEW ADDRESS</h3>
                <div className="popup-cart">
                                    {showPopup && (
                                    <PopupMessage
                                        message={popupMessage.text}  
                                        type={popupMessage.type}
                                        onClose={() => setShowPopup(false)}
                                    />
                                )}
                                </div>
            <form onSubmit={handleSubmit} className="manage-address-form">
                {/* First & Last Name */}
                <div className="manage-form-row">
                    <div className="manage-input-group">
                        <label>First Name</label>
                        <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="First Name" />
                    </div>
                    <div className="manage-input-group">
                        <label>Last Name</label>
                        <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="Last Name" />
                    </div>
                </div>

                {/* Mobile Numbers */}
                <div className="manage-form-row">
                    <div className="manage-input-group">
                        <label>Mobile Number</label>
                        <input type="text" name="mobile_number" placeholder="Mobile Number" value={formData.mobile_number} onChange={handleChange} required pattern="\d{10}" />
                    </div>
                    <div className="manage-input-group">
                        <label>Alternate Mobile</label>
                        <input type="text" name="alternate_mobile" placeholder="Alternate Mobile (Optional)" value={formData.alternate_mobile} onChange={handleChange} />
                    </div>
                </div>

                {/* Email & Pincode */}
                <div className="manage-form-row">
                    <div className="manage-input-group">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="manage-input-group">
                        <label>Pincode</label>
                        <input type="text" name="pincode" placeholder="Pincode" value={formData.pincode} onChange={handleChange} required pattern="\d{6}" />
                    </div>
                </div>

                {/* Address */}
                <label className="address-label">Address</label>
                <textarea className="manage-address-input" name="street" placeholder="Address (Area and Street)" value={formData.street} onChange={handleChange} required />

                {/* City & State */}
                <div className="manage-form-row">
                    <div className="manage-input-group">
                        <label>District</label>
                        <input type="text" name="district" placeholder="City/District/Town" value={formData.district} onChange={handleChange} required />
                    </div>
                    <div className="manage-input-group">
                        <label>State</label>
                        <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleChange} required />
                    </div>
                </div>

                {/* Landmark & Locality */}
                <div className="manage-form-row">
                    <div className="manage-input-group">
                        <label>Landmark</label>
                        <input type="text" name="landmark" placeholder="Landmark (Optional)" value={formData.landmark} onChange={handleChange} />
                    </div>
                    <div className="manage-input-group">
                        <label>Locality</label>
                        <input type="text" name="locality" placeholder="Locality" value={formData.locality} onChange={handleChange} required />
                    </div>
                </div>

                {/* Address Type */}
                <div className="edit-manage-address-type address-space">
                    <label>Address Type</label>
                    <label>
                        <input className="radio-btn" type="radio" name="addressType" value="home" checked={formData.addressType === "home"} onChange={handleChange} />
                        Home
                    </label>
                    <label>
                        <input className="radio-btn" type="radio" name="addressType" value="work" checked={formData.addressType === "work"} onChange={handleChange} />
                        Work
                    </label>
                </div>

                {/* Buttons */}
                <div className="cart-actions">
                    <button type="submit" className="cart-place-order" disabled={loading || !formData.first_name || !formData.pincode}>
                        {loading ? "Saving..." : "SAVE"}
                    </button>
                    <button type="button" className="cart-delete-selected" onClick={() => onAddressAdded()}>
                        CANCEL
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddCustomerAddress;

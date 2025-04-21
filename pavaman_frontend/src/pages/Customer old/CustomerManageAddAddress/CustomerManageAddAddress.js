import React, { useState } from "react";
import "./CustomerManageAddAddress.css";
import Popup from "../../../components/Popup/Popup";

const CustomerManageAddAddress = ({ onAddressAdded }) => {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        mobile_number: "",
        alternate_mobile: "",
        pincode: "",
        locality: "",
        street: "",
        district: "",
        state: "",
        landmark: "",
        email: "",
        addressType: "home",
    });

    const [loading, setLoading] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

    const showPopupMessage = (message) => {
        setPopupMessage(message);
        setTimeout(() => setPopupMessage(""), 3000); // Clear message after 3 seconds
    };

    // Fetch City & State details using Pincode
    const fetchLocationDetails = async (pincode) => {
        setLoading(true);
        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();

            if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
                const postOfficeData = data[0].PostOffice[0];

                setFormData((prevFormData) => ({
                    ...prevFormData,
                    state: postOfficeData.State || "",
                    district: postOfficeData.District || ""
                }));

                showPopupMessage("Location details fetched successfully!");
            } else {
                showPopupMessage("Invalid Pincode! Unable to fetch details.");
            }
        } catch (error) {
            showPopupMessage("An unexpected error occurred while fetching location details.");
            console.error("Location fetch error:", error);
        }
        setLoading(false);
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value
        }));

        // Auto-fetch City/State when valid Pincode is entered
        if (name === "pincode" && /^[0-9]{6}$/.test(value)) {
            fetchLocationDetails(value);
        }
    };

    // Handle form submission
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
        // Validate required fields
    const requiredFields = ["first_name", "last_name", "mobile_number", "pincode", "locality", "street", "district", "state"];
    for (let field of requiredFields) {
        if (!formData[field] || formData[field].trim() === ""){
            showPopupMessage(`Please fill in all required fields! Missing: ${field}`);
            setLoading(false);
            return;
        }
    }
    console.log("Form Data:", formData);
        try {
            const response = await fetch("http://127.0.0.1:8000/add-customer-address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id, ...formData }),
            });

            const data = await response.json();

            if (data.status_code === 200) {
                showPopupMessage("Address added successfully!");
                setTimeout(() => {
                    onAddressAdded(); // Hide form after success
                }, 3000);
            } else {
                showPopupMessage(data.error || "Failed to add address.");
            }
        } catch (error) {
            showPopupMessage("An unexpected error occurred.");
            console.error("API Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fedit-address">
            <h3 className="manage-form-title">ADD A NEW ADDRESS</h3>
            {popupMessage && <p className="popup-message">{popupMessage}</p>}

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

                {/* Pincode & Locality */}
                <div className="manage-form-row">

                <div className="manage-input-group">
                <label>Email</label>
                <input type="email" name="email"  placeholder="Email" value={formData.email} onChange={handleChange} required>
               </input>  
                            </div>

                    <div className="manage-input-group">
                    <label>Pincode</label>
                        <input type="text" name="pincode" placeholder="Pincode" value={formData.pincode} onChange={handleChange} required pattern="\d{6}" />
                    
                    </div>
                    
                </div>

                {/* City & State */}
                <div className="manage-form-row">
                    <div className="manage-input-group">
                    <label>District</label>
                        <input type="text" name="district" placeholder="City/District/Town" value={formData.district} onChange={handleChange} required />
                        
                    </div>
                    <div className="manage-input-group">
                    <label>State</label>
                        <input name="state"  placeholder="State" value={formData.state} onChange={handleChange} required>
                            
                        </input>
                        
                    </div>
                </div>

                {/* Address */}
                <label className="address-label">Address</label>
                <textarea className="manage-address-input" name="street" placeholder="Address (Area and Street)" value={formData.street} onChange={handleChange} required />

                

                {/* Landmark */}
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
                <div className="cm-manage-address-type">
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
                    <button type="submit" className="cart-place-order"  disabled={loading || !formData.first_name || !formData.pincode}>
                        {loading ? "Saving..." : "SAVE"}
                    </button>
                    <button type="button"  className="cart-delete-selected" onClick={onAddressAdded}>
                        CANCEL
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomerManageAddAddress;
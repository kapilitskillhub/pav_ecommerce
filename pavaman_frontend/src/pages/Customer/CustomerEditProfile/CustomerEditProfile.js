import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CustomerEditProfile.css"; 


const CustomerEditProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const customerData = location.state?.customer;

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        mobile_no: ""
    });

    useEffect(() => {
        if (customerData) {
            setFormData({
                first_name: customerData.first_name || "",
                last_name: customerData.last_name || "",
                email: customerData.email || "",
                mobile_no: customerData.mobile_no || ""
            });
        }
    }, [customerData]);

    if (!customerData) {
        return <div className="edit-profile-container"><p>Loading customer data...</p></div>;
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://127.0.0.1:8000/edit-customer-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id: localStorage.getItem("customer_id"),
                    ...formData
                }),
            });

            const result = await response.json();

            if (response.ok) {
                alert("Profile updated successfully!");
                navigate("/profile"); // redirect to profile
            } else {
                alert(result.error || "Failed to update profile");
            }
        } catch (error) {
            alert("Error updating profile: " + error.message);
        }
    };

    return (
        <div className="edit-profile-container">
            <h2>Edit Your Profile</h2>
            <form onSubmit={handleSubmit} className="edit-profile-form">
                <div className="input-row">
                    <input
                        type="text"
                        name="first_name"
                        placeholder="First Name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="last_name"
                        placeholder="Last Name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="input-single">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="input-single">
                    <input
                        type="text"
                        name="mobile_no"
                        placeholder="Mobile Number"
                        value={formData.mobile_no}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="button-row">
                    <button className="save-changes-edit-profile" type="submit">Save Changes</button>
                    <button   className="cancel-edit-profile" type="button" onClick={() => navigate("/profile")}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default CustomerEditProfile;

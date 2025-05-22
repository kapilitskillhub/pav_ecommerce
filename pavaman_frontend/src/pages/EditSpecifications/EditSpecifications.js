import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import PopupMessage from "../../components/Popup/Popup";
import API_BASE_URL from "../../config";

const EditSpecification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin_id, category_id, sub_category_id, product_id, specifications } = location.state || {};

  const initialSpecs = specifications
    ? Object.entries(specifications).map(([name, value]) => ({ name, value }))
    : [];

  const [specs, setSpecs] = useState(initialSpecs);
  const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);

  
  const displayPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
    }, 10000);
  };
  
  const handleChange = (index, field, value) => {
    const updatedSpecs = [...specs];
    updatedSpecs[index][field] = value;
    setSpecs(updatedSpecs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requestData = {
      admin_id,
      category_id,
      sub_category_id,
      product_id,
      number_of_specifications: specs.length,
      specifications: specs,
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/edit-product-specifications`, requestData);
      if (response.data.status_code === 200) {
        displayPopup("Specifications updated successfully!","success");
        setTimeout(() => {
        navigate(-1);
      }, 2000); 
      } else {
        displayPopup("Failed to update specifications.","error");
      }
    } catch (error) {
      displayPopup("Error updating specifications. Please try again.","error");
    }
  };

  return (
    <div>
      <h2>Edit Specifications</h2>
      <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>
      <form onSubmit={handleSubmit}>
        {specs.map((spec, index) => (
          <div key={index}>
            <label>Specification Name:</label>
            <input
              type="text"
              value={spec.name}
              onChange={(e) => handleChange(index, "name", e.target.value)}
              readOnly 
            />
            <label>Value:</label>
            <input
              type="text"
              value={spec.value}
              onChange={(e) => handleChange(index, "value", e.target.value)}
            />
          </div>
        ))}
        <button type="submit">Update Specifications</button>
      </form>
      <button onClick={() => navigate(-1)}>Cancel</button>
    </div>
  );
};

export default EditSpecification;

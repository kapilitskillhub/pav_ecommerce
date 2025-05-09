import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import PopupMessage from "../../components/Popup/Popup";
import { Link } from "react-router-dom";

const AddSpecification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin_id, category_id, sub_category_id, product_id } = location.state || {};

  const [numSpecifications, setNumSpecifications] = useState(0);
  const [specifications, setSpecifications] = useState([]);
  const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);

  const displayPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
    }, 10000);
  };

  // Increment counter
  const handleIncrement = () => {
    setNumSpecifications((prev) => prev + 1);
    setSpecifications([...specifications, { name: "", value: "" }]);
  };

  // Decrement counter
  const handleDecrement = () => {
    if (numSpecifications > 0) {
      setNumSpecifications((prev) => prev - 1);
      setSpecifications(specifications.slice(0, -1)); // Remove last item
    }
  };

  // Handle input field changes
  const handleSpecificationChange = (index, field, value) => {
    const updatedSpecs = [...specifications];
    updatedSpecs[index] = { ...updatedSpecs[index], [field]: value };
    setSpecifications(updatedSpecs);
  };

  // Submit data to API
  const handleSubmitSpecifications = async () => {
    if (numSpecifications === 0) {
      displayPopup("Please add at least one specification.", "error");

      return;
    }

    if (specifications.some((spec) => !spec.name.trim() || !spec.value.trim())) {
      displayPopup("Please fill in all specifications.", "error");

      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/add-product-specifications", {
        admin_id,
        category_id,
        sub_category_id,
        product_id,
        number_of_specifications: numSpecifications,
        specifications,
      });

      if (response.data.status_code === 200) {
      displayPopup("Specifications added successfully!", "success");
      setTimeout(() => {
        navigate(-1);
      }, 2000);  
      } else {
        displayPopup(response.data.error || "Failed to add specifications.", "error");

      }
    } catch (error) {
      displayPopup("Failed to add specifications.", "error");

    }
  };

  return (
    <div >
      <h2>Add Specifications</h2>
      <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>
      {/* Counter Section */}
      <div >
        <button onClick={handleDecrement} disabled={numSpecifications === 0} >
          -
        </button>
        <span >{numSpecifications}</span>
        <button onClick={handleIncrement} >
          +
        </button>
      </div>

      {/* Dynamic Specification Input Fields */}
      {specifications.map((spec, index) => (
        <div key={index} >
          <input
            type="text"
            placeholder={`Specification ${index + 1} Name`}
            value={spec.name}
            onChange={(e) => handleSpecificationChange(index, "name", e.target.value)}
         
          />
          <input
            type="text"
            placeholder={`Value`}
            value={spec.value}
            onChange={(e) => handleSpecificationChange(index, "value", e.target.value)}
        
          />
        </div>
      ))}

      {/* Buttons */}
      <button onClick={handleSubmitSpecifications} disabled={numSpecifications === 0}>
        Add
      </button>
      <button onClick={() => navigate(-1)}>
        Cancel
      </button>
    </div>
  );
};

export default AddSpecification;

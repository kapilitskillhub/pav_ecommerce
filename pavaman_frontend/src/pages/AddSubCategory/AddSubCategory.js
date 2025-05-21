import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../AddCategory/AddCategory.css"; 
import UploadFileIcon from "../../assets/images/upload-file-icon.svg";
import SuccessIcon from "../../assets/images/succes-icon.png";
import SuccessMessageImage from "../../assets/images/success-message.svg";
import PopupMessage from "../../components/Popup/Popup";
import { Link } from "react-router-dom";
import API_BASE_URL from "../../config";
const AddSubCategory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { category_id, category_name } = location.state || {}; 
  const [subCategoryName, setSubCategoryName] = useState(""); 
  const [subCategoryImage, setSubCategoryImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); 
  const [isImageUploaded, setIsImageUploaded] = useState(false); 
  const [loading, setLoading] = useState(false); 
  const [successMessage, setSuccessMessage] = useState(""); 
 const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);

  const displayPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
    }, 10000);
  };
  useEffect(() => {
    const adminId = sessionStorage.getItem("admin_id");

    if (!adminId) {
      displayPopup("Session expired. Please log in again.", "error");
      sessionStorage.clear();
      navigate("/admin-login");
    }
  }, [navigate]);

  const handleFileChange = (e) => {
    if (e.target.files.length === 0) return;
    const file = e.target.files[0];

    setSubCategoryImage(file);
    setImagePreview(URL.createObjectURL(file));
    setIsImageUploaded(true);

    e.target.value = ""; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const adminId = sessionStorage.getItem("admin_id");
  
    if (!adminId) {
    displayPopup(
          <>
            Admin session expired. Please <Link to="/admin-login" className="popup-link">log in</Link> again.
          </>,
          "error"
        );
      return;
    }

    if (!subCategoryName.trim()) {
      displayPopup("Please enter the subcategory name.", "error");

      return;
    }
    if (!subCategoryImage) {
      displayPopup("Please upload image.", "error");

      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("admin_id", adminId);
    formData.append("category_id", category_id);
    formData.append("sub_category_name", subCategoryName);
    formData.append("sub_category_image", subCategoryImage);

    try {
      const response = await fetch(`${API_BASE_URL}/add-subcategory`, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        displayPopup("SubCategory added successfully!", "success");
        setTimeout(() => {
        navigate("/view-subcategories", { state: { category_id, category_name ,successMessage: "Subcategory updated successfully!" } });
      }, 2000); 
    } else {
      displayPopup(data.error || "Failed to add subcategory.", "error");

      }
    } catch (error) {
      console.error("Error:", error);
      displayPopup(error,"Something went wrong. Please try again.", "error");

    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/view-subcategories", { state: { category_id, category_name } });
  };

  return (
    <div className="add-card-form-page">
      
      <header className="form-header">
        <h1 className="form-title">Subcategory Details</h1>
        <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>
        {successMessage && (
          <div className="success-message-container">
            <img src={SuccessMessageImage} alt="Success" className="success-image" />
            <p className="success-message-text">{successMessage}</p>
          </div>
        )}
      </header>
      <div className="add-card-form">
        <form onSubmit={handleSubmit}>
          <div className="form-group category-field">
            <label className="category-name-label">Category Name</label>
            <input type="text" value={category_name} disabled className="category-name-input" />
          </div>
          <div className="form-group sub-category-field">
            <label htmlFor="subCategoryName" className="category-name-label">Subcategory Name</label>
            <input
              type="text"
              id="subCategoryName"
              className="category-name-input"
              placeholder="Enter Subcategory Name..."
              value={subCategoryName}
              onChange={(e) => setSubCategoryName(e.target.value)}
            />
          </div>
          <div className="form-group upload-file sub-category-upload-file">
            <label htmlFor="image" className="upload-label">Upload an image</label>
            <div
              className="upload-box"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById("subCategoryImage").click();
              }}
            >
              {isImageUploaded ? (
                <div className="success-icon">
                  <img src={SuccessIcon} alt="Success Icon" className="success-icon-img" />
                  <p>Successfully uploaded file</p>
                </div>
              ) : (
                <>
                  <img src={UploadFileIcon} alt="Upload Icon" className="upload-icon" />
                  <p className="upload-text">
                    <span>Upload File</span> or Drag and Drop
                  </p>
                </>
              )}
              <input
                type="file"
                id="subCategoryImage"
                className="upload-input"
                onChange={handleFileChange}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="form-actions sub-category-form-actions">
            <button type="button" onClick={handleCancel} className="admin-cancel-button">
              Cancel
            </button>
            <button type="submit" className="admin-submit-button" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubCategory;

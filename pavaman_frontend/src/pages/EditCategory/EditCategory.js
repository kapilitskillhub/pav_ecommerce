import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../AddCategory/AddCategory.css";
import UploadFileIcon from "../../assets/images/upload-file-icon.svg";
import SuccessIcon from "../../assets/images/succes-icon.png";
import PopupMessage from "../../components/Popup/Popup";
import { Link } from "react-router-dom";
import API_BASE_URL from "../../config";
const EditCategory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { category_id, category_name, category_image_url } = location.state || {};

  const [name, setName] = useState(category_name || "");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(category_image_url || "");
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
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

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setIsImageUploaded(true);
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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

    if (!name.trim()) {
      setError("Category name is required.");
      displayPopup("Category name is required.", "error");

      return;
    }

    if (!image && !category_image_url) {
      setError("Please upload an image.");
      alert("Please upload an image.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("admin_id", adminId);
    formData.append("category_id", category_id);
    formData.append("category_name", name);
    if (image) formData.append("category_image", image);

    try {
      const response = await fetch(`${API_BASE_URL}/edit-category`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        displayPopup("Category updated successfully!", "success");
        setTimeout(() => {
          navigate("/view-categories", { state: { successMessage: "Category updated successfully!" } });
        }, 2000); 
        
      } else {
        setError(data.error || "Failed to update category.");
        displayPopup(data.error || "Failed to update category.", "error");

      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
      displayPopup(error,"Something went wrong. Please try again.", "error");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-card-form-page">
      <header className="form-header">
        <h1 className="form-title">Edit Category</h1>
      </header>
      <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>
      <div className="add-card-form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="category-name-label">
              Name of the Category
            </label>
            <input
              type="text"
              id="name"
              className="category-name-input"
              placeholder="Enter the Category Name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group upload-file">
            <label htmlFor="image" className="upload-label">
              Upload an Image
            </label>
            <div
              className="upload-box"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById("image").click();
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
                id="image"
                className="upload-input"
                onChange={handleFileChange}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate("/view-categories")} className="admin-cancel-button">
              Cancel
            </button>
            <button type="submit" className="admin-submit-button" disabled={loading}>
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategory;

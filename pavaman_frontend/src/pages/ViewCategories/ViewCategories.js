import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../ViewCategories/ViewCategories.css";
import AddIcon from "../../assets/images/addicon.svg";
import { FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import API_BASE_URL from "../../config";
import { Link } from "react-router-dom";
import PopupMessage from "../../components/Popup/Popup";

const ViewCategories = ({ categories, setCategories }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryNameToDelete, setCategoryNameToDelete] = useState("");

  const displayPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
    }, 10000);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const successMessage = location.state?.successMessage;
    if (successMessage) {
      displayPopup(successMessage, "success");
      navigate(location.pathname, { replace: true }); 
    }
  }, [location]);

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    const adminId = sessionStorage.getItem("admin_id");

    if (!adminId) {
      navigate("/admin-login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/view-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId }),
      });

      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
      } else {
        displayPopup(data.error || "Something went wrong.", "error");
      }
    } catch (error) {
      displayPopup("Failed to fetch categories. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubcategories = (category) => {
    sessionStorage.setItem("categoryData", JSON.stringify(category));
    navigate("/view-subcategories", {
      state: { category_id: category.category_id, category_name: category.category_name },
    });
  };

  const handleEditCategory = (category) => {
    navigate("/edit-category", { state: category });
  };

  const handleDeleteCategory = async () => {
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

    try {
      const response = await fetch(`${API_BASE_URL}/delete-category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: Number(categoryToDelete), admin_id: adminId }),
      });

      const data = await response.json();
      if (response.ok && data.status_code === 200) {
        displayPopup(` Category deleted successfully!`, "success");
        setShowDeletePopup(false);
        setTimeout(() => {
          setCategories(categories.filter((category) => category.category_id !== categoryToDelete));
        }, 100);
      }
      else {
        displayPopup(data.error || "Failed to delete category.", "error");
      }
    } catch (error) {
      displayPopup("Something went wrong. Please try again.", "error");
    }
  };

  const handleAddCategory = () => {
    navigate("/add-category");
  };

  return (
    <div>
      <div className="category-div">
        <div className="category-heading">Categories</div>
        {error && <p className="error-message">{error}</p>}
        {!loading && categories.length === 0 && <p className="no-data">No categories found.</p>}
      </div>
      <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>
      <div className="category-cards">
        {categories.map((category) => (
          <div key={category.category_id} className="category-card">
            <img
              src={category.category_image_url}
              alt={category.category_name}
              onClick={() => handleViewSubcategories(category)}
              className="card-image"
            />
            <p className="card-name">{category.category_name}</p>
            <div className="card-menu">
              <div onClick={() => handleEditCategory(category)} className="edit-label">
                <FaEdit className="edit-icon" />
                <span className="card-menu-icon-label edit-label">Edit</span>
              </div>
              <div
                onClick={() => {
                  setCategoryToDelete(category.category_id);
                  setCategoryNameToDelete(category.category_name);
                  setShowDeletePopup(true);
                }}
                className="delete-label"
              >
                <FaTrash className="delete-icon" />
                <span className="card-menu-icon-label delete-label">Delete</span>
              </div>
            </div>
          </div>
        ))}

        <div className="add-category-card" onClick={handleAddCategory}>
          <img src={AddIcon} alt="Add Category" className="add-category-image" />
        </div>
      </div>
      {showDeletePopup && (
        <div className="admin-popup-overlay popup-overlay">
          <div className="popup-content">
            <p>
              Are you sure you want to delete <strong>"{categoryNameToDelete}"</strong> category?
            </p>
            <div className="popup-buttons">
              <button className="popup-confirm cart-place-order" onClick={handleDeleteCategory}>
                Yes, Delete
              </button>
              <button className="popup-cancel cart-delete-selected" onClick={() => setShowDeletePopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewCategories;

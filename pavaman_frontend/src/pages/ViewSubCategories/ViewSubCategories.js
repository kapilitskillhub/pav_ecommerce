import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../ViewCategories/ViewCategories.css";
import AddIcon from "../../assets/images/addicon.svg";
import { FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import PopupMessage from "../../components/Popup/Popup";
import "react-toastify/dist/ReactToastify.css";
import API_BASE_URL from "../../config";
const ViewSubcategories = ({ subcategories, setSubcategories }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const initialCategoryId = location.state?.category_id || sessionStorage.getItem("current_category_id");
  const initialCategoryName = location.state?.category_name || sessionStorage.getItem("current_category_name");

  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [categoryName, setCategoryName] = useState(initialCategoryName);

  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || "");
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState(null);
  const [showActionSuccessPopup, setShowActionSuccessPopup] = useState(!!successMessage);
  const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);

  const displayPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 10000);
  };

  useEffect(() => {
    if (!categoryId) {
      setError("Category ID is missing.");
      return;
    }
    sessionStorage.setItem("current_category_id", categoryId);
    sessionStorage.setItem("current_category_name", categoryName);

    fetchSubcategories();
  }, [categoryId]);

  useEffect(() => {
    const { successMessage } = location.state || {};
    if (successMessage && categoryId) {
      displayPopup(successMessage, "success");
  
      navigate(location.pathname, {
        replace: true,
        state: {
          category_id: categoryId,
          category_name: categoryName,
        },
      });
    }
  }, [location, categoryId, categoryName]);
  

  const fetchSubcategories = async () => {
    const adminId = sessionStorage.getItem("admin_id");
    if (!adminId) {
      setError("Admin session expired. Please log in again.");
      navigate("/admin-login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/view-subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId, category_id: categoryId }),
      });

      const data = await response.json();
      if (response.ok) {
        setSubcategories(data.subcategories || []);
      } else {
        setError(data.error || "Something went wrong.");
        displayPopup(data.error || "Something went wrong.", "error");
      }
    } catch (error) {
      setError("Failed to fetch subcategories. Please try again.");
      displayPopup("Failed to fetch subcategories. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subcategory) => {
    navigate("/edit-subcategory", {
      state: {
        subcategory_id: subcategory.id,
        subcategory_name: subcategory.sub_category_name,
        category_id: categoryId,
        category_name: categoryName,
        subcategory_image: subcategory.sub_category_image,
      },
    });
  };

  const handleDelete = async () => {
    if (!subcategoryToDelete) return;
  
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
      const response = await fetch(`${API_BASE_URL}/delete-subcategory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: adminId,
          category_id: categoryId,
          subcategory_id: subcategoryToDelete,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setShowDeletePopup(false);
        setSubcategories((prev) => prev.filter((item) => item.id !== subcategoryToDelete));
      
        setTimeout(() => {
          displayPopup("Subcategory deleted successfully!", "success");
        }, 100); 
      }
       else {
        setError(data.error || "Failed to delete subcategory.");
        displayPopup(data.error || "Failed to delete subcategory.", "error");
      }
    } catch (error) {
      setError("Failed to delete subcategory. Please try again.");
      displayPopup("Something went wrong. Please try again.", "error");
    }
  };
  
  const handleAddSubcategory = () => {
    navigate("/add-subcategory", { state: { category_id: categoryId, category_name: categoryName } });
  };

  const handleViewProducts = (subcategory) => {
    const adminId = sessionStorage.getItem("admin_id");
    if (!adminId) {
      displayPopup(
        <>
          Admin session expired. Please{" "}
          <Link to="/admin-login" className="popup-link">log in</Link> again.
        </>,
        "error"
      );
      return;
    }

    sessionStorage.setItem("subCategoryData", JSON.stringify({
      sub_category_id: subcategory.id,
      sub_category_name: subcategory.sub_category_name,
    }));

    navigate("/view-products", {
      state: {
        sub_category_id: subcategory.id,
        sub_category_name: subcategory.sub_category_name,
        category_id: categoryId,
        category_name: categoryName,
      },
    });
  };

  return (
    <div>
      <div className="category-div">
        <div className="category-heading">Sub-Categories</div>
        {loading && <p className="loading">Loading...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && subcategories.length === 0 && <p className="no-data">No subcategories found.</p>}
      </div>

      <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>

      <div className="category-cards">
        {subcategories.map((subcategory) => (
          <div key={subcategory.id} className="category-card">
            <img
              src={subcategory.sub_category_image}
              alt={subcategory.sub_category_name}
              className="card-image"
              onClick={() => handleViewProducts(subcategory)}
            />
            <p className="card-name">{subcategory.sub_category_name}</p>
            <div className="card-menu">
              <div className="edit-label" onClick={() => handleEdit(subcategory)}>
                <FaEdit className="edit-icon" />
                <span className="card-menu-icon-label edit-label">Edit</span>
              </div>
              <div
                onClick={() => {
                  setSubcategoryToDelete(subcategory.id);
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

        <div className="add-category-card" onClick={handleAddSubcategory}>
          <img src={AddIcon} alt="Add Subcategory" className="add-category-image" />
        </div>

        {showDeletePopup && (
          <div className="admin-popup-overlay popup-overlay">
            <div className="popup-content">
              <p>
                Are you sure you want to delete{" "}
                <strong>
                  {subcategories.find((sub) => sub.id === subcategoryToDelete)?.sub_category_name || "this"}
                </strong>{" "}
                subcategory?
              </p>
              <div className="popup-buttons">
                <button className="cart-place-order popup-confirm" onClick={handleDelete}>
                  Yes, Delete
                </button>
                <button className="cart-delete-selected popup-cancel" onClick={() => setShowDeletePopup(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default ViewSubcategories;

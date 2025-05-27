import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../ViewProducts/ViewProducts.css";
import AddIcon from "../../assets/images/addicon.svg";
import { FaEdit, FaTrash, FaRupeeSign, FaTimes } from "react-icons/fa";
import API_BASE_URL from "../../config";
import PopupMessage from "../../components/Popup/Popup";

const ViewProducts = ({ products, setProducts }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { sub_category_id, sub_category_name, category_id, category_name, successMessage } = location.state || {};
  const [message, setMessage] = useState(successMessage || "");
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productNameToDelete, setProductNameToDelete] = useState("");
  const [showActionSuccessPopup, setShowActionSuccessPopup] = useState(false);
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

    if (!category_id || !sub_category_id) {
      setError("Category or Subcategory ID is missing.");
      setLoading(false);
      return;
    }

    fetchProducts(adminId);
  }, [navigate, category_id, sub_category_id]);

  useEffect(() => {
    if (successMessage) {
      displayPopup(successMessage, "success");
      setShowActionSuccessPopup(true);
    }
  }, [successMessage]);


  useEffect(() => {
    if (showActionSuccessPopup) {
      const timer = setTimeout(() => {
        setShowActionSuccessPopup(false);
        setMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showActionSuccessPopup]);

  const fetchProducts = async (adminId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/view-products`, {
        admin_id: adminId,
        category_id,
        sub_category_id,
      });

      if (response.data.status_code === 200) {
        setProducts(response.data.products || []);
      } else {
        setError(response.data.error || "Failed to fetch products.");
      }
    } catch (error) {
      setError("Error fetching products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    navigate("/add-product", {
      state: { category_id, category_name, sub_category_id, sub_category_name },
    });
  };

  const handleEditProduct = (product) => {
    navigate("/edit-product", {
      state: {
        category_id,
        category_name,
        sub_category_id,
        sub_category_name,
        product_id: product.product_id,
        product_name: product.product_name,
        sku_number: product.sku_number,
        price: product.price,
        quantity: product.quantity,
        gst: product.gst || "",
        hsn_code: product.hsn_code || "",
        discount: product.product_discount || "",
        description: product.product_description || "",
        product_images: product.product_images || [],
      },
    });
  };

  const handleDeleteProduct = async () => {
    const adminId = sessionStorage.getItem("admin_id");

    if (!adminId) {
      alert("Session expired. Please log in again.");
      navigate("/admin-login");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/delete-product`, {
        admin_id: adminId,
        category_id,
        sub_category_id,
        product_id: productToDelete,
      });

      if (response.data.status_code === 200) {
        setProducts(products.filter((product) => product.product_id !== productToDelete));
        setMessage(`${productNameToDelete} deleted successfully!`);
        setShowDeletePopup(false);
        displayPopup(`${productNameToDelete} deleted successfully!`, "success");
      } else {
        displayPopup(response.data.error || "Failed to delete product.", "error");
      }
    } catch (error) {
      displayPopup("Error deleting product. Please try again.", "error");
    }
  };

  const handleProductClick = (product) => {
    if (!product || !product.product_id || !product.product_name) {
      console.error("Invalid product data");
      return;
    }

    const adminId = sessionStorage.getItem("admin_id");

    navigate("/view-product-details", {
      state: {
        admin_id: adminId,
        category_id,
        category_name,
        sub_category_id,
        sub_category_name,
        product_id: product.product_id,
      },
    });
  };
  const uploadproductExcel = () => {
    const adminId = sessionStorage.getItem("admin_id");
    navigate("/uploadproductexcel", {
      state: { admin_id: adminId, category_id, sub_category_id },
    });
  };

  return (
    <div>

      <div className="category-div">
        <div className="category-heading">Products</div>
        <button className="upload-product-excel" onClick={uploadproductExcel}>Upload Product Excel</button>
        <div className="admin-popup">
          <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
        </div>
        {error && <p className="error-message">{error}</p>}
        {!loading && products.length === 0 && <p className="no-data">No products found.</p>}
      </div>

      <div className="category-cards product-cards">
        {products.map((product) => (
          <div key={product.product_id} className="category-card product-card">
            <img
              src={
                product.product_images ||
                (Array.isArray(product.product_image_url) ? product.product_image_url[0] : product.product_image_url) ||
                "default_image_url.jpg"
              }
              alt={product.product_name}
              className="card-image"
              onClick={() => handleProductClick(product)}
            />
            <div className="product-info-view">
              <p className="card-name">{product.product_name || "N/A"}</p>
              <p className="card-code">SKU: {product.sku_number || "N/A"}</p>
             {product.final_price === product.price ? (
                                    <>
                                        <p className="all-product-price">₹ {product.final_price} (incl. GST)</p>
                                        <div className="all-product-discount">
                                            <span className="all-product-discount-price invisible-price">₹{product.price} (incl. GST)</span>
                                            <div className="all-discount-tag">
                                                <span className="invisible-discount">--</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="all-product-price">₹ {product.final_price} (incl. GST)
                                          <div className="all-discount-tag-view">
                                                {product.product_discount ? `${product.product_discount}% off` : <span className="invisible-discount">--</span>}
                                            </div>
                                        </p>
                                        <div className="all-product-discount">
                                            <span className="all-product-discount-price-view">₹{product.price}.00(incl. GST)</span>
                                            
                                            
                                            <p className="card-gst">GST: {product.gst ? `${product.gst}%` : "N/A"}</p>

                                        </div>
                                    </>
                                )}
            </div>
            <div className="card-menu">
              <div onClick={() => handleEditProduct(product)} className="edit-label">
                <FaEdit className="edit-icon" />
                <span className="card-menu-icon-label edit-label">Edit</span>
              </div>
              <div
                onClick={() => {
                  setProductToDelete(product.product_id);
                  setProductNameToDelete(product.product_name);
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

        <div className="add-category-card" onClick={handleAddProduct}>
          <img src={AddIcon} alt="Add Product" className="add-category-image" />
        </div>
      </div>

      {showDeletePopup && (
        <div className="admin-popup-overlay popup-overlay">
          <div className="popup-content">
            <p>
              Are you sure you want to delete <strong>"{productNameToDelete}"</strong> product?
            </p>
            <div className="popup-buttons">
              <button className="popup-confirm cart-place-order" onClick={handleDeleteProduct}>
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

export default ViewProducts;
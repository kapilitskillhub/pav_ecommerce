import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AddProduct.css";
import UploadFileIcon from "../../assets/images/upload-file-icon.svg";
import SuccessIcon from "../../assets/images/succes-icon.png";
import PopupMessage from "../../components/Popup/Popup";
import { Link } from "react-router-dom";
import API_BASE_URL from "../../config";
const AddProduct = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { category_id, category_name, sub_category_id, sub_category_name } = location.state || {};
    const [formData, setFormData] = useState({
        product_name: "",
        sku_number: "",
        price: "",
        quantity: "",
        discount: "",
        description: "",
        gst:"",
        hsn_code:"",
        category_id: category_id,
        sub_category_id: sub_category_id,
        product_images: [],
        material_file: null,
    });
    const [error, setError] = useState(null);
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

 useEffect(() => {
    const adminId = sessionStorage.getItem("admin_id");

    if (!adminId) {
      displayPopup("Session expired. Please log in again.", "error");
      sessionStorage.clear();
      navigate("/admin-login");
    }
  }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;

        if (files.length === 0) return; 

        setFormData((prev) => {
            if (name === "product_images") {
                const newFiles = Array.from(files);
                return prev.product_images.length === newFiles.length &&
                    prev.product_images.every((file, i) => file.name === newFiles[i].name)
                    ? prev
                    : { ...prev, product_images: newFiles };
            } else if (name === "material_file") {
                return prev.material_file?.name === files[0].name
                    ? prev
                    : { ...prev, material_file: files[0] };
            }
            return prev;
        });

        console.log(`${name} updated. Selected ${files.length} file(s).`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const admin_id = sessionStorage.getItem("admin_id");

    if (!admin_id) {
      displayPopup(
        <>
          Admin session expired. Please <Link to="/admin-login" className="popup-link">log in</Link> again.
        </>,
        "error"
      );
      return;
    }

        const formDataToSend = new FormData();
        formDataToSend.append("admin_id", admin_id);
        Object.keys(formData).forEach((key) => {
            if (key === "product_images") {
                formData[key].forEach((file) => {
                    formDataToSend.append("product_images", file);
                });
            } else {
                formDataToSend.append(key, formData[key]);
            }
        });

        try {
            const response = await fetch(`${API_BASE_URL}/add-product`, {
                method: "POST",
                body: formDataToSend,
            });
            const data = await response.json();

            if (response.ok) {
                navigate("/view-products", { 
                    state: { 
                      sub_category_id,
                      sub_category_name, 
                      category_id: category_id,
                      category_name: category_name,
                      successMessage: "Product added successfully!"
                    } 
                  });
                  
            } else {
                setError(data.error || "Something went wrong");
                displayPopup(data.error || "Failed to add product.", "error");
            }
        } catch (error) {
            setError("Network error, please try again");
      displayPopup(error,"Something went wrong. Please try again.", "error");

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-product-container">
            <h2 className="form-title-product">Add Product</h2>
            <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit} className="add-product-form">
                <div>
                    <label className="label">Name of the Category</label>
                    <input type="text" name="category_name" value={category_name || ""} disabled className="input-field disabled" />
                </div>
                <div>
                    <label className="label">Name of the SubCategory</label>
                    <input type="text" name="sub_category_name" value={sub_category_name || ""} disabled className="input-field disabled" />
                </div>
                <div>
                    <label className="label">Product Name</label>
                    <input type="text" name="product_name" placeholder="Enter product name" onChange={handleChange} required className="input-field" />
                </div>
                <div className="input-row">
                    <div>
                        <label className="label">SKU</label>
                        <input type="text" name="sku_number" placeholder="Enter SKU number" onChange={handleChange} required className="input-field" />
                    </div>
                    <div>
                        <label className="label">HSN</label>
                        <input type="text" name="hsn_code" placeholder="Enter HSN" onChange={handleChange} required className="input-field" />
                    </div>
                    <div>
                        <label className="label">Price</label>
                        <input type="text"  name="price" placeholder="Enter price" onChange={handleChange} required className="input-field" />
                    </div>
                </div>
                <div className="input-row">
                    <div>
                        <label className="label">Quantity</label>
                        <input type="text"  name="quantity" placeholder="Enter quantity" onChange={handleChange} required className="input-field" />
                    </div>
                    <div>
                        <label className="label">Discount</label>
                        <input type="text"  name="discount" placeholder="Enter discount" onChange={handleChange} className="input-field" />
                    </div>
                    
                    <div>
                        <label className="label">GST</label>
                        <input type="text" name="gst" placeholder="Enter GST" onChange={handleChange} required className="input-field" />
                    </div>
                </div>
                <div>
                    <label className="label">Description</label>
                    <textarea name="description" placeholder="Enter description" onChange={handleChange} required className="textarea-field"></textarea>
                </div>
                <div className="upload-file">
                    <label htmlFor="product_images" className="upload-label">
                        Upload (1 or more) Product Images
                    </label>
                    <div className="upload-box">
                        {formData.product_images.length > 0 ? (
                            <div className="success-icon">
                                <img src={SuccessIcon} alt="Success Icon" className="success-icon-img" />
                                <p>{formData.product_images.length} file(s) uploaded</p>
                            </div>
                        ) : (
                            <>
                                <img src={UploadFileIcon} alt="Upload Icon" className="upload-icon" />
                                <p className="upload-text">
                                    <span>Upload File(s)</span> or Drag and Drop
                                </p>
                            </>
                        )}
                        <input
                            type="file"
                            id="product_images"
                            name="product_images"
                            className="upload-input"
                            multiple
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <div className="upload-file">
                    <label htmlFor="material_file" className="upload-label">
                        Upload Material File
                    </label>
                    <div className="upload-box">
                        {formData.material_file ? (
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
                            id="material_file"
                            name="material_file"
                            className="upload-input"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <div className="button-group">
                    <button type="button" className="admin-cancel-button" onClick={() => navigate(-1)}>Cancel</button>
                    <button type="submit" className="admin-submit-button" disabled={loading}>Submit</button>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;

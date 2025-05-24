import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ViewMoreProductDetails.css"; 
import { FaAngleLeft } from "react-icons/fa6";
import { FaAngleRight } from "react-icons/fa";
import { FaRupeeSign } from "react-icons/fa";
import API_BASE_URL from "../../config";
import PopupMessage from "../../components/Popup/Popup";

const ViewProductDetails = () => {
  const [productDetails, setProductDetails] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { admin_id, category_id, sub_category_id, product_id, category_name, sub_category_name, product_name } = location.state || {};
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [isAddingSpecifications, setIsAddingSpecifications] = useState(false);
  const [isEditingSpecifications, setIsEditingSpecifications] = useState(false);
  const [numSpecifications, setNumSpecifications] = useState(0);
  const [specifications, setSpecifications] = useState([]);
  const [editableSpecs, setEditableSpecs] = useState([]);

  const [showSpecSuccessPopup, setShowSpecSuccessPopup] = useState(false);
const [specMessage, setSpecMessage] = useState("");
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
    if (!admin_id || !category_id || !sub_category_id || !product_id) {
      setError("Missing required data to fetch product details.");
      setLoading(false);
      return;
    }

    fetchProductDetails();
  }, []);

  const fetchProductDetails = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/view-product-details`, {
        admin_id,
        category_id,
        sub_category_id,
        product_id,
      });

      if (response.data.status_code === 200) {
        setProductDetails(response.data);
        const images = response.data.product_details.product_images;
        if (images?.length > 0) {
          setMainImage(`${API_BASE_URL}/${images[0]}`);
        }
      } else {
        setError(response.data.error || "Failed to fetch product details.");
      }
    } catch (error) {
      setError("Error fetching product details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (productDetails?.product_details?.product_images) {
      setMainImageIndex((prevIndex) =>
        prevIndex === productDetails.product_details.product_images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (productDetails?.product_details?.product_images) {
      setMainImageIndex((prevIndex) =>
        prevIndex === 0 ? productDetails.product_details.product_images.length - 1 : prevIndex - 1
      );
    }
  };

  const getAvailabilityColor = (status) => {
    switch (status) {
      case "Out of Stock":
        return "red";
      case "Very Few Products Left":
        return "#ff8d00";
      case "In Stock":
        return "green";
      default:
        return "black";
    }
  };


  const handleAddSpecification = () => {
    setIsAddingSpecifications(true);
    setIsEditingSpecifications(false);
    setNumSpecifications(1);
    setSpecifications([{ name: "", value: "" }]);
  };

  const handleEditSpecification = () => {
    setIsEditingSpecifications(true);
    setIsAddingSpecifications(false);
    setEditableSpecs(
      productDetails.product_details.specifications
        ? Object.entries(productDetails.product_details.specifications).map(([name, value]) => ({ name, value }))
        : []
    );
  };

  const handleSpecificationChange = (index, field, value) => {
    const updatedSpecs = [...specifications];
    updatedSpecs[index][field] = value;
    setSpecifications(updatedSpecs);
  };

  const handleEditSpecificationChange = (index, field, value) => {
    const updatedSpecs = [...editableSpecs];
    updatedSpecs[index][field] = value;
    setEditableSpecs(updatedSpecs);
  };
  const handleSubmitSpecifications = async () => {
    if (specifications.some((spec) => !spec.name.trim() || !spec.value.trim())) {
      displayPopup("Please fill in all specifications.","error");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/add-product-specifications`, {
        admin_id,
        category_id,
        sub_category_id,
        product_id,
        number_of_specifications: specifications.length,
        specifications,
      });

      if (response.data.status_code === 200) {
        displayPopup("Specification added successfully!", "success");
        setIsAddingSpecifications(false);
        setTimeout(() => {
        fetchProductDetails();
      }, 100);

      }
       else {
        displayPopup(response.data.error,"error");
      }
    } catch (error) {
      displayPopup("Failed to add specifications.","error");
    }
  };
  const handleSubmitEditedSpecifications = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/edit-product-specifications`, {
        admin_id,
        category_id,
        sub_category_id,
        product_id,
        number_of_specifications: editableSpecs.length,
        specifications: editableSpecs,
      });

      if (response.data.status_code === 200) {
        fetchProductDetails();
        setIsEditingSpecifications(false);
        displayPopup("Specification updated successfully!", "success");
      }
       else {
        displayPopup(response.data.error || "Failed to update specifications.","error");
      }
    } catch (error) {
      displayPopup("Error updating specifications.","error");
    }
  };

  return (
    <div className="container">


      {loading && <p className="loading">Loading product details...</p>}
      {error && <p className="error">{error}</p>}
      <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>
              
      {productDetails?.product_details && (
        <div className="product-details">
          <div className="product-info-top-section">
            <div className="image-section">

              <div className="image-gallery">
                <div className="arrows-div">
                  {productDetails.product_details.product_images?.length > 1 && (
                    <button className="parrow left-arrow" onClick={prevImage}>
                      <FaAngleLeft />
                    </button>
                  )}

                  {productDetails.product_details.product_images?.length > 0 ? (
                    <img
                      src={productDetails.product_details.product_images[mainImageIndex]}
                      alt="Main Product"
                      className="main-product-img"
                    />
                  ) : (
                    <p>No images available.</p>
                  )}

                  {productDetails.product_details.product_images?.length > 1 && (
                    <button className="parrow right-arrow" onClick={nextImage}>
                      <FaAngleRight />
                    </button>
                  )}

                </div>

                <div className="thumbnail-gallery">
                  {productDetails.product_details.product_images?.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Product ${index + 1}`}
                      className={`thumbnail-img ${mainImageIndex === index ? "active-thumbnail" : ""}`}
                      onClick={() => setMainImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>

              <div className="view-product-info">
                <p className="view-product-header"> {category_name} / {sub_category_name} / <span>{product_name}</span></p>

                <p className="view-product-name">{productDetails.product_details.product_name || "N/A"}</p>
                <p className="view-product-price"> <FaRupeeSign /> {productDetails.product_details.final_price || "N/A"}(include GST)</p>
                 
{productDetails.product_details.price !== productDetails.product_details.final_price && (
  <p className="customer-original-price">
    ₹ {productDetails.product_details.price}
    <span>(Incl. GST)</span>
  
  </p>
)}


                <p className="view-product-discount"> <strong> Discount:</strong> {productDetails.product_details.discount || "N/A"}</p>
                <p className="view-product-discount"> <strong> GST:</strong> {productDetails.product_details.gst || "N/A"}</p>

                <p className="view-product-availablity" style={{
                  color: getAvailabilityColor(productDetails.product_details.availability),
                  fontWeight: "bold",
                }}>{productDetails.product_details.availability || "N/A"}</p>
                <p className="view-product-quantity"><strong>Quantity : </strong> {productDetails.product_details.quantity || "N/A"}</p>
              </div>
              <div className="view-product-codes">

                <p className="view-product-sku"><strong>SKU : </strong> {productDetails.product_details.sku_number || "N/A"}</p>
                <p className="view-product-hsn"><strong>HSN: </strong> {productDetails.product_details.hsn_code || "N/A"}</p> 
              </div>
            </div>
          </div>

          <div className="product-info-bottom-section">
            <div className="tabs">
              <button className={activeTab === "description" ? "button-tab-active" : "button-tab"} onClick={() => setActiveTab("description")}>Description</button>
              <button className={activeTab === "specifications" ? "button-tab-active" : "button-tab"} onClick={() => setActiveTab("specifications")}>Specifications</button>
              <button className={activeTab === "material" ? "button-tab-active" : "button-tab"} onClick={() => setActiveTab("material")}>Material</button>
            </div>

            <div className="tab-content">
              {activeTab === "description" && (
                <p className="description-tab"> {productDetails.product_details.description || "No Description"}</p>
              )}

              {activeTab === "specifications" && (
                <div className="specification-container">
           {!isAddingSpecifications && !isEditingSpecifications ? (
                    <div>
                      {productDetails.product_details.specifications ? (
                        <table className="specifications-table">
                          <thead>
                            <tr>
                              <th>Specification</th>
                              <th>Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(productDetails.product_details.specifications).map(([key, value]) => (
                              <tr key={key}>
                                <td>{key}</td>
                                <td>{value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>No specifications available.</p>
                      )}
                      <div className="specification-actions">
                        <button className="add-specification-btn" onClick={handleAddSpecification}>
                          Add Specification
                        </button>
                        {productDetails.product_details.specifications && (
                          <button className="edit-specification-btn" onClick={handleEditSpecification}>
                            Edit Specifications
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}
                  {isAddingSpecifications && (
                    <div className="add-specifications">
                      <div className="add-specifications-header">Add Specifications</div>
                      {productDetails.product_details.specifications && (
                        <div className="existing-specifications">
                          <p className="existing-specifications-title">Existing Specifications</p>
                          <table className="specifications-table">
                            <thead>
                              <tr>
                                <th>Specification</th>
                                <th>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(productDetails.product_details.specifications).map(([key, value]) => (
                                <tr key={key}>
                                  <td>{key}</td>
                                  <td>{value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <div className="specification-counter">
                        <div>No. of Specifications :
                          <button
                            className="btn-count"
                            onClick={() => {
                              if (numSpecifications > 1) {
                                setNumSpecifications((prev) => prev - 1);
                                setSpecifications((prevSpecs) => prevSpecs.slice(0, -1));
                              }
                            }}
                            disabled={numSpecifications === 1}
                          >
                            -
                          </button>

                          <span className="btn-count-num" >{numSpecifications}</span>

                          <button
                            className="btn-count"
                            onClick={() => {
                              setNumSpecifications((prev) => prev + 1);
                              setSpecifications((prevSpecs) => [...prevSpecs, { name: "", value: "" }]);
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {specifications.map((spec, index) => (
                        <div key={index} className="specification-input">
                          <input
                            type="text"
                            className="specification-input-placeholder"
                            placeholder={`Specification ${index + 1} Name`}
                            value={spec.name}
                            onChange={(e) => handleSpecificationChange(index, "name", e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            className="specification-input-placeholder"
                            value={spec.value}
                            onChange={(e) => handleSpecificationChange(index, "value", e.target.value)}
                          />
                        </div>
                      ))}

                      <div className="specification-buttons">
                        <button className="add-cancel-btn" onClick={() => setIsAddingSpecifications(false)}>Cancel</button>
                        <button className="add-submit-btn" onClick={handleSubmitSpecifications}>Add</button>
                      </div>
                    </div>
                  )}
                  {isEditingSpecifications && (
                    <div className="edit-specifications">
                      <div className="edit-specifications-header">Edit Specifications</div>
                      {editableSpecs.map((spec, index) => (
                        <div key={index} className="specification-input">
                          <input type="text" value={spec.name} readOnly />
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => handleEditSpecificationChange(index, "value", e.target.value)}
                          />
                        </div>
                      ))}

                      <div className="specification-buttons">
                        <button className="edit-cancel-btn" onClick={() => setIsEditingSpecifications(false)}>Cancel</button>
                        <button className="edit-submit-btn" onClick={handleSubmitEditedSpecifications}>Update</button>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {activeTab === "material" && (
                <div>

                  {productDetails.product_details.material_file ? (
                    <button className="button-material">

                      <a href={productDetails.product_details.material_file} target="_blank" rel="noopener noreferrer">
                        View Material
                      </a>
                    </button>
                  ) : (
                    <p>No material file available.</p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      )}
  

    </div>
  );
};

export default ViewProductDetails;

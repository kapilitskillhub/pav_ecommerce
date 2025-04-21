import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai"; // Import React Icons
import defaultImage from "../../../assets/images/default.png";
import "./CustomerViewProductDetails.css";
import { MdCloudDownload } from "react-icons/md";
import { RiCustomerService2Line } from "react-icons/ri";
import { TbTruckDelivery } from "react-icons/tb";
import { PiShieldCheckBold } from "react-icons/pi";
import { FaRupeeSign } from "react-icons/fa";
import PopupMessage from "../../../components/Popup/Popup";
import { Link } from "react-router-dom";

const CustomerViewProductDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const category_name = location.state?.category_name || localStorage.getItem("category_name");
    const sub_category_name = location.state?.sub_category_name || localStorage.getItem("sub_category_name");
    const product_name = location.state?.product_name || localStorage.getItem("product_name") || "";
    const [productDetails, setProductDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState("description");

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
        console.log("category_name:", category_name);
        console.log("sub_category_name:", sub_category_name);
        console.log("productName:", product_name);
        if (!category_name || !sub_category_name || !product_name) {
            setError("Category name, subcategory name, or product name is missing.");
            setLoading(false);
            return;
        }
        fetchProductDetails();
    }, [category_name, sub_category_name, product_name]);


    const fetchProductDetails = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`http://127.0.0.1:8000/products/${product_name}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    category_name,
                    sub_category_name,
                    product_name, // Ensure product_name is included
                }),
            });

            const data = await response.json();

            if (data.status_code === 200) {
                setProductDetails(data.product_details);
            } else {
                setError(data.error || "Failed to fetch product details.");
            }
        } catch (error) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    // Change image on arrow click
    const handlePrevImage = () => {
        setActiveImageIndex((prevIndex) =>
            prevIndex === 0 ? productDetails.product_images.length - 1 : prevIndex - 1
        );
    };

    const handleNextImage = () => {
        setActiveImageIndex((prevIndex) =>
            prevIndex === productDetails.product_images.length - 1 ? 0 : prevIndex + 1
        );
    };
    const handleAddCart = async (product_id) => {
        // const customer_id = sessionStorage.getItem("customer_id");
        const customer_id = localStorage.getItem("customer_id");


        if (!customer_id) {
            displayPopup(
                <>
                    Please <Link to="/customer-login" className="popup-link">log in</Link> to add products to cart.
                </>,
                "error"
            );
            navigate("/customer-login");
            return;
        }

        if (!product_id) {
            displayPopup("Invalid product. Please try again.", "error");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/add-cart-product", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id: customer_id,
                    product_id: product_id,
                    quantity: 1,
                }),
            });

            const data = await response.json();

            if (data.status_code === 200) {
                const totalprice = data.price - data.discount;
                displayPopup("Product added to cart successfully!", "success");
                window.dispatchEvent(new Event("cartUpdated"));
            } else {
                displayPopup(data.error || "Failed to add product to cart.", "error");
            }
        } catch (error) {
            displayPopup("An unexpected error occurred while adding to cart.", error, "error");
        }
    };

    const handleBuyNow = async (product_id) => {
        // const customer_id = sessionStorage.getItem("customer_id");
        const customer_id = localStorage.getItem("customer_id");


        if (!customer_id) {
            displayPopup(
                <>
                    Please <Link to="/customer-login" className="popup-link">log in</Link> to purchase  products .
                </>,
                "error"
            );
            navigate("/customer-login");
            return;
        }

        if (!product_id) {
            displayPopup("Invalid product id.", "error");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/products/order-multiple-products", { // Updated API endpoint
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id: customer_id,
                    products: [{ product_id: product_id, quantity: 1 }], // Updated request format
                }),
            });

            const data = await response.json();

            if (data.status_code === 201) {
                localStorage.setItem("product_id", product_id);
                localStorage.setItem("order_id", data.orders[0]?.order_id);

                navigate("/checkout-page", { state: { orderDetails: data } });
            } else {
                displayPopup("Failed to place order.", data.error,"error");
                // alert(data.error || "Failed to place order.");
            }
        } catch (error) {
            displayPopup("An unexpected error occurred while placing the order.", error,"error");
            // alert("An unexpected error occurred while placing the order.");
        }
    };

    const handleDownloadMaterialFile = async (productId) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/download-material/${productId}/`);
    
            if (!response.ok) {
                throw new Error("Failed to download file.");
            }
    
            // Get blob data
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
    
            // Create a temporary <a> element for download
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `material_${productId}.pdf`); // Customize file name
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
    
        } catch (error) {
            console.error("Download error:", error);
            displayPopup("Failed to download the material file.","error");
            // alert("Failed to download the material file.");
        }
    };
    


    return (
        <div className="customer-view-details-container container">
            {loading && <p className="loading">Loading...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && productDetails && (
                <div className="customer-view-details">
                   <div className="customer-view-header">{category_name} / {sub_category_name}/{productDetails.product_name}</div>
                  
                   <div className="popup-discount">
                   {showPopup && (
                        <PopupMessage
                            message={popupMessage.text}  
                            type={popupMessage.type}
                            onClose={() => setShowPopup(false)}
                        />
                    )}
                    </div>
                    <div className="customer-view-section">
                        <div className="customer-image-section">
                            {/* Image Carousel with React Icons */}
                            <div className="customer-view-image-container">
                                <button className=" image-arrow left-arrow" onClick={handlePrevImage}>
                                    <AiOutlineLeft />
                                </button>
                                <img
                                    src={productDetails.product_images?.[activeImageIndex]
                                        ? `http://127.0.0.1:8000/${productDetails.product_images[activeImageIndex]}`
                                        : defaultImage}
                                    alt="Product"
                                    className="customer-main-image"
                                    onError={(e) => (e.target.src = defaultImage)}
                                />
                                <button className=" image-arrow right-arrow" onClick={handleNextImage}>
                                    <AiOutlineRight />
                                </button>
                            </div>

                            {/* Thumbnail Images */}
                            <div className="customer-thumbnail-container">
                                {productDetails.product_images?.map((image, index) => (
                                    <img
                                        key={index}
                                        src={`http://127.0.0.1:8000/${image}`}
                                        alt="Product Thumbnail"
                                        className={`customer-thumbnail ${index === activeImageIndex ? "active" : ""}`}
                                        onClick={() => setActiveImageIndex(index)}
                                        onError={(e) => (e.target.src = defaultImage)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="customer-view-info">
                            <p className="customer-view-title">{productDetails.product_name}</p>
                            <p className="customer-availability">
                                Availability : 
                                <span
                                    className={`availability ${productDetails.quantity === 0
                                        ? "out-of-stock"
                                        : productDetails.quantity <= 5
                                            ? "few-left"
                                            : "in-stock"
                                        }`}
                                >
                                    {productDetails.quantity === 0
                                        ? " Out of Stock "
                                        : productDetails.quantity <= 5
                                            ? " Very Few Products Left "
                                            : " In Stock "}
                                </span>
                            </p>
                            <p className="customer-sku">SKU: {productDetails.sku_number}</p>
                            <p className="customer-price">₹ {productDetails.final_price}.00 <span>(Incl. GST)</span></p>
                            <p className="customer-original-price">₹ {productDetails.price}.00 <span>(Incl. GST)</span></p>
                        

                            {productDetails.quantity > 0 && (
                                <div className="customer-wishlist-buttons">
                                    <button className="customer-wishlist-button"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevents navigation when clicking on the cart icon
                                            handleAddCart(productDetails.product_id);
                                        }}
                                    >Add to Cart</button>

                                    <button className="customer-wishlist-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBuyNow(productDetails.product_id);
                                        }}
                                    >Buy Now</button>
                                </div>
                            )}
                            <div className="customer-options">
                               <div className="customer-options-icons"> 
                                <div>< RiCustomerService2Line /> </div>
                                <div className="customer-icon-text">customer support</div>
                                </div>
                                <div className="customer-options-icons">
                                    <div><TbTruckDelivery/></div>
                                    <div className="customer-icon-text">Free Delivery</div>
                                    </div>
                                <div className="customer-options-icons">
                                    <div>< PiShieldCheckBold/></div>
                                    <div className="customer-icon-text">6 months warranty</div>
                                    </div>
                                <div className="customer-options-icons">
                                    <div><FaRupeeSign/></div>
                                    <div className="customer-icon-text">online payment</div>
</div>
                                </div>


                        </div>
                    </div>


                    <div className="customer-view-tabs-container">
                        {/* Tabs Navigation */}
                        <div className="customer-tabs">
                            <button
                                className={activeTab === "description" ? "active" : ""}
                                onClick={() => setActiveTab("description")}
                            >
                                Description
                            </button>
                            <button
                                className={activeTab === "specification" ? "active" : ""}
                                onClick={() => setActiveTab("specification")}
                            >
                                Specification
                            </button>
                            <button
                                className={activeTab === "material" ? "active" : ""}
                                onClick={() => setActiveTab("material")}
                            >
                                Material
                            </button>


                        </div>

                        {/* Tab Content */}
                        <div className="customer-tab-content">
                            {activeTab === "description" && <p className="product-description">{productDetails.description}</p>}
                            {activeTab === "specification" && (productDetails.specifications ? (
                                <table className="customer-specification-table">
                                    <tbody>
                                        {Object.entries(productDetails.specifications).map(([key, value]) => (
                                            <tr key={key}>
                                                <th>{key}</th>
                                                <td>{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No specifications available.</p>
                            ))}


                            {activeTab === "material" && (<div className="customer-material-section">
                                <div>
                                    <a className="customer-material-file" href={`http://127.0.0.1:8000/${productDetails.material_file}`} target="_blank" rel="noopener noreferrer">
                                        View Material File
                                    </a>
                                </div>
                                <div onClick={() => handleDownloadMaterialFile(productDetails.product_id)} className="customer-material-download">
                                    <MdCloudDownload />
                                </div>
                            </div>
                            )}


                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerViewProductDetails;

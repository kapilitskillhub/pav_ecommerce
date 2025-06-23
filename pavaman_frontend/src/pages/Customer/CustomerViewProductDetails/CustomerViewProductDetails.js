import { useEffect, useState } from "react";
import { useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import defaultImage from "../../../assets/images/product.png";
import { MdZoomIn, MdClose } from "react-icons/md";
import "./CustomerViewProductDetails.css";
import { MdCloudDownload } from "react-icons/md";
import PopupMessage from "../../../components/Popup/Popup";
import { Link } from "react-router-dom";
import { PiShareFatFill } from "react-icons/pi";
import API_BASE_URL from "../../../config";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

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
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const zoomImageRef = useRef(null);
    const [zoomStyle, setZoomStyle] = useState({});
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);


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
            const response = await fetch(`${API_BASE_URL}/products/${product_name}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    category_name,
                    sub_category_name,
                    product_name,
                    customer_id: localStorage.getItem("customer_id")
                }),
            });

            const data = await response.json();

            if (data.status_code === 200) {
                const fullDetails = {
                    ...data.product_details,
                    category_name: data.category_name,
                    sub_category_name: data.sub_category_name,
                };
                setProductDetails(fullDetails);

                setIsWishlisted(data.product_details.is_in_wishlist || false);


            } else {
                setError(data.error || "Failed to fetch product details.");
            }
        } catch (error) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };
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

    const handleZoomOpen = () => {
        setIsZoomOpen(true);
    };

    const handleZoomClose = () => {
        setIsZoomOpen(false);
    };


    const handleAddCart = async (product_id) => {
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
            const response = await fetch(`${API_BASE_URL}/add-cart-product`, {
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
        const customer_id = localStorage.getItem("customer_id");
        if (!customer_id) {
            displayPopup(
                <>
                    Please <Link to="/customer-login" className="popup-link">log in</Link> to purchase  products .
                </>,
                "error"
            );
            return;
        }

        if (!product_id) {
            displayPopup("Invalid product id.", "error");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/order-multiple-products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id: customer_id,
                    from_cart: false,

                    products: [{ product_id: product_id, quantity: 1 }],
                }),
            });

            const data = await response.json();

            if (data.status_code === 201) {
                localStorage.setItem("order_ids", JSON.stringify([data.orders[0]?.order_id]));
                localStorage.setItem("product_ids", JSON.stringify([product_id]));
                navigate("/checkout-page", { state: { orderDetails: data } });
            } else {
                displayPopup("Failed to place order.", data.error, "error");
            }
        } catch (error) {
            displayPopup("An unexpected error occurred while placing the order.", error, "error");
        }
    };

    const handleDownloadMaterialFile = async (productId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/download-material/${productId}/`);

            if (!response.ok) {
                throw new Error("Failed to download file.");
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `material_${productId}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Download error:", error);
            displayPopup("Failed to download the material file.", "error");
        }
    };



    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;

        if (zoomImageRef.current) {
            zoomImageRef.current.style.transformOrigin = `${x}% ${y}%`;
            zoomImageRef.current.style.transform = "scale(2)";
        }
    };

    const handleMouseLeave = () => {
        if (zoomImageRef.current) {
            zoomImageRef.current.style.transform = "scale(1)";
        }
    };

    const handleShare = (product) => {
        const shareUrl = `${API_BASE_URL}/share-preview/${product.product_id}`;

        if (navigator.share) {
            navigator.share({
                title: product.product_name,
                text: `Check out this product: ${product.product_name}`,
                url: shareUrl,
            }).catch(() => {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    displayPopup("Link copied to clipboard!", "success");

                });
            });
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                displayPopup("Link copied to clipboard!", "success");

            });
        }
    };

    const toggleWishlist = async () => {
        const customer_id = localStorage.getItem("customer_id");
        if (!customer_id) {
            displayPopup(
                <>
                    Please <Link to="/customer-login" className="popup-link">log in</Link> to manage wishlist.
                </>,
                "error"
            );
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/add-to-wishlist`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id,
                    product_id: productDetails.product_id,
                }),
            });

            const data = await response.json();

            if (data.status_code === 200) {
                setIsWishlisted((prev) => !prev);
                displayPopup(data.message || "Wishlist updated!", "success");
            } else {
                displayPopup(data.error || "Failed to update wishlist.", "error");
            }
        } catch (error) {
            displayPopup("Something went wrong while updating wishlist.", "error");
        }
    };


    return (
        <div className="customer-view-details-container container">
            {loading && <p className="loading">Loading...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && productDetails && (
                <div className="customer-view-details">
                    <div className="breadcrumb">
                        <span className="breadcrumb-link" onClick={() => navigate("/")}>Home</span>
                        <span className="breadcrumb-separator"> › </span>
                        <span className="breadcrumb-link" onClick={() => navigate("/")}>{category_name}</span>
                        <span className="breadcrumb-separator"> › </span>
                        <span className="breadcrumb-link" onClick={() => navigate("/categories/view-sub-categories/", { state: { category_name } })}>{sub_category_name}</span>
                        <span className="breadcrumb-separator"> › </span>
                        <span className="breadcrumb-link" onClick={() => navigate(`/categories/${encodeURIComponent(category_name)}/${encodeURIComponent(sub_category_name)}`, { state: { sub_category_name } })}>{product_name}</span>
                    </div>

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
                            <div className="customer-view-image-container">
                                <button className="image-arrow left-arrow" onClick={handlePrevImage}>
                                    <AiOutlineLeft />
                                </button>
                                <div
                                    className="customer-main-image-zoom-container"
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <img
                                        src={productDetails.product_images?.[activeImageIndex] || defaultImage}
                                        alt="Product"
                                        className=" customer-main-image customer-main-image-zoom"
                                        ref={zoomImageRef}
                                    />
                                </div>

                                <button className="image-arrow right-arrow" onClick={handleNextImage}>
                                    <AiOutlineRight />
                                </button>
                                <button className="zoom-icon" onClick={handleZoomOpen}>
                                    <MdZoomIn />
                                </button>
                            </div>

                            <div className="customer-thumbnail-container">
                                {productDetails.product_images?.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image || defaultImage}
                                        alt="Thumbnail"
                                        className={`customer-thumbnail ${index === activeImageIndex ? "active" : ""}`}
                                        onClick={() => setActiveImageIndex(index)}
                                        onError={(e) => (e.target.src = defaultImage)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="customer-view-info">
                            <div className="title-share-div">
                                <div className="customer-view-title">{productDetails.product_name}</div>
                                <div
                                    className="wishlist-icon product-wishlist-icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleWishlist();
                                    }}
                                >
                                    {isWishlisted ? (
                                        <AiFillHeart className="wishlist-heart filled" />
                                    ) : (
                                        <AiOutlineHeart className="wishlist-heart" />
                                    )}
                                </div>
                                <div>
                                    <PiShareFatFill className="customer-share-button" onClick={() => handleShare(productDetails)} />
                                    <span>Share</span>
                                </div>
                            </div>
                            <p className="customer-price">₹ {productDetails.final_price.toFixed(2)} <span>(Incl. GST)</span></p>

                            {productDetails.price !== productDetails.final_price && (
                                <p className="customer-original-price">
                                    ₹ {productDetails.price.toFixed(2)} <span>(Incl. GST)</span>
                                    <span className="discount-tag-product-details">
                                        {productDetails.discount && parseFloat(productDetails.discount) > 0 && `${productDetails.discount} off`}
                                    </span>
                                </p>
                            )}
                            <p className="customer-availability">
                                Availability :
                                <span className={`availability ${productDetails.availability === "Out of Stock" ? "out-of-stock" : productDetails.availability === "Very Few Products Left" ? "few-left" : "in-stock"}`}>
                                    {productDetails.availability}
                                </span>
                            </p>

                            <p className="customer-sku">SKU: {productDetails.sku_number}</p>



                            {(productDetails.availability === "Very Few Products Left" || productDetails.availability === "In Stock") && (
                                <div className="customer-wishlist-buttons">
                                    <button className="customer-wishlist-button" onClick={(e) => { e.stopPropagation(); handleAddCart(productDetails.product_id); }}>
                                        Add to Cart
                                    </button>
                                    <button className="customer-wishlist-button" onClick={(e) => { e.stopPropagation(); handleBuyNow(productDetails.product_id); }}>
                                        Buy Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {isZoomOpen && (
                        <div className="zoom-modal-overlay" onClick={handleZoomClose}>
                            <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
                                <button className="zoom-close-btn" onClick={handleZoomClose}><MdClose /></button>
                                <div className="zoom-main-image-wrapper">
                                    <img
                                        src={productDetails.product_images?.[activeImageIndex] || defaultImage}
                                        alt="Zoomed"
                                        className="zoom-main-image"
                                    />
                                </div>
                                <div className="zoom-thumbnails">
                                    {productDetails.product_images?.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image || defaultImage}
                                            alt="Zoom Thumb"
                                            className={`zoom-thumbnail ${index === activeImageIndex ? "active" : ""}`}
                                            onClick={() => setActiveImageIndex(index)}
                                            onError={(e) => (e.target.src = defaultImage)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="customer-view-tabs-container">
                        <div className="customer-tabs">
                            <button className={activeTab === "description" ? "active" : ""} onClick={() => setActiveTab("description")}>Description</button>
                            <button className={activeTab === "specification" ? "active" : ""} onClick={() => setActiveTab("specification")}>Specification</button>
                            <button className={activeTab === "material" ? "active" : ""} onClick={() => setActiveTab("material")}>Material</button>
                        </div>

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

                            {activeTab === "material" && (
                                <div className="customer-material-section">
                                    <div>
                                        <a className="customer-material-file" href={productDetails.material_file} target="_blank" rel="noopener noreferrer">
                                            View Material File
                                        </a>
                                    </div>
                                    <div onClick={() => handleDownloadMaterialFile(productDetails.product_id)} className="customer-material-download">
                                        <button className="download-btn">Download<MdCloudDownload /></button>
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


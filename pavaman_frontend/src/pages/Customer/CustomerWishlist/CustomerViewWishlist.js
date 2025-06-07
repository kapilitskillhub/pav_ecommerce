import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../../config";
import PopupMessage from "../../../components/Popup/Popup";
import "./CustomerViewWishlist.css";
import { BiSolidCartAdd } from "react-icons/bi";
import { useNavigate, Link } from "react-router-dom";

const ViewWishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);
    const [wishlistCount, setWishlistCount] = useState(0);
    const navigate = useNavigate();
    const customerId = localStorage.getItem("customer_id");

    const displayPopup = (text, type = "success") => {
        setPopupMessage({ text, type });
        setShowPopup(true);

        setTimeout(() => {
            setShowPopup(false);
        }, 10000);
    };

    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const response = await axios.post(`${API_BASE_URL}/view-wishlist`, {
                    customer_id: customerId,
                });

                if (response.data.status === "success") {
                    setWishlist(response.data.data);
                    setWishlistCount(response.data.data.length);
                } else {
                    displayPopup("Failed to fetch wishlist.", "error");
                }
            } catch (error) {
                displayPopup("Failed to fetch wishlist.", "error");
            } finally {
                setLoading(false);
            }
        };

        if (customerId) {
            fetchWishlist();
        } else {
            displayPopup(
                <>
                    Please <Link to="/customer-login" className="popup-link">log in</Link> to view your wishlist.
                </>,
                "error"
            );
            navigate("/customer-login");
            setLoading(false);
        }
    }, [customerId]);

    const handleAddCart = async (productId) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/add-to-cart`, {
                customer_id: customerId,
                product_id: productId,
            });
            if (response.data.status === "success") {
                displayPopup("Product added to cart!");
            } else {
                displayPopup("Failed to add product to cart.", "error");
            }
        } catch (error) {
            displayPopup("Error adding to cart.", "error");
        }
    };

    const handleViewProductDetails = (product) => {
        navigate(`/product-details/${product.product_id}`);
    };

    if (loading) return <div>Loading wishlist...</div>;

    return (
        <div>
            <div className="wishlist-header">
                <span className="wishlist-heading">My Wishlist</span>
                <span className="wishlist-count">({wishlistCount} items)</span>
            </div>
            <div className="wishlist-container container">
                {showPopup && (
                    <div className="popup-discount">
                        <PopupMessage
                            message={popupMessage.text}
                            type={popupMessage.type}
                            onClose={() => setShowPopup(false)}
                        />
                    </div>
                )}

                <div className="customer-products-section">
                    {wishlist.length > 0 ? (
                        wishlist.map((product) => (
                            <div
                                key={product.product_id}
                                className="customer-product-card"
                                onClick={() => handleViewProductDetails(product)}
                            >
                                <img
                                    src={product.product_image}
                                    alt={product.product_name}
                                    className="customer-product-image"
                                />
                                <div className="customer-product-name">{product.product_name}</div>
                                <div className="customer-discount-section-price">
                                    ₹{product.final_price}.00 (incl. GST)
                                </div>
                                <div>
                                    <div className="customer-discount-section-original-price">
                                        {product.price !== product.final_price ? (
                                            <>
                                                ₹{product.price}.00 (incl. GST)
                                                <div className="discount-tag">
                                                    {product.discount && parseFloat(product.discount) > 0
                                                        ? `${product.discount} off`
                                                        : ''}
                                                </div>
                                            </>
                                        ) : (
                                            <>&nbsp;</>
                                        )}
                                    </div>
                                    <div className="add-cart-section">
                                        <span
                                            className={`availability ${product.availability === "Out of Stock"
                                                ? "out-of-stock"
                                                : product.availability === "Very Few Products Left"
                                                    ? "few-left"
                                                    : "in-stock"
                                                }`}
                                        >
                                            {product.availability}
                                        </span>

                                        {(product.availability === "Very Few Products Left" ||
                                            product.availability === "In Stock") && (
                                            <BiSolidCartAdd
                                                className="add-to-cart-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddCart(product.product_id);
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div>No products in your wishlist.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewWishlist;

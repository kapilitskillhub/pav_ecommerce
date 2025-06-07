import React, { useEffect, useState } from "react";
import axios from "axios";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BiSolidCartAdd } from "react-icons/bi";
import API_BASE_URL from "../../../config";
import CarouselLanding from "../CustomerCarousel/CustomerCarousel";
import { useNavigate } from "react-router-dom";
import PopupMessage from "../../../components/Popup/Popup";
import { Link } from "react-router-dom";

const LatestProducts = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [wishlist, setWishlist] = useState([]);
    const navigate = useNavigate();
    const customer_id = localStorage.getItem("customer_id");
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        if (customer_id) {
            fetchTrendingProducts();
        }
    }, [customer_id]);

    
    const displayPopup = (text, type = "success") => {
        setPopupMessage({ text, type });
        setShowPopup(true);

        setTimeout(() => {
            setShowPopup(false);
        }, 10000);
    };


    const fetchTrendingProducts = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await axios.post(
                `${API_BASE_URL}/latest-products`,
                { customer_id: customer_id }
            );

            if (response.data.status === "success") {
                setProducts(response.data.data);
                setWishlist(response.data.wishlist || []);
            } else {
                setError(response.data.message || "Failed to fetch products");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setError("An error occurred while fetching products.");
        } finally {
            setLoading(false);
        }
    };

    const toggleWishlist = async (productId) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/toggle-wishlist`, {
                customer_id: customer_id,
                product_id: productId,
            });

            if (response.data.status === "success") {
                const updated = wishlist.includes(productId)
                    ? wishlist.filter((id) => id !== productId)
                    : [...wishlist, productId];
                setWishlist(updated);
            }
        } catch (err) {
            console.error("Wishlist toggle failed", err);
        }
    };

  const handleAddCart = async (productId) => {
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

        try {
            const response = await fetch(`${API_BASE_URL}/add-cart-product`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    customer_id :  customer_id, 
                    product_id : productId, 
                    quantity: 1 }),
            });

            const data = await response.json();

            if (data.status_code === 200) {
                displayPopup("Product added to cart successfully!", "success");
                window.dispatchEvent(new Event("cartUpdated"));
            } else {
                displayPopup(data.error || "Failed to add product to cart.", "error");
            }
        } catch (error) {
            displayPopup("An unexpected error occurred while adding to cart.", "error");
        }
    };

      const handleViewProductDetails = (product) => {
  if (!product.category_id || !product.sub_category_id) {
    console.error("Missing category_id or sub_category_id");
    return;
  }

  localStorage.setItem("category_id", product.category_id);
  localStorage.setItem("sub_category_id", product.sub_category_id);
  localStorage.setItem("category_name", product.category);
  localStorage.setItem("sub_category_name", product.sub_category);
  localStorage.setItem("product_name", product.product_name);

  navigate(`/product-details/${product.category}/${product.sub_category}/${product.product_id}`, {
    state: {
      category_name: product.category,
      sub_category_name: product.sub_category,
      product_name: product.product_name,
    },
  });
};
    return (
        <div className="trending-container container customer-products">
            <CarouselLanding />
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && (
                <>
                    <div className="breadcrumb">
                        <span className="breadcrumb-link" onClick={() => navigate("/")}>Home</span>
                        <span className="breadcrumb-separator"> › </span>
                        <span  className="breadcrumb-link" onClick={() => navigate("/latest-products")}>Latest Products</span>
                    </div>

                    <div className="customer-products-heading">Latest Products</div>
                      <div className="popup-discount">
                        {showPopup && (
                            <PopupMessage
                                message={popupMessage.text}
                                type={popupMessage.type}
                                onClose={() => setShowPopup(false)}
                            />
                        )}
                    </div>
                    <div className="customer-products-section">
                        {products.map((product) => (
                            <div
                                key={product.product_id}
                                className="customer-product-card"
                                onClick={() => handleViewProductDetails(product)}
                            >
                                <div
                                    className="wishlist-icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleWishlist(product.product_id);
                                    }}
                                >
                                    {wishlist.includes(product.product_id) ? (
                                        <AiFillHeart className="wishlist-heart filled" />
                                    ) : (
                                        <AiOutlineHeart className="wishlist-heart" />
                                    )}
                                </div>

                                <img
                                    src={
                                        product.product_images ||
                                        (Array.isArray(product.product_image_url)
                                            ? product.product_image_url[0]
                                            : product.product_image_url || product.product_image)
                                    }
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
                                            className={`availability ${
                                                product.availability === "Out of Stock"
                                                    ? "out-of-stock"
                                                    : product.availability === "Very Few Products Left"
                                                    ? "few-left"
                                                    : "in-stock"
                                            }`}
                                        >
                                            {product.availability === "Out of Stock"
                                                ? "Out of Stock"
                                                : product.availability === "Very Few Products Left"
                                                ? "Very Few Products Left"
                                                : "In Stock"}
                                        </span>

                                        {(product.availability === "In Stock" ||
                                            product.availability === "Very Few Products Left") && (
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
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default LatestProducts;

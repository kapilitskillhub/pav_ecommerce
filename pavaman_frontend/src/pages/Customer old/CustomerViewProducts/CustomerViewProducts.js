import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import defaultImage from "../../../assets/images/default.png";
import { BiSolidCartAdd } from "react-icons/bi";
import PopupMessage from "../../../components/Popup/Popup";
import { Link } from "react-router-dom";
import { Range } from 'react-range';

const CustomerViewProducts = () => {
    const { categoryName, subCategoryName } = useParams();
    const [allProducts, setAllProducts] = useState([]); // Store original data
    const [products, setProducts] = useState([]); // Display filtered/sorted products
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sortOrder, setSortOrder] = useState(""); // Sorting state
    const navigate = useNavigate();
    const location = useLocation();



    const category_id = location.state?.category_id || localStorage.getItem("category_id");
    const sub_category_id = location.state?.sub_category_id || localStorage.getItem("sub_category_id");
    const customer_id = localStorage.getItem("customer_id") || null;

    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(10000);
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);

    const [values, setValues] = useState([0, 10000]); // For slider component

    const displayPopup = (text, type = "success") => {
        setPopupMessage({ text, type });
        setShowPopup(true);

        setTimeout(() => {
            setShowPopup(false);
        }, 10000);
    };

    // useEffect(() => {
    //     setMinPrice(values[0]);
    //     setMaxPrice(values[1]);
    // }, [values]);


    useEffect(() => {
        fetchProducts();
    }, [sortOrder]); // Refetch products when sorting order changes

    const fetchProducts = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("http://127.0.0.1:8000/sort-products-inside-subcategory", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sub_category_id,
                    sub_category_name: subCategoryName,
                    sort_by: sortOrder || "latest",
                    customer_id,
                }),
            });

            const data = await response.json();

            if (data.status_code === 200) {
                setAllProducts(data.products);
                setProducts(data.products);

                // Set price range from API
                const minFromAPI = data.product_min_price || 0;
                const maxFromAPI = data.product_max_price || 10000;

                setMinPrice(minFromAPI);
                setMaxPrice(maxFromAPI);
                setValues([minFromAPI, maxFromAPI]);
            }
            else {
                setError(data.error || "Failed to fetch products.");
            }
        } catch (error) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleViewProductDetails = (product) => {
        if (!category_id || !sub_category_id) {
            console.error("Missing category_id or sub_category_id");
            return;
        }

        // sessionStorage.setItem("category_id", category_id);
        // sessionStorage.setItem("sub_category_id", sub_category_id);

        localStorage.setItem("category_id", category_id);
        localStorage.setItem("sub_category_id", sub_category_id);
        localStorage.setItem("category_name", categoryName);
        localStorage.setItem("sub_category_name", subCategoryName);
        localStorage.setItem("product_name", product.product_name);
        navigate(`/product-details/${categoryName}/${subCategoryName}/${product.product_id}`, {
            state: {
                category_name: categoryName,
                sub_category_name: subCategoryName,
                product_name: product.product_name,
            },
        });
    };

    const handleAddCart = async (product_id) => {
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
            const response = await fetch("http://127.0.0.1:8000/add-cart-product", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id, product_id, quantity: 1 }),
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

    const handleFilterProducts = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("http://127.0.0.1:8000/filter-product-price", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    category_id,
                    category_name: categoryName,
                    sub_category_id,
                    sub_category_name: subCategoryName,
                    customer_id,
                    min_price: values[0],
                    max_price: values[1],
                }),
            });

            const data = await response.json();

            if (data.status_code === 200) {
                setAllProducts(data.products);
                setProducts(data.products);
            } else {
                setError(data.error || "Failed to fetch products.");
                setProducts([]); // Clear display if nothing found
            }
        } catch (error) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="customer-dashboard container">
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && (
                <div className="customer-products">
                    <div className="header-filter">
                        <div className="customer-products-heading">{subCategoryName} - Products</div>
                        {/* Price Range Filter */}
                        <div className="filter-sort-section">

                            <div className="price-slider-container">
                                <label className="price-range-label">
                                    Price Range
                                    <div> ₹{values[0]} - ₹{values[1]}</div>
                                </label>
                                <div className="slider-btn">
                                    <Range
                                        className="price-slider-range"
                                        values={values}
                                        step={100}
                                        min={minPrice}
                                        max={maxPrice}
                                        onChange={(newValues) => {
                                            setValues(newValues);
                                        }}
                                        renderTrack={({ props, children }) => (
                                            <div
                                                {...props}
                                                style={{
                                                    ...props.style,
                                                    width: '100%',
                                                    background: 'white',
                                                    borderRadius: '4px',
                                                    margin: '20px 0',
                                                    border: '0.5px solid grey',
                                                }}
                                            >
                                                {children}
                                            </div>
                                        )}
                                        renderThumb={({ props }) => (
                                            <div
                                                {...props}
                                                style={{
                                                    ...props.style,
                                                    height: '15px',
                                                    width: '15px',
                                                    backgroundColor: '#4450A2',
                                                    borderRadius: '50%',
                                                }}
                                            />
                                        )}
                                    />
                                    <button className="filter-button" onClick={handleFilterProducts}>
                                        Filter
                                    </button>
                                </div>
                            </div>

                            {/* Sorting Dropdown */}
                            <div className="sorting-section">
                                <label>Sort by:   </label>
                                <select onChange={(e) => setSortOrder(e.target.value)} value={sortOrder}>
                                    <option value=""> Select</option>
                                    <option value="low_to_high"> Price : Low to High</option>
                                    <option value="high_to_low"> Price : High to Low</option>
                                    <option value="latest"> Latest</option>
                                </select>
                            </div>
                        </div>
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

                    <div className="customer-products-section">

                        {products.length > 0 ? (
                            products.map((product) => (
                                <div
                                    key={product.product_id}
                                    className="customer-product-card"
                                    onClick={() => handleViewProductDetails(product)}
                                >
                                    <img
                                        src={product.product_image_url ? `http://127.0.0.1:8000${product.product_image_url}` : defaultImage}
                                        alt={product.product_name}
                                        className="customer-product-image"
                                        onError={(e) => (e.target.src = defaultImage)}
                                    />
                                    <div className="customer-product-name">{product.product_name}</div>
                                    <div className="customer-discount-section-price">₹{product.final_price}/- (incl. GST)</div>
                                    <div >
                                        <div className="customer-discount-section-original-price">₹{product.price}/- (incl. GST)</div>
                                        <div className="add-cart-section">
                                            <span
                                                className={`availability ${product.quantity === 0
                                                    ? "out-of-stock"
                                                    : product.quantity <= 5
                                                        ? "few-left"
                                                        : "in-stock"
                                                    }`}
                                            >
                                                {product.quantity === 0
                                                    ? "Out of Stock"
                                                    : product.quantity <= 5
                                                        ? "Very Few Products Left"
                                                        : "In Stock"}
                                            </span>
                                            {product.quantity > 0 && (
                                                <BiSolidCartAdd
                                                    className="add-to-cart-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevents navigation when clicking on the cart icon
                                                        handleAddCart(product.product_id);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div>

                                <div>No products available.</div></div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerViewProducts;

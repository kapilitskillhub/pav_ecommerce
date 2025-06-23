import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../CustomerViewCategory/CustomerViewCategory.css";
import { BiSolidCartAdd } from "react-icons/bi";
import PopupMessage from "../../../components/Popup/Popup";
import { Link } from "react-router-dom";
import API_BASE_URL from "../../../config";
import CarouselLanding from "../CustomerCarousel/CustomerCarousel";
import { Range } from 'react-range';
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

const FilteredProducts = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const filteredProducts = location.state?.filteredProducts || [];

    const { categoryName: paramCategory, subCategoryName: paramSubCategory } = useParams();
    const locationState = location.state || {};
    const categoryName = paramCategory || locationState.category_name || localStorage.getItem("category_name");
    const subCategoryName = paramSubCategory || locationState.sub_category_name || localStorage.getItem("sub_category_name");

    const category_id = location.state?.category_id || localStorage.getItem("category_id");
    const sub_category_id = location.state?.sub_category_id || localStorage.getItem("sub_category_id");
    const customer_id = localStorage.getItem("customer_id") || null;
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(10000);
    const [values, setValues] = useState([0, 10000]);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [sortOrder, setSortOrder] = useState("");
    const [allCategories, setAllCategories] = useState([]);
    const [products, setProducts] = useState(filteredProducts);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [wishlist, setWishlist] = useState([]);

    const displayPopup = (text, type = "success") => {
        setPopupMessage({ text, type });
        setShowPopup(true);

        setTimeout(() => {
            setShowPopup(false);
        }, 10000);
    };

    useEffect(() => {
        fetchFilteredAndSortedProducts();
    }, [sortOrder]);


    useEffect(() => {
        fetchAllCategories();
    }, []);

    const fetchAllCategories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/filter-product-price-each-category`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            });

            const data = await response.json();

            console.log("Fetched categories data:", data);

            if (response.ok) {
                setAllCategories(data.categories);
            } else {
                console.error(data.error || "Failed to fetch categories");
            }
        } catch (err) {
            console.error("Error fetching categories", err);
        }
    };

    const toggleCategory = (categoryId) => {
        setExpandedCategory(prev => (prev === categoryId ? null : categoryId));
    };

    useEffect(() => {
        console.log("Received Filtered Products in Component:", filteredProducts);
        setProducts(filteredProducts);

        if (filteredProducts.length > 0) {
            const prices = filteredProducts.map(product => product.final_price);
            const min = Math.floor(Math.min(...prices));
            const max = Math.ceil(Math.max(...prices));

            setMinPrice(min);
            setMaxPrice(max);
            setValues([min, max]);
        }
    }, [filteredProducts]);


    const handleViewProductDetails = (product) => {
        if (!category_id || !sub_category_id) {
            console.error("Missing category_id or sub_category_id");
            return;
        }

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
            )
            return;
        }
        if (!product_id) {
            console.error("Product ID is missing.");
            displayPopup("Product ID not found. Cannot add to cart.", "error");

            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/add-cart-product`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id, product_id, quantity: 1 }),
            });
            const data = await response.json();

            if (data.status_code === 200) {
                displayPopup("Product added to cart successfully!", "success");
            } else {
                displayPopup(data.error || "Failed to add product to cart.", "error");
            }
        } catch (error) {
            displayPopup("An unexpected error occurred while adding to cart.", error, "error");
        }
    };
    const fetchFilteredAndSortedProducts = async () => {
        setLoading(true);
        setError(null);

        const hasMin = values[0] !== '';
        const hasMax = values[1] !== '';
        const hasSort = sortOrder !== '';

        let requestBody = {
            category_id: category_id,
            category_name: categoryName,
            sub_category_id: sub_category_id,
            sub_category_name: subCategoryName,
            customer_id: customer_id
        };
        if (hasMin && hasMax && hasSort) {
            requestBody = {
                ...requestBody,
                min_price: values[0],
                max_price: values[1],
                sort_by: sortOrder
            };
        } else if (hasMin && hasMax) {
            requestBody = {
                ...requestBody,
                min_price: values[0],
                max_price: values[1],
                sort_by: 'low_to_high'
            };
        } else if (hasSort) {
            requestBody = {
                ...requestBody,
                sort_by: sortOrder
            };
        }

        try {
            const response = await fetch(`${API_BASE_URL}/filter-and-sort-products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (response.ok) {
                setProducts(data.products);
                const initialWishlist = data.products
                    .filter((product) => product.wishlist_status === true)
                    .map((product) => product.product_id);
                setWishlist(initialWishlist);
            } else {
                setError(data.error || 'Failed to fetch products');
            }
        } catch (error) {
            setError('An error occurred while fetching products.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (products.length > 0) {
            const initialWishlist = products
                .filter((product) => product.wishlist_status === true)
                .map((product) => product.product_id);
            setWishlist(initialWishlist);
        }
    }, [products]);

    const toggleWishlist = async (product_id) => {
        const customer_id = localStorage.getItem("customer_id");
        if (!customer_id) {
            displayPopup(
                <>
                    Please <Link to="/customer-login" className="popup-link">log in</Link> to add to wishlist.
                </>,
                "error"
            );
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/add-to-wishlist`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id, product_id }),
            });
            const data = await response.json();

            if (data.status_code === 200) {
                displayPopup(data.message, "success");

                setWishlist((prev) =>
                    prev.includes(product_id)
                        ? prev.filter((id) => id !== product_id)
                        : [...prev, product_id]
                );
            } else {
                displayPopup(data.message || "Failed to add to wishlist.", "error");
            }
        } catch (error) {
            displayPopup("An error occurred while adding to wishlist.", "error");
        }
    };
    return (
        <div className="customer-dashboard container">
            < CarouselLanding />
            <div className="breadcrumb">
                <span className="breadcrumb-link" onClick={() => navigate("/")}> Back to  Home</span>
            </div>
            <div className="customer-products-heading">Filtered Products</div>
            <div className="popup-discount">
                {showPopup && (
                    <PopupMessage
                        message={popupMessage.text}
                        type={popupMessage.type}
                        onClose={() => setShowPopup(false)}
                    />
                )}
            </div>
            {products.length === 0 ? (
                <p>No products found within the selected price range.</p>
            ) : (
                <div className="product-filter-dashboard">

                    {isMobile && (
                        <div className="mobile-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                            {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
                        </div>
                    )}

                    {(!isMobile || showFilters) && (
                        <div className="header-filter">
                            <div className="filter-sort-section">
                                <div className="filter-heading-products"><p>Filters</p></div>
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
                                            onChange={(newValues) => setValues(newValues)}
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
                                        <button className="filter-button" onClick={fetchFilteredAndSortedProducts}>
                                            Filter
                                        </button>
                                    </div>
                                </div>
                                <div className="sorting-section">
                                    <label >Sort by: </label>
                                    <select onChange={(e) => setSortOrder(e.target.value)} value={sortOrder}>
                                        <option value="low_to_high"> Price : Low to High</option>
                                        <option value="high_to_low"> Price : High to Low</option>
                                        <option value="latest"> Latest</option>
                                    </select>
                                </div>

                            </div>
                        </div>


                    )}
                    <div className="customer-products-section">

                        {products.length > 0 ? (
                            products.map((product) => (
                                <div
                                    key={product.product_id}
                                    className="customer-product-card wishlist-card"
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
                                        src={product.product_image_url}
                                        alt={product.product_name}
                                        className="customer-product-image"
                                    />
                                    <div className="customer-product-name">{product.product_name}</div>
                                    <div className="customer-discount-section-price ">₹{product.final_price}.00 (incl. GST)</div>
                                    <div >
                                        <div className="add-cart-section">
                                            <div className="customer-discount-section-original-price">₹{product.price}.00 (incl. GST)</div>
                                            <span
                                                className={`availability ${product.availability === "Out of Stock"
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
                                            {(product.availability === "Very Few Products Left" || product.availability === "In Stock") && (
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
                            <p>No products available.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
export default FilteredProducts;

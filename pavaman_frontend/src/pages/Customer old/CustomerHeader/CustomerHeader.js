import React, { useState, useEffect } from "react";
import { FaSearch, FaMapMarkerAlt, FaShoppingCart, FaUser, FaClipboardList, FaSignOutAlt, FaSignInAlt, } from "react-icons/fa";
import { IoMdPerson } from "react-icons/io";
import { TbShoppingBagEdit } from "react-icons/tb";
import { FiMenu, FiChevronRight, FiHome, FiPhone } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import "../CustomerHeader/CustomerHeader.css";
import Logo from "../../../assets/images/logo.png";
import PopupMessage from "../../../components/Popup/Popup";
import { Link } from "react-router-dom";

const CustomerHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [cartCount, setCartCount] = useState(0);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [products, setProducts] = useState({});
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState(null);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginSignup, setShowLoginSignup] = useState(true);
  const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);


  const customerId = localStorage.getItem("customer_id");

  const isValidCustomerId = !(
    customerId === null ||
    customerId === "null" ||
    customerId === "undefined" ||
    customerId === ""
  );

  const shouldShowLoginSignup = !isValidCustomerId;


  const fetchCartCount = async () => {
    const customer_id =
      sessionStorage.getItem("customer_id") || localStorage.getItem("customer_id");

    if (!customer_id) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/view-cart-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id }),
      });

      const data = await response.json();
      console.log("Cart API response:", data); // For debugging

      if (data.status_code === 200) {
        const items = data.cart_items || [];
        setCartCount(items.length);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };



  const displayPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
    }, 10000);
  };

  const fetchOrderDetails = async () => {
    const customer_id = localStorage.getItem("customer_id");

    if (!customer_id) {
      displayPopup(
        <>
          Please <Link to="/customer-login" className="popup-link">log in</Link> to view your cart.
        </>,
        "error"
      );

      // navigate("/customer-login");

      return;
    }
  };
  const fetchCategories = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.status_code === 200) {
        setCategories(data.categories);
      } else {
        setError(data.error || "Failed to fetch categories.");
      }
    } catch (error) {
      setError("An unexpected error occurred while fetching categories.");
    }
  };

  const fetchSubCategories = async (categoryName) => {
    if (subcategories[categoryName]) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/categories/view-sub-categories/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_name: categoryName,
          customer_id: sessionStorage.getItem("customer_id") || null,
        }),
      });
      const data = await response.json();
      if (data.status_code === 200) {
        setSubcategories((prev) => ({ ...prev, [categoryName]: data.subcategories }));
      }
    } catch {
      console.error("Error fetching subcategories");
    }
  };

  const fetchProducts = async (subCatId, categoryName, subCatName) => {
    if (products[subCatId] !== undefined) return;

    setProducts((prev) => ({ ...prev, [subCatId]: "loading" }));
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/categories/${categoryName}/${subCatName}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sub_category_id: subCatId }),
        }
      );
      const data = await response.json();
      setProducts((prev) => ({
        ...prev,
        [subCatId]: data.products?.length ? data.products : [],
      }));
    } catch {
      setProducts((prev) => ({ ...prev, [subCatId]: [] }));
    }
  };

  useEffect(() => {
    setIsLoggedIn(isValidCustomerId);
    fetchCartCount();
    fetchCategories();

    const updateCart = () => fetchCartCount();
    window.addEventListener("cartUpdated", updateCart);
    return () => window.removeEventListener("cartUpdated", updateCart);
  }, [location]);

  const handleLogout = () => {
    sessionStorage.removeItem("customer_id");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const isUserLoggedIn = false;

  const handleHeaderOrders = () => {
    navigate("/orders")
  }

  const handleProductClick = (categoryName, subCategoryName, productId) => {
    setIsCollapsed(true); // Hide sidebar
    navigate(`/product-details/${categoryName}/${subCategoryName}/${productId}`);
  };

  return (
    <header className="customer-header">
      <div className="customer-logo">
        <img src={Logo} alt="Logo" />
      </div>


      <div
        className="sidebar-header"
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <button className="menu-btn"><FiMenu size={24} /></button>
        <p className="menu-name">All Categories</p>

        <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
          <ul className="category-list">
            {categories.map((cat) => (
              <li
                key={cat.category_id}
                onMouseEnter={() => {
                  setHoveredCategory(cat.category_name);
                  fetchSubCategories(cat.category_name);
                }}
                className="category-item"
              >
                <button
                  className="category-btn"
                  onClick={() =>
                    navigate(`/categories/view-sub-categories/`, {
                      state: { category_name: cat.category_name },
                    })
                  }
                >
                  {cat.category_name} <FiChevronRight />
                </button>

                {hoveredCategory === cat.category_name &&
                  subcategories[cat.category_name] && (
                    <ul className="subcategory-list">
                      {subcategories[cat.category_name].map((sub) => (
                        <li
                          key={sub.sub_category_id}
                          className="subcategory-item"
                          onMouseEnter={() => {
                            setHoveredSubcategory(sub.sub_category_id);
                            if (!products[sub.sub_category_id]) {
                              fetchProducts(
                                sub.sub_category_id,
                                cat.category_name,
                                sub.sub_category_name
                              );
                            }
                          }}
                        >
                          <button
                            onClick={() =>
                              navigate(
                                `/categories/${cat.category_name}/${sub.sub_category_name}`,
                                {
                                  state: {
                                    sub_category_id: sub.sub_category_id,
                                  },
                                }
                              )
                            }
                            className="subcategory-btn"
                          >
                            {sub.sub_category_name} <FiChevronRight />
                          </button>

                          {hoveredSubcategory === sub.sub_category_id && (
                            <ul className="product-list">
                              {products[sub.sub_category_id] === "loading" ? (
                                <li>Loading products...</li>
                              ) : products[sub.sub_category_id]?.length > 0 ? (
                                products[sub.sub_category_id].map((prod) => (
                                  <li key={prod.product_id}
                                    className="product-item"
                                    onClick={() => {
                                      setIsCollapsed(true);
                                      handleProductClick(cat.category_name, sub.sub_category_name, prod.product_id);
                                    }}
                                  >
                                    {prod.product_name}
                                  </li>
                                ))
                              ) : (
                                <li>No products</li>
                              )}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="customer-search-bar">
        <FaSearch className="customer-search-icon" />
        <input type="text" placeholder="Search for products..." />
      </div>

      <div className="nav-icon-wrapper">
        <div className="nav-item" onClick={() => navigate("/")}>
          <FiHome className="nav-icon" />
          <span>Home</span>
        </div>

        {/* <div className="nav-item" onClick={() => navigate("/orders")}> */}
        <div
          className="nav-item"
          onClick={() => {
            handleHeaderOrders()
          }
          }
        >
          <TbShoppingBagEdit className="nav-icon" />
          <span>Order</span>
        </div>

        <div
          className="nav-item user-icon"
          onMouseEnter={() => window.innerWidth > 768 && setIsUserDropdownOpen(true)}
          onMouseLeave={() => window.innerWidth > 768 && setIsUserDropdownOpen(false)}
          onClick={toggleUserDropdown}
        >
          <IoMdPerson className="nav-icon" />
          <span>Account</span>
          {isUserDropdownOpen && (
            <div className="customer-dropdown-menu">
              <ul>
                {shouldShowLoginSignup ? (
                  <>
                    <li onClick={() => navigate("/customer-login")}><FaSignInAlt /> Login /  SignUp</li>
                    {/* <li onClick={() => navigate("/customer-register")}><FaUser /> Sign Up</li> */}

                  </>
                ) : (
                  <>
                    <li onClick={() => navigate("/profile")}><FaUser /> My Profile</li>
                    <li onClick={() => navigate("/orders")}><FaClipboardList /> My Orders</li>
                    <li onClick={() => navigate("/address")}><FaMapMarkerAlt /> Address</li>
                    <li onClick={handleLogout}><FaSignOutAlt />Logout </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="nav-item cart-icon" onClick={() => navigate("/view-cart-products")}>
          <FaShoppingCart className="nav-icon" />
          {cartCount > 0 && <span className="customer-cart-badge">{cartCount}</span>}
          <span>Cart</span>
        </div>

        <div className="nav-item" onClick={() => navigate("/contact")}>
          <FiPhone className="nav-icon" />
          <span>Contact</span>
        </div>
      </div>
    </header>
  );
};

export default CustomerHeader;
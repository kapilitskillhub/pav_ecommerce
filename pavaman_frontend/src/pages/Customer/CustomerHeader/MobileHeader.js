import { useState, useEffect } from "react";
import { BiCategory } from "react-icons/bi";
import {
  FaSearch,
  FaShoppingCart,
  FaHome,
} from "react-icons/fa";
import { IoMdPerson } from "react-icons/io";
import "../CustomerHeader/MobileHeader.css";
import { IoMdClose } from "react-icons/io";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../../assets/images/header logo mobile.svg";

import { LuBriefcaseBusiness } from "react-icons/lu";

const MobileHeader = ({ handleLogout, cartCount }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search...");

  const [showProfileOptions, setShowProfileOptions] = useState(false);

  const handleUserIconClick = () => {
    if (location.pathname === "/profile-options") {
      navigate(-1);
    } else {
      navigate("/profile-options");
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const customerId = localStorage.getItem("customer_id");

  const isValidCustomerId = !(
    customerId === null ||
    customerId === "null" ||
    customerId === "undefined" ||
    customerId === ""
  );

  const handleAllCategories = () => {
    navigate("/all-categories");
  };

  useEffect(() => {
    if (location.pathname.includes("/categories/view-sub-categories")) {
      setSearchPlaceholder("Search for Subcategories...");
    } else if (
      location.pathname.includes("/categories/") ||
      location.pathname.includes("/filtered-products") ||
      location.pathname.includes("/all-products")
    ) {
      setSearchPlaceholder("Search for Products...");
    } else if (location.pathname.includes("/view-cart-products")) {
      setSearchPlaceholder("Search Cart Products ...");
    } else if (
      location.pathname === "/" ||
      location.pathname.includes("/all-categories")
    ) {
      setSearchPlaceholder("Search for Categories...");
    }
  }, [location]);

  const handleSearch = () => {
    const trimmedQuery = searchInput.trim();
    window.dispatchEvent(
      new CustomEvent("customerCategorySearch", { detail: trimmedQuery })
    );
  };

  const hideSearchIconPaths = ["/b2b", "/contact", "/policies", "/profile-options", "/my-orders", "/my-orders-details", "/product-details", "/edit-profile", "/edit-address", "/address", "/checkout-page", "/payment", "/profile", "/edit-profile"];
  const shouldHideSearchIcon = hideSearchIconPaths.some(path =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      <div className="mobile-header-section-second">
        <div className="mobile-header">
          <div className="mobile-customer-logo" onClick={() => navigate("/")}>
            <img src={Logo} alt="Logo" />
          </div>

          <div
            className={`mobile-search-icon toggle-search-icon ${shouldHideSearchIcon ? "hidden-icon-space" : ""}`}
            onClick={!shouldHideSearchIcon ? toggleSearch : undefined}
          >
            {!shouldHideSearchIcon && (
              <FaSearch className="mobile-customer-search-icon" />
            )}
          </div>

          <div className="user-icon-wrapper" onClick={handleUserIconClick}>
            <IoMdPerson size={24} />
          </div>
        </div>

        <div className="toggled-mobile-menu">
          {showSearch &&
            (location.pathname.includes("/categories/view-sub-categories") ||
              location.pathname.includes("/categories/") ||
              location.pathname.includes("/filtered-products") ||
              location.pathname.includes("/all-products") ||
              location.pathname === "/" ||
              location.pathname.includes("/all-categories") ||
              location.pathname.includes("/view-cart-products")) && (
              <div className="mobile-search-bar">
                <input
                  type="text"
                  className="mobile-search-bar-input"
                  placeholder={searchPlaceholder}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSearch()
                  }
                />
                {searchInput ? (
                  <IoMdClose
                    className="customer-search-icon"
                    onClick={() => {
                      setSearchInput("");
                      window.dispatchEvent(
                        new CustomEvent("customerCategorySearch", {
                          detail: "",
                        })
                      );
                    }}
                  />
                ) : (
                  <FaSearch
                    className="customer-search-icon"
                    onClick={handleSearch}
                  />
                )}
              </div>
            )}
        </div>
      </div>

      <div className="mobile-nav-icon-wrapper">
        <div className="nav-item" onClick={() => navigate("/")}>
          <FaHome className="nav-icon" />
          <span>Home</span>
        </div>

        <div className="nav-item" onClick={handleAllCategories}>
          <BiCategory className="nav-icon" />
          <span>Categories</span>
        </div>

        <div
          className="nav-item cart-icon"
          onClick={() => navigate("/view-cart-products")}
        >
          <FaShoppingCart className="nav-icon" />
          {cartCount > 0 && (
            <span className="customer-cart-badge">{cartCount}</span>
          )}
          <span>Cart</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/b2b")}>
          <LuBriefcaseBusiness className="nav-icon" />
          <span>B2B</span>
        </div>
      </div>
    </>
  );
};

export default MobileHeader;

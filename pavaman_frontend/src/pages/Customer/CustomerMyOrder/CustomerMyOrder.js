import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CustomerMyOrder.css';
import { FaCircleArrowRight } from "react-icons/fa6";
import PopupMessage from "../../../components/Popup/Popup";

const CustomerMyOrders = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const location = useLocation();
  const { selected_product_id } = location.state || {};
  const customerId = localStorage.getItem("customer_id");
  const navigate = useNavigate();
  const highlightedRef = useRef(null);
  const [statusFilters, setStatusFilters] = useState([]);
  const [timeFilters, setTimeFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = window.innerWidth <= 425;

  const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [orderTime, setOrderTime] = useState("");

  const displayPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
    }, 10000);
  };

  const fetchOrders = async () => {
    if (!customerId) return;

    try {
      // Fetch orders
      const response = await fetch('http://127.0.0.1:8000/customer-my-order', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId }),
      });
      const data = await response.json();

      if (response.ok) {
        const flatProducts = [];
        data.payments.forEach(order => {
          order.order_products.forEach(product => {
            flatProducts.push({ ...product, order });
          });
        });

        // Now fetch ratings
        const ratingResponse = await fetch('http://127.0.0.1:8000/view-rating', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: customerId }),
        });

        const ratingData = await ratingResponse.json();

        const ratingsMap = {};
        if (ratingResponse.ok) {
          ratingData.ratings.forEach(rating => {
            ratingsMap[rating.product_id] = rating.rating;
          });
        }

        // Merge ratings into products
        const productsWithRatings = flatProducts.map(product => ({
          ...product,
          rating: ratingsMap[product.product_id] || null,
        }));

        // Bring selected product to the top
        const sortedProducts = productsWithRatings.sort((a, b) => {
          return a.order_product_id === selected_product_id ? -1 : b.order_product_id === selected_product_id ? 1 : 0;
        });

        setProducts(sortedProducts);
      } else {
        setError(data.error || "Error fetching orders");
      }
    } catch (error) {
      setError("Fetch error: " + error.message);
    }
  };


  useEffect(() => {
    fetchOrders();
  }, [customerId]);

  useEffect(() => {
    if (highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [products]);

  const goToOrderDetails = (product) => {
    navigate("/my-orders-details", {
      state: {
        order: product.order,
        selected_product_id: product.order_product_id,
      },
    });
  };

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
      </div>
    );
  }

  const filterMyOrders = async (status = "", orderTime = "") => {
    const requestBody = {
      customer_id: customerId,
      order_time: orderTime || null,
    };

    if (status === "Delivered") {
      requestBody.delivery_status = "Delivered";
    } else if (status === "Shipped") {
      requestBody.shipping_status = "Shipped";
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/filter-my-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        const flatProducts = [];
        data.payments.forEach(order => {
          order.order_products.forEach(product => {
            flatProducts.push({ ...product, order });
          });
        });

        setProducts(flatProducts);
      } else if (response.status === 404) {
        setProducts([]);
      } else {
        throw new Error(data.error || "Error filtering orders");
      }
    } catch (error) {
      console.error("Something went wrong!", error);
      displayPopup("Something went wrong while filtering orders.", "error");
    }
  };



  const handleStatusFilter = (status) => {

    setDeliveryStatus(status);
    filterMyOrders(status, orderTime);
  };

  const handleTimeFilter = (time) => {
    setOrderTime(time);
    filterMyOrders(deliveryStatus, time);
  };
  // At the top of your component or just before return
  const currentYear = new Date().getFullYear();
  const orderTimeOptions = [
    "Last 30 days",
    ...Array.from({ length: 4 }, (_, i) => `${currentYear - i}`),
    "Older"
  ];

  const handleClearFilters = () => {
    setDeliveryStatus("");
    setOrderTime("");
    fetchOrders(); // Refetch all orders without filters
  };


  const renderStars = (rating) => {
    const totalStars = 5;
    return (
      <div className="star-rating">
        {[...Array(totalStars)].map((_, index) => (
          <span key={index} className={index < rating ? "filled-star" : "empty-star"}>
            ★
          </span>
        ))}
      </div>
    );
  };
  


  return (
    <div className="my-orders-wrapper container">
      <div className="breadcrumb-order">
        <span onClick={() => navigate("/")}>Home</span> &gt;
        <span className="current-my-orders">My Orders</span>
      </div>

      <div className="order-page-container">
        {/* Sidebar Filters */}
        {/* Toggle Filters for Mobile */}
        {isMobile && (
          <div className="mobile-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
          </div>
        )}

        <aside className={`filters-sidebar ${isMobile ? "mobile" : ""} ${showFilters ? "open" : ""}`}>
          <div className='filter-heading'>Filters</div>

          <div className="filter-section">
            <div className='filter-header'>ORDER STATUS</div>
            {/* {["On the way", "Delivered", "Cancelled", "Returned"].map(status => ( */}
            {["Shipped", "Delivered"].map(status => (

              <label key={status}>
                <input
                  type="radio"
                  name="status"
                  checked={deliveryStatus === status}
                  onChange={() => handleStatusFilter(status)}
                /> {status}
              </label>
            ))}

          </div>

          <div className="filter-section">
            <div className="filter-header">ORDER TIME</div>
            {orderTimeOptions.map((time) => (
              <label key={time} style={{ display: 'block', marginBottom: '4px' }}>
                <input
                  type="radio"
                  name="orderTime"
                  checked={orderTime === time}
                  onChange={() => handleTimeFilter(time)}
                />{" "}
                {time}
              </label>
            ))}
          </div>
          <div className="filter-actions">
            <button className="clear-filters-button" onClick={() => handleClearFilters()}>
              Clear Filters
            </button>
          </div>

        </aside>


        {/* Orders Section */}
        <section className="orders-section">
          {/* Search Bar */}
          <div className="orders-search">
            <input
              type="text"
              placeholder="Search your orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-btn" disabled>Search</button>
          </div>


          {/* Heading */}
          <h2 className="heading-my-order">My Orders</h2>
          <div className="popup-cart">
            {showPopup && (
              <PopupMessage
                message={popupMessage.text}
                type={popupMessage.type}
                onClose={() => setShowPopup(false)}
              />
            )}
          </div>
          {/* Order Cards */}
          <div className="orders-list">
            {products.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              products.map((product, index) => (
                <div className={`order-card ${product.order_product_id === selected_product_id ? 'highlight-product' : ''}`} ref={product.order_product_id === selected_product_id ? highlightedRef : null}>
                  <div className="product-summary">
                    <img src={product.product_image}
                      alt={product.product_name} className="product-image" />
                    <div className="product-info">
                      <div>
                        <p className="product-name">{product.product_name}</p>
                        <p>Order ID: {product.order.product_order_id}</p>
                        <p>Price: ₹{product.final_price}</p>
                        {/* <p>{product.shipping_status}</p> */}
                        <p className={product.delivery_status === "Delivered"
                          ? "delivery_status"
                          : product.shipping_status === "Shipped"
                            ? "shipping_status"
                            : "order_placed"}>
                          {product.delivery_status === "Delivered"
                            ? "Delivered"
                            : product.shipping_status === "Shipped"
                              ? "Shipped, Item will be delivered soon"
                              : "Order Placed. Item will be shipped soon"}
                        </p>
                        {console.log(product.delivery_status, product.rating)} {/* Log delivery status and rating */}

{product.delivery_status === "Delivered" && product.rating && (
  <div className="product-rating">
    {renderStars(product.rating)}
  </div>
)}

{product.delivery_status === 'Delivered' && !product.rating && (
  <div className="rate-review-button-container">
    <button
      className="rate-review-button"
      // onClick={() => handleRateReview(product)}
    >
      Rate and Review
    </button>
  </div>
)}






                        <div className="toggle-container">
                          <span className="toggle-details" onClick={() => goToOrderDetails(product)}>
                            <FaCircleArrowRight />
                          </span>
                        </div>
                      </div>



                    </div>
                  </div>
                </div>

              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );

};

export default CustomerMyOrders;

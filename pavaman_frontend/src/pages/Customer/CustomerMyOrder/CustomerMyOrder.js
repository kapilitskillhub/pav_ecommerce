import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CustomerMyOrder.css';
import { FaCircleArrowRight } from "react-icons/fa6";

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


  const fetchOrders = async () => {
    if (!customerId) return;
    try {
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

        // Bring selected product to the top
        const sortedProducts = flatProducts.sort((a, b) => {
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

  const toggleFilter = () => {

  }
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
    {["On the way", "Delivered", "Cancelled", "Returned"].map(status => (
      <label key={status}>
        <input type="checkbox" disabled /> {status}
      </label>
    ))}
  </div>

  <div className="filter-section">
    <div className='filter-header'>ORDER TIME</div>
    {(() => {
  const currentYear = new Date().getFullYear();
  const years = ["Last 30 days", ...Array.from({ length: 4 }, (_, i) => `${currentYear - i}`), "Older"];
  return years.map(time => (
    <label key={time}>
      <input type="checkbox" disabled /> {time}
    </label>
  ));
})()}

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

        {/* Order Cards */}
        <div className="orders-list">
          {products.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            products.map((product, index) => (
              <div
                key={index}
                ref={product.order_product_id === selected_product_id ? highlightedRef : null}
                className={`order-card ${product.order_product_id === selected_product_id ? 'highlight-product' : ''}`}
              >
                <div className="product-summary">
                  <img
                    src={`http://127.0.0.1:8000/${product.product_image}`}
                    alt={product.product_name}
                    className="product-image"
                  />
                  <div className="product-info">
                    <p className="product-name">{product.product_name}</p>
                    <p>Order ID: {product.order.product_order_id}</p>
                    <p>Price: ₹{product.final_price}</p>
                    <div className="toggle-container">
                      <span
                        className="toggle-details"
                        onClick={() => goToOrderDetails(product)}
                      >
                        <FaCircleArrowRight />
                      </span>
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

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

  return (
    <div>
      <div className="breadcrumb-order">
        <span className="breadcrumb-order-home" onClick={() => navigate("/")}>Home</span>&gt;{" "}
        <span className="breadcrumb-myaccount" onClick={() => navigate("/my-account")}>My Account</span>&gt;{" "}
        <span className="current-my-orders">My Orders</span>
      </div>

      <div className="my-orders-container">
        <h2 className='heading-my-order'>My Orders</h2>
        {products.length === 0 ? (
          <p>Loading...</p>
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
                  <p className='product-name'><strong>{product.product_name}</strong></p>
                  <div>
                    <p className='product-orderid'>Order ID: {product.order.product_order_id}</p>
                  </div>
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
    </div>
  );
};

export default CustomerMyOrders;

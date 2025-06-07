import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CustomerMyOrder.css';
import { FaCircleArrowRight } from "react-icons/fa6";
import PopupMessage from "../../../components/Popup/Popup";
import API_BASE_URL from "../../../config";
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
  const [showReviewFormFor, setShowReviewFormFor] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [editReviewFor, setEditReviewFor] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editFeedback, setEditFeedback] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const displayPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
    }, 10000);
  };
  useEffect(() => {
    if (searchTerm.trim() === "") {
      fetchOrders();
    }
  }, [searchTerm]);

  const fetchOrders = async () => {
    if (!customerId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/customer-my-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          action: "view"
        }),
      });
      const data = await response.json();
      if (response.ok) {
        const flatProducts = [];
        data.payments.forEach(order => {
          order.order_products.forEach(product => {
            flatProducts.push({ ...product, order });
          });
        });
        const ratingResponse = await fetch(`${API_BASE_URL}/view-rating`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: customerId }),
        });
        const ratingData = await ratingResponse.json();
        const ratingsMap = {};
        if (ratingResponse.ok) {
          ratingData.ratings.forEach(rating => {
            ratingsMap[rating.order_product_id] = {
              rating: rating.rating,
              feedback: rating.feedback || "",
            };
          });
        }
        const productsWithRatings = flatProducts.map(product => {
          const ratingInfo = ratingsMap[product.order_product_id] || {};
          return {
            ...product,
            rating: ratingInfo.rating || null,
            feedback: ratingInfo.feedback || "",
          };
        });

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
    } else if (status === "On the way") {
      requestBody.shipping_status = "Shipped";
    }
    try {
      const response = await fetch(`${API_BASE_URL}/filter-my-order`, {
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
        const ratingResponse = await fetch(`${API_BASE_URL}/view-rating`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: customerId }),
        });

        const ratingData = await ratingResponse.json();
        const ratingsMap = {};
        if (ratingResponse.ok) {
          ratingData.ratings.forEach(rating => {
            ratingsMap[rating.order_product_id] = {
              rating: rating.rating,
              feedback: rating.feedback || "",
            };
          });
        }
        const productsWithRatings = flatProducts.map(product => {
          const ratingInfo = ratingsMap[product.order_product_id] || {};
          return {
            ...product,
            rating: ratingInfo.rating || null,
            feedback: ratingInfo.feedback || "",
          };
        });

        setProducts(productsWithRatings);
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
  const currentYear = new Date().getFullYear();
  const orderTimeOptions = [
    "Last 30 days",
    ...Array.from({ length: 4 }, (_, i) => `${currentYear - i}`),
    "Older"
  ];
  const handleClearFilters = () => {
    setDeliveryStatus("");
    setOrderTime("");
    fetchOrders();
  };
  const renderStars = (rating) => {
    const totalStars = 5;
    return (
      <div className="stars-display">
        {[...Array(totalStars)].map((_, index) => (
          <span key={index} className={index < rating ? "filled-star" : "empty-star"}>
            ★
          </span>
        ))}
      </div>
    );
  };
  const handleSubmitReview = async (product) => {
    try {
      const response = await fetch(`${API_BASE_URL}/submit-feedback-rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: customerId,
          product_id: product.product_id,
          product_order_id: product.order.product_order_id,
          rating,
          feedback,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        ;
        displayPopup("Thank you! Your review has been submitted.", "success");
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p.order_product_id === product.order_product_id
              ? {
                ...p,
                rating: rating,
                feedback: feedback,
              }
              : p
          )
        );
        setShowReviewFormFor(null);
        setRating(0);
        setFeedback("");
      } else {
        displayPopup(result.error || "Failed to submit review.", "error");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      displayPopup("An error occurred while submitting your review.", "error");
    }
  };
  const handleEditReview = async (product) => {
    try {
      const response = await fetch(`${API_BASE_URL}/edit-feedback-rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: customerId,

          product_id: product.product_id,
          product_order_id: product.order.product_order_id,
          rating: editRating,
          feedback: editFeedback,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        displayPopup("Your review has been updated.", "success");
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p.order_product_id === product.order_product_id
              ? {
                ...p,
                rating: editRating,
                feedback: editFeedback,
              }
              : p
          )
        );
        setEditReviewFor(null);
        setEditRating(0);
        setEditFeedback("");
      } else {
        displayPopup(result.error || "Failed to update review.", "error");
      }
    } catch (error) {
      console.error("Error updating review:", error);
      displayPopup("An error occurred while updating your review.", "error");

    }
  };
  const searchOrdersByProduct = async (term) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer-my-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          action: "search",
          search_product_name: term.trim(),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        const flatProducts = [];
        data.payments.forEach(order => {
          order.order_products.forEach(product => {
            flatProducts.push({ ...product, order });
          });
        });
        const ratingResponse = await fetch(`${API_BASE_URL}/view-rating`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: customerId }),
        });
        const ratingData = await ratingResponse.json();
        const ratingsMap = {};
        if (ratingResponse.ok) {
          ratingData.ratings.forEach(rating => {
            ratingsMap[rating.order_product_id] = {
              rating: rating.rating,
              feedback: rating.feedback || "",
            };
          });
        }
        const productsWithRatings = flatProducts.map(product => {
          const ratingInfo = ratingsMap[product.order_product_id] || {};
          return {
            ...product,
            rating: ratingInfo.rating || null,
            feedback: ratingInfo.feedback || "",
          };
        });
        setProducts(productsWithRatings);
      } else {
        setProducts([]);
        setError(data.error || "No results found.");
      }
    } catch (error) {
      setError("Search fetch error: " + error.message);
    }
  };
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = products.slice(indexOfFirstOrder, indexOfLastOrder);
  const paginate = pageNumber => {
    setCurrentPage(pageNumber);
    scrollToTop();
  };
  const totalPages = Math.ceil(products.length / ordersPerPage);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  return (
    <div className="my-orders-wrapper container">
      <div className="breadcrumb-order">
        <span onClick={() => navigate("/")}>Home</span> 
        <span className="current-my-orders">My Orders</span>
      </div>

      <div className="order-page-container">
        {isMobile && (
          <div className="mobile-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
          </div>
        )}

        <aside className={`filters-sidebar ${isMobile ? "mobile" : ""} ${showFilters ? "open" : ""}`}>
          <div className='filter-heading'>Filters</div>

          <div className="filter-section">
            <div className='filter-header'>ORDER STATUS</div>
            {["On the way", "Delivered"].map(status => (

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
        <section className="orders-section">
          <div className="orders-search">
            <input
              type="text"
              placeholder="Search your orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="search-btn"
              onClick={() => searchOrdersByProduct(searchTerm)}
              disabled={!searchTerm.trim()}
            >
              Search
            </button>
          </div>
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
          <div className="orders-list">
            {products.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              currentOrders.map((product, index) => (
                <div className={`order-card ${product.order_product_id === selected_product_id ? 'highlight-product' : ''}`} ref={product.order_product_id === selected_product_id ? highlightedRef : null}>
                  <div className="product-summary">
                    <img src={product.product_image}
                      alt={product.product_name} className="product-image" />
                    <div className="product-info">
                      <div>
                        <p className="product-name">{product.product_name}</p>
                        <p>Order ID: {product.order.product_order_id}</p>
                        <p>Price: ₹{product.final_price}.00 (incl. GST)
                          <span className="discount-tag-myorder">
                            {product.discount && parseFloat(product.discount) > 0 && `${product.discount} off`}
                          </span></p>
                        {parseFloat(product.price) !== parseFloat(product.final_price) && (
                          <p className="customer-discount-section-original-price-myorder">
                            ₹{product.price} (incl. GST)
                          </p>
                        )}
                        {product.gst && parseFloat(product.gst) > 0 && <p className="gst-myorder">GST: {product.gst}</p>}

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
                        {console.log(product.delivery_status, product.rating)}

                        {product.delivery_status === "Delivered" && product.rating && (
                          <div className="product-rating">
                            {renderStars(product.rating)}
                          </div>
                        )}

                        {product.delivery_status === 'Delivered' && !product.rating && (
                          <div className="edit-review-button-container rate-review-button-container">
                            <button
                              className="edit-review-button rate-review-button"
                              onClick={() => setShowReviewFormFor(product.order_product_id)}
                            >
                              Rate and Review
                            </button>
                          </div>
                        )}

                        {showReviewFormFor === product.order_product_id && (
                          <div className="review-form">
                            <div className="stars-display">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={star <= rating ? "filled-star" : "empty-star"}
                                  style={{ cursor: "pointer", fontSize: "24px" }}
                                  onClick={() => setRating(star)}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <textarea
                              placeholder="Write your review..."
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              rows={3}
                              className='text-area-rating'

                            />
                            <div className='rating-buttons'>
                              <button
                                className="cart-place-order submit-review-button"
                                onClick={() => handleSubmitReview(product)}
                              >
                                Submit
                              </button>
                              <button
                                className="cart-delete-selected cancel-review-button"
                                onClick={() => {
                                  setShowReviewFormFor(null);
                                  setRating(0);
                                  setFeedback("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {product.delivery_status === "Delivered" && product.rating && (
                          <div className="edit-review-button-container">
                            <button
                              className="edit-review-button"
                              onClick={() => {
                                setEditReviewFor(product.order_product_id);
                                setEditRating(product.rating);
                                setEditFeedback(product.feedback || "");
                              }}
                            >
                              Edit Review
                            </button>
                          </div>
                        )}
                        {editReviewFor === product.order_product_id && (
                          <div className="review-form">
                            <div className="edit-stars-display stars-display">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={star <= editRating ? "filled-star" : "empty-star"}
                                  style={{ cursor: "pointer", fontSize: "24px" }}
                                  onClick={() => setEditRating(star)}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <textarea
                              placeholder="Edit your review..."
                              value={editFeedback}
                              onChange={(e) => setEditFeedback(e.target.value)}
                              rows={3}
                              className='text-area-rating'
                            />
                            <div className='rating-buttons'>
                              <button
                                className="submit-edit-review-button cart-place-order"
                                onClick={() => handleEditReview(product)}
                              >
                                Update
                              </button>
                              <button
                                className="cart-delete-selected cancel-review-button"
                                onClick={() => {
                                  setEditReviewFor(null);
                                  setEditRating(0);
                                  setEditFeedback("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
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
      <div className="pagination-myorder">
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => paginate(index + 1)}
            className={currentPage === index + 1 ? 'active' : ''}
          >
            {index + 1}
          </button>
        ))}
        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
      </div>
    </div>
  );

};

export default CustomerMyOrders;

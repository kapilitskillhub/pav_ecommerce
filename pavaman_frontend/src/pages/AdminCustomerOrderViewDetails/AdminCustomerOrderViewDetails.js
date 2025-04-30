import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import axios from 'axios';
import "./AdminCustomerOrderViewDetails.css"; // Make sure this CSS file exists
import PopupMessage from "../../components/Popup/Popup";

const PaidOrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [productStatuses, setProductStatuses] = useState({});
  const [selectAllDispatched, setSelectAllDispatched] = useState(false);
  const [selectAllDelivered, setSelectAllDelivered] = useState(false);
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);


    const displayPopup = (text, type = "success") => {
      setPopupMessage({ text, type });
      setShowPopup(true);

      setTimeout(() => {
          setShowPopup(false);
      }, 5000);
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const adminId = sessionStorage.getItem("admin_id") || 1;
        const response = await axios.post(
          "http://127.0.0.1:8000/get-payment-details-by-order",
          {
            razorpay_order_id: orderId,
            admin_id: adminId
          },
          { withCredentials: true }
        );

        const matchedOrder = response.data.payments.find(
          (payment) => payment.razorpay_order_id === orderId
        );

        if (matchedOrder) {
          setOrder(matchedOrder);

          const initialStatuses = {};
          matchedOrder.order_products.forEach((product) => {
            initialStatuses[product.id] = {
              dispatched: product.order_status === "Dispatched",
              delivered: product.Delivery_status === "Delivered"
            };
          });
          setProductStatuses(initialStatuses);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

const handleProductDispatch = async (productId) => {
  try {
    const adminId = sessionStorage.getItem("admin_id");
    const orderProductIds = [productId]; // Array of order product IDs for the selected product

    await axios.post(
      "http://127.0.0.1:8000/update-order-status",
      {
        admin_id: adminId,
        product_order_id:order.product_order_id,
        customer_id:order.customer_id,

        order_product_ids: orderProductIds, // Send the selected product ID in an array
        update_type: "dispatched",
        mode: "separate",
      },
      { withCredentials: true }
    );

    setProductStatuses((prevStatuses) => ({
      ...prevStatuses,
      [productId]: {
        ...prevStatuses[productId],
        dispatched: true,
      },
    }));

    // Optional: Display a success popup
    displayPopup("Order dispatched successfully");
  } catch (error) {
    console.error("Error updating dispatched status:", error);
    displayPopup("Error updating dispatched status", "error");
  }
};

const handleProductDeliver = async (productId) => {
  try {
    const adminId = sessionStorage.getItem("admin_id");
    const orderProductIds = [productId]; // Array of order product IDs for the selected product

    await axios.post(
      "http://127.0.0.1:8000/update-order-status",
      {
        admin_id: adminId,
        product_order_id:order.product_order_id,
        customer_id:order.customer_id,

        order_product_ids: orderProductIds, // Send the selected product ID in an array
        update_type: "delivered",
        mode: "separate",
      },
      { withCredentials: true }
    );

    setProductStatuses((prevStatuses) => ({
      ...prevStatuses,
      [productId]: {
        ...prevStatuses[productId],
        delivered: true,
      },
    }));

    // Optional: Display a success popup
    displayPopup("Order delivered successfully");
  } catch (error) {
    console.error("Error updating delivered status:", error);
    displayPopup("Error updating delivered status", "error");
  }
};

const handleSelectAllDispatch = async () => {
  try {
    const adminId = sessionStorage.getItem("admin_id");
    const orderProductIds = order.order_products.map((product) => product.id); // Collect all product IDs for dispatch

    await axios.post(
      "http://127.0.0.1:8000/update-order-status",
      {
        admin_id: adminId,
        product_order_id:order.product_order_id,
        customer_id:order.customer_id,

        order_product_ids: orderProductIds, // Send all product IDs
        update_type: "dispatched",
        mode: "all",
      },
      { withCredentials: true }
    );

    // Update local UI state to reflect dispatch for all products
    const newStatuses = {};
    order.order_products.forEach((product) => {
      newStatuses[product.id] = {
        ...productStatuses[product.id],
        dispatched: true,
      };
    });
    setProductStatuses((prev) => ({
      ...prev,
      ...newStatuses,
    }));

    // Optional: Display a success popup
    displayPopup("All products dispatched successfully");
  } catch (error) {
    console.error("Error dispatching all products:", error);
    displayPopup("Error dispatching all products", "error");
  }
};

const handleSelectAllDeliver = async () => {
  try {
    const adminId = sessionStorage.getItem("admin_id");
    const orderProductIds = order.order_products.map((product) => product.id); // Collect all product IDs for delivery

    await axios.post(
      "http://127.0.0.1:8000/update-order-status",
      {
        admin_id: adminId,
        customer_id:order.customer_id,
        product_order_id:order.product_order_id,
        order_product_ids: orderProductIds, // Send all product IDs
        update_type: "delivered",
        mode: "all",
      },
      { withCredentials: true }
    );

    // Update local UI state to reflect delivery for all products
    const newStatuses = {};
    order.order_products.forEach((product) => {
      newStatuses[product.id] = {
        ...productStatuses[product.id],
        delivered: true,
      };
    });
    setProductStatuses((prev) => ({
      ...prev,
      ...newStatuses,
    }));

    // Optional: Display a success popup
    displayPopup("All products delivered successfully");
  } catch (error) {
    console.error("Error delivering all products:", error);
    displayPopup("Error delivering all products", "error");
  }
};

  
  if (!order) return <div className="loading">Loading...</div>;

  const {
    customer_name,
    email,
    mobile_number,
    customer_address,
    order_products
  } = order;

  const address = customer_address[0] || {};

  return (
    <div className="report-details-container">
      <div className="customer-address-box">
        <div className="details-row">
          <div className="details-column">
            <h2>Customer Details</h2>
            <div className='detail-item'><strong>Name:</strong> {customer_name}</div>
            <div className='detail-item'><strong>Email:</strong> {email}</div>
            <div className='detail-item'><strong>Mobile:</strong> {mobile_number}</div>
          </div>
          <div className="details-column">
            <h2>Delivery Address</h2>
            <div className='address-details-columns'>
              <div className='first-address-details-column'>
                <div className='detail-item'><strong>Name:</strong> {address.customer_name}</div>
                <div className='detail-item'><strong>Mobile:</strong> {address.mobile_number}</div>
                <div className='detail-item'><strong>Alternate Mobile:</strong> {address.alternate_mobile}</div>
                <div className='detail-item'><strong>Type:</strong> {address.address_type}</div>
                <div className='detail-item'><strong>Street:</strong> {address.street}</div>
              </div>
              <div className='second-address-details-column'>
                <div className='detail-item'><strong>Village:</strong> {address.village}</div>
                <div className='detail-item'><strong>District:</strong> {address.district}</div>
                <div className='detail-item'><strong>State:</strong> {address.state}</div>
                <div className='detail-item'><strong>Pincode:</strong> {address.pincode}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Select All Actions */}
      {/* <div className="order-status-section">
        <label>
          <input
            type="checkbox"
            checked={selectAllDispatched}
            onChange={handleSelectAllDispatch}
          />
          Select All Dispatched
        </label>
        <label style={{ marginLeft: "20px" }}>
          <input
            type="checkbox"
            checked={selectAllDelivered}
            onChange={handleSelectAllDeliver}
          />
          Select All Delivered
        </label>
      </div> */}

      <div className="product-details-table">
        <h3>Payment Order Details</h3>
        {order_products?.length ? (
         <table>
         <thead>
           <tr>
             <th>Image</th>
             <th>Product Name</th>
             <th>Unit Price</th>
             <th>Discount</th>
             <th>Final Price</th>
             <th>Quantity</th>
             <th>Total Price</th>
             <th>Order Status</th>
             <th>Delivery Status</th>
           </tr>
         </thead>
         <tbody>
           {order_products.map((item, index) => (
             <tr key={index}>
               <td>
                 {item.product_image ? (
                   <img
                     src={`http://127.0.0.1:8000/${item.product_image}`}
                     alt={item.product_name}
                     height="50"
                   />
                 ) : "No image"}
               </td>
               <td className='item-data-name'>{item.product_name}</td>
               <td>₹{item.price}</td>
               <td>₹{item.discount}</td>
               <td>₹{item.final_price}</td>
               <td>{item.quantity}</td>
               <td>₹{item.final_price * item.quantity}</td>
               <td>
                 <input
                   type="checkbox"
                   checked={productStatuses[item.id]?.dispatched || false}
                   onChange={() => handleProductDispatch(item.id)}
                   disabled={productStatuses[item.id]?.dispatched}
                 />
               </td>
               <td>
                 <input
                   type="checkbox"
                   checked={productStatuses[item.id]?.delivered || false}
                   onChange={() => handleProductDeliver(item.id)}
                   disabled={
                     productStatuses[item.id]?.delivered ||
                     !productStatuses[item.id]?.dispatched
                   }
                 />
               </td>
             </tr>
           ))}
         </tbody>
         <tfoot>
           <tr>
             <td colSpan="7"></td>
             <td>
               <label style={{ fontSize: "0.9rem" }}>
                 <input
                   type="checkbox"
                   checked={selectAllDispatched}
                   onChange={(e) => {
                     setSelectAllDispatched(e.target.checked);
                     handleSelectAllDispatch();
                   }}
                 />
                 Select All
               </label>
             </td>
             <td>
               <label style={{ fontSize: "0.9rem" }}>
                 <input
                   type="checkbox"
                   checked={selectAllDelivered}
                   onChange={(e) => {
                     setSelectAllDelivered(e.target.checked);
                     handleSelectAllDeliver();
                   }}
                 />
                 Select All
               </label>
             </td>
           </tr>
         </tfoot>
       </table>
       
        ) : (
          <p>No products found for this order.</p>
        )}
      </div>
    </div>
  );
};

export default PaidOrderDetails;

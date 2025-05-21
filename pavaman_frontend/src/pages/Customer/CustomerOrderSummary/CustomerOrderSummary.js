import React, { useState, useEffect } from "react";
import RazorpayPayment from "../CustomerPayment/CustomerPayment"
import "./CustomerOrderSummary.css";
import defaultImage from "../../../assets/images/product.png";
import PopupMessage from "../../../components/Popup/Popup";
import API_BASE_URL from "../../../config";
const OrderSummary = ({ orderSummary, setOrderSummary = () => { }, setPopup = () => { } }) => {
    const [orders, setOrders] = useState(orderSummary?.orders || []);
    const [showPayment, setShowPayment] = useState(false);
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);

    const displayPopup = (text, type = "success") => {
        setPopupMessage({ text, type });
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 10000);
    };

    useEffect(() => {
        setOrders(orderSummary?.orders || []);
    }, [orderSummary]);

    const handleCancelOrder = async () => {
        const customerId = localStorage.getItem("customer_id");

        const ordersToCancel = orders
            .filter(order => order?.order_id && order?.product_id)
            .map(order => ({
                order_id: order.order_id,
                product_id: order.product_id
            }));

        if (!customerId || ordersToCancel.length === 0) {
            displayPopup("Missing order details. Cannot cancel.", "error");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/cancel-multiple-orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id: customerId, orders: ordersToCancel }),
            });

            const data = await response.json();
            if (response.ok) {
                const cancelled_orders = data.cancelled_orders || [];
                const failed_orders = data.failed_orders || [];

                if (cancelled_orders.length > 0) {
                    setPopup({ text: "Selected orders have been successfully cancelled!", type: "success" });

                    setOrders(prevOrders =>
                        prevOrders.filter(order =>
                            !cancelled_orders.some(canceled => canceled.order_id === order.order_id)
                        )
                    );

                    setOrderSummary(prevSummary => ({
                        ...prevSummary,
                        orders: prevSummary.orders.filter(order =>
                            !cancelled_orders.some(canceled => canceled.order_id === order.order_id)
                        ),
                    }));
                }

                if (failed_orders.length > 0) {
                    displayPopup(`Some orders could not be cancelled:\n${failed_orders.map(f => f.message).join("\n")}`, "error");
                }
            } else {
                displayPopup(data.error || "Failed to cancel orders.", "error");
            }
        } catch (error) {
            console.error("Error cancelling orders:", error);
            displayPopup("An error occurred while cancelling orders.", "error");
        }
    };

    if (!orderSummary || !orderSummary.orders || orderSummary.orders.length === 0) return null;

    return (
        <div className="order-summary container">
            <div className="order-section-header">Order Summary</div>
            {showPopup && (
                <PopupMessage
                    message={popupMessage.text}
                    type={popupMessage.type}
                    onClose={() => setShowPopup(false)}
                />
            )}
            <div>
                {showPayment && orderSummary?.orders?.length > 0 && (
                    <RazorpayPayment orderSummary={orderSummary} />
                )}
            </div>

            {orders.map((order, index) => (
                <div key={order.order_id} className="order-item">
                    <div className="order-image">
                        <img
                            src={
                                order.product_images
                            }
                            alt="Product"
                            width="100"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = defaultImage;
                            }}
                        />
                    </div>

                    <div className="order-details">
                        <div className="order-product-title"> {order.product_name}</div>
                        <div className="order-price-section order-discount-price"> ₹ {order.final_price.toFixed(2)}</div>
                        {parseFloat(order.final_price).toFixed(2) !== parseFloat(order.product_price).toFixed(2) && (
                            <div className="order-price-section order-original-price"> ₹ {order.product_price}/-(incl. GST)</div>
                        )}
                        <div><strong>Quantity:</strong> {order.quantity}</div>
                        <div><strong>Total Price:</strong> ₹ {(order.quantity * order.final_price).toFixed(2)}</div>
                       
                    </div>
                </div>
            ))}

        {orders.length > 0 && (() => {
            const totalDeliveryCharge = orders.reduce((sum, order) => sum + (parseFloat(order.delivery_charges) || 0), 0);

            const grandTotal = orders.reduce((sum, order) => sum + (order.quantity * order.final_price), 0) + totalDeliveryCharge;
return (
    <div className="order-total-summary">
                <p><strong>Platform Fee:</strong> ₹0.00</p>
                 <div><strong>Total Delivery Charges:</strong> ₹ {totalDeliveryCharge.toFixed(2)}</div>
        <div><strong>Grand Total:</strong> ₹ {grandTotal.toFixed(2)}</div>
           </div>
    );
})()}
            <div className="cart-actions">
                <button className="cart-place-order"
                    onClick={() => { setShowPayment(true); }}
                >
                    Continue to Payment
                </button>

                <button className="cart-delete-selected" onClick={handleCancelOrder}>Cancel Order</button>
            </div>
        </div>
    );
};

export default OrderSummary;
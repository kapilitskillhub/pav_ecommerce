import React, { useState, useEffect } from "react";
import AddCustomerAddress from "../CustomerAddAddress/CustomerAddAddress";
import ViewCustomerAddress from "../CustomerViewAddress/CustomerViewAddress";
import EditAddress from "../CustomerEditAddress/CustomerEditAddress";
import OrderSummary from "../CustomerOrderSummary/CustomerOrderSummary"; // Import new component
import RazorpayPayment from "../CustomerPayment/CustomerPayment";
import Popup from "../../../components/Popup/Popup";
import PopupMessage from "../../../components/Popup/Popup";

const CustomerCheckoutPage = () => {
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [refreshAddresses, setRefreshAddresses] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [orderSummary, setOrderSummary] = useState(null); // Store order summary
    const [popupMessage, setPopupMessage] = useState("");
    const [popup, setPopup] = useState({ text: "", type: "" });

    useEffect(() => {
        console.log("Popup message updated:", popupMessage);
    }, [popupMessage]);

    const handleAddressAdded = (message) => {
        setShowAddressForm(false); // Hide form after successful submission
        setRefreshAddresses((prev) => !prev); // Refresh addresses
        setPopupMessage(message);
    };

    const handleEditAddress = (address) => {
        setEditingAddress(address);
    };

    const handleEditCompleted = (message) => {
        setEditingAddress(null);
        setRefreshAddresses((prev) => !prev);
        setPopupMessage(message);

    };

    return (
        <div>
            {/* View Saved Addresses */}
            <div className="popup-cart">

            {popup.text && (
                <PopupMessage
                    message={popup.text}
                    type={popup.type}
                    onClose={() => setPopup({ text: "", type: "" })}
                />
            )}

            </div>

            {popupMessage && <Popup message={popupMessage} onClose={() => setPopupMessage("")} />}
            {/* Add Address */}
            <div className="view-address-section">

            </div><ViewCustomerAddress
                onEditAddress={handleEditAddress}
                refresh={refreshAddresses}
                onAddressSelect={setSelectedAddress}
                setOrderSummary={setOrderSummary} // Pass state updater

            />
            <div>
                {!showAddressForm && !editingAddress && (
                    <div className="add-address-btn-section container">
                        <button className="add-address-btn" onClick={() => setShowAddressForm(true)}>Add Address</button>
                    </div>
                )}
            </div>

            {/*   
            {!showAddressForm && !editingAddress && (
                <div className="add-address-btn-section container">
                    <button className="add-address-btn" onClick={() => setShowAddressForm(true)}>Add Address</button>
                </div>
            )} */}

            {/* Show Add Address Form */}
            {showAddressForm && <AddCustomerAddress onAddressAdded={handleAddressAdded} />}

            {/* Show Edit Address Form */}
            {editingAddress && <EditAddress address={editingAddress} onEditCompleted={handleEditCompleted} />}

            {/* Show Order Summary when order is placed */}
            {orderSummary && <OrderSummary orderSummary={orderSummary} setOrderSummary={setOrderSummary} setPopup={setPopup} />}
            {orderSummary && (
                <RazorpayPayment
                    orderId={orderSummary.order_id}
                    customerId={orderSummary.customer_id}
                    totalAmount={orderSummary.total_amount}
                    productName={orderSummary.product_name}
                />
            )}
        </div>
    );
};

export default CustomerCheckoutPage;

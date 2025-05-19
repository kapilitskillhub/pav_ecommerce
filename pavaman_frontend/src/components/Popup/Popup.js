import React, { useEffect } from "react";
import { FaTimesCircle } from "react-icons/fa";
import "../Popup/Popup.css";

const PopupMessage = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 10000); 
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!message) return null;
    return (
        <div className={`popup-message ${type}`}>
            <span className="popup-text">{message}</span>
            <FaTimesCircle className="popup-close-btn" onClick={onClose} />
        </div>
    );
};

export default PopupMessage;

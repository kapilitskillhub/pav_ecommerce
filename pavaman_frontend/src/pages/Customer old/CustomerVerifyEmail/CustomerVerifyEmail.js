import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
    const { verification_link } = useParams(); // Get token from URL
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await axios.get(
                    `http://127.0.0.1:8000/verify-email/${verification_link}/`
                );

                if (response.data.message) {
                    alert("✅ Account verified successfully! Redirecting to login...");
                    navigate("/customer-login", {
                        state: { successMessage: "Your account is now verified. Please log in." }
                    });
                }
            } catch (error) {
                alert(error.response?.data?.error || "⚠️ Verification failed.");
                navigate("/customer-login");
            }
        };

        if (verification_link) {
            verifyEmail();
        }
    }, [verification_link, navigate]);

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-xl font-medium">Verifying your account...</div>
        </div>
    );
};

export default VerifyEmail;

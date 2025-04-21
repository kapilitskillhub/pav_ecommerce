import React, { useEffect, useState } from "react";
import "../CustomerViewCategory/CustomerViewCategory.css";
import { useNavigate } from "react-router-dom";
import defaultImage from "../../../assets/images/default.png"
import ViewDiscountedProducts from "../CustomerDiscountProducts/CustomerDiscountProducts";

const ViewCategoriesAndDiscountedProducts = () => {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [discountedProducts, setDiscountedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                // body: JSON.stringify({ customer_id: sessionStorage.getItem("customer_id") || null }),
                body: JSON.stringify({ customer_id: localStorage.getItem("customer_id") || null }),

            });

            const data = await response.json();

            if (data.status_code === 200) {
                setCategories(data.categories);
                setDiscountedProducts(data.discounted_products);
            } else {
                setError(data.error || "Failed to fetch data");
            }
        } catch (error) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleViewSubCategory = (category) => {
        // sessionStorage.setItem("category_id", category.category_id);
        localStorage.setItem("category_id", category.category_id);

        navigate("/categories/view-sub-categories/", { state: { category_name: category.category_name } });
    };
    
    return (
        <div className="customer-dashboard container">
            {loading && <p>Loading...</p>}
            {error && <p >{error}</p>}

            {!loading && !error && (
                <>
                    <div className="customer-products">
                        <div className="customer-products-heading">Categories</div>
                        <div className="customer-products-section"  >
                            {categories.map((category) => (
                                <div key={category.category_id} className="customer-product-card" 
                                onClick={() => handleViewSubCategory(category)}
>
                                    <img
                                        src={`http://127.0.0.1:8000${category.category_image_url}`}
                                        alt={category.category_name}
                                        className="customer-product-image"
                                        onError={(e) => e.target.src = defaultImage}
                                    />

                                    <div className="customer-product-name">{category.category_name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="empty-space"></div>
                    <ViewDiscountedProducts />
                </>
            )}
        </div>
    );
};

export default ViewCategoriesAndDiscountedProducts;

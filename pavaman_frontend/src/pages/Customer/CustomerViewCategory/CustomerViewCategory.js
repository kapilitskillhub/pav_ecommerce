import { useEffect, useState } from "react";
import "../CustomerViewCategory/CustomerViewCategory.css";
import { useNavigate } from "react-router-dom";
import ViewDiscountedProducts from "../CustomerDiscountProducts/CustomerDiscountProducts";
import CarouselLanding from "../CustomerCarousel/CustomerCarousel";
import API_BASE_URL from "../../../config";

const ViewCategoriesAndDiscountedProducts = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [latestProducts, setLatestProducts] = useState([]);

useEffect(() => {
  fetchData(); // initial fetch

  const handleSearch = (e) => {
    const query = e.detail;

    if (!query || query.trim() === "") {
      fetchData(); // 🔁 reset categories and discounted products
    } else {
      searchCategories(query);
    }
  };

  window.addEventListener("customerCategorySearch", handleSearch);

  return () => {
    window.removeEventListener("customerCategorySearch", handleSearch);
  };
}, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customer_id: localStorage.getItem("customer_id") || null }),
      });

      const data = await response.json();

      if (data.status_code === 200) {
        setCategories(data.categories);
        setDiscountedProducts(data.discounted_products);
      } else {
        setError(data.error || "Failed to fetch data");
      }

      const latestResponse = await fetch(`${API_BASE_URL}/latest-products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customer_id: localStorage.getItem("customer_id") || null }),
      });

      const latestData = await latestResponse.json();
      if (latestData.status === "success") {
        setLatestProducts(latestData.data);
      }

    } catch (error) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };


const searchCategories = async (query) => {
  if (!query || query.trim() === "") return; // avoid unnecessary call

  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/customer-search-categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_name: query,
        customer_id: localStorage.getItem("customer_id") || null,
      }),
    });

    const data = await response.json();
    if (data.status_code === 200 && data.categories?.length) {
      setCategories(data.categories);
      setError("");
    } else {
      setCategories([]);
      setError("No matching categories found.");
    }
  } catch (err) {
    setError("Search failed.");
  } finally {
    setLoading(false);
  }
};

  const handleViewSubCategory = (category) => {
    localStorage.setItem("category_id", category.category_id);

    navigate("/categories/view-sub-categories/", { state: { category_name: category.category_name } });
  };

  const handleViewProductDetails = (product) => {
    if (!product.category_id || !product.sub_category_id) {
      console.error("Missing category_id or sub_category_id");
      return;
    }

    localStorage.setItem("category_id", product.category_id);
    localStorage.setItem("sub_category_id", product.sub_category_id);
    localStorage.setItem("category_name", product.category);
    localStorage.setItem("sub_category_name", product.sub_category);
    localStorage.setItem("product_name", product.product_name);

    navigate(`/product-details/${product.category}/${product.sub_category}/${product.product_id}`, {
      state: {
        category_name: product.category,
        sub_category_name: product.sub_category,
        product_name: product.product_name,
      },
    });
  };


  return (
    <div>
      <CarouselLanding />
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
                      src={category.category_image_url}
                      alt={category.category_name}
                      className="customer-product-image"
                    />
                    <div className="customer-product-name">{category.category_name}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="empty-space"></div>
            <ViewDiscountedProducts slidesToShow={5} />


            <div className="customer-products">
              <div className="customer-products-heading">Latest Products</div>
              {latestProducts.length > 0 && (
                <div className="latest-products-container">
                  <div className="featured-latest-product">
                    <img src={latestProducts[0].product_image} alt={latestProducts[0].product_name} />
                    <div className="featured-product-name">{latestProducts[0].product_name}</div>
                    <button className="view-more-btn cart-place-order" onClick={() => navigate("/latest-products")}>
                      Explore More
                    </button>
                  </div>
                  <div className="latest-products-grid">
                    {latestProducts.slice(1, 7).map((product) => (
                      <div
                        key={product.product_id}
                        className="latest-product-card customer-product-card"
                        onClick={() => handleViewProductDetails(product)}
                      >
                        <img src={product.product_image} alt={product.product_name} className="customer-product-image latest-product-image" />
                        <div className="customer-product-name">{product.product_name}</div>
                        <div className="customer-discount-section-price">₹{product.final_price}.00 (incl. GST)</div>
                        <div className="customer-discount-section-original-price">
                          {product.price !== product.final_price ? (
                            <>
                              ₹{product.price}.00 (incl. GST)
                              <div className="discount-tag">
                                {product.discount && parseFloat(product.discount) > 0
                                  ? `${product.discount} off`
                                  : ''}
                              </div>
                            </>
                          ) : (
                            <></>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  );
};

export default ViewCategoriesAndDiscountedProducts;

import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../config";
const BottomProductsPage = () => {
  const [bottomProducts, setBottomProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const admin_id = sessionStorage.getItem("admin_id");
  useEffect(() => {
    axios
      .post(`${API_BASE_URL}/not-selling-products`, { admin_id })
      .then((res) => {
        setBottomProducts(res.data.not_selling_products || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load bottom products.");
        setLoading(false);
      });
  }, []);
  return (
    <div className="report-wrapper">
      <h2 className="report-title">Bottom Products (Not Selling)</h2>
      {loading && <p className="loading-text">Loading products...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Product Name</th>
              </tr>
            </thead>
            <tbody>
              {bottomProducts.map((product, index) => (
                <tr key={product.id}>
                  <td className="order-table-data">{index + 1}</td>
                  <td className="order-table-data">{product.product_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BottomProductsPage;

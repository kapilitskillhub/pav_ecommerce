import{ useEffect, useState } from 'react';
import axios from 'axios';
import './AdminInventory.css';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from "../../config";
import PopupMessage from "../../components/Popup/Popup";
const AdminInventoryProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const adminId = sessionStorage.getItem("admin_id");
  const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);
  const displayPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 10000);
  };
  useEffect(() => {
    fetchDiscountProducts();
  }, []);

  const fetchDiscountProducts = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/product-discount-inventory-view`, {
        admin_id: adminId,
        action: "inventory"
      });

      if (response.data.status_code === 200 && response.data.products) {
        setProducts(response.data.products);
      } else {
        setError(response.data.message || 'No discounted products found.');
      }
    } catch (err) {
      setError('Failed to fetch products.');
      displayPopup('Failed to fetch products.', "error");

    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/download-inventory-products-excel`,
        { admin_id: adminId },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Products_Inventory_Details.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      displayPopup('Failed to download Excel.', "error");

    }
  };
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="recent-orders">
      <div className="discount-header">
        <h3>Sold Quantity Products Details</h3>
        <div className="discount-buttons">
          <button onClick={downloadExcel}>Download Excel</button>
        </div>
      </div>

     <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p className="loading-text">Loading, Please wait...</p>
      ) : (
        <>
          <div className="customer-table-container">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Category Name</th>
                  <th>SubCategory Name</th>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>HSN</th>
                  <th>quantity</th>
                  <th>sold quantity</th>
                  <th>Price</th>
                  <th>Discount(%)</th>
                  <th>Final Price</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product, index) => (
                  <tr key={product.product_id}>
                    <td>{indexOfFirstProduct + index + 1}</td>
                    <td>{product.category}</td>
                    <td>{product.sub_category}</td>
                    <td>
                      <img src={product.product_images[0]} alt={product.product_name} width="50" height="50" />
                    </td>
                    <td>{product.product_name}</td>
                    <td>{product.sku_number}</td>
                    <td>{product.hsn_code}</td>
                    <td>{product.quantity}</td>
                    <td>{product.total_quantity_sold}</td>
                    <td>₹ {product.price.toFixed(2)}</td>
                    <td>{product.discount}</td>
                    <td>₹ {product.final_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-container">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`pagination-button ${page === currentPage ? "active-page" : ""
                  }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminInventoryProducts;
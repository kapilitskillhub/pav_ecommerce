import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDiscounts.css';

const AdminDiscountProducts = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const adminId = sessionStorage.getItem("admin_id");

  useEffect(() => {
    fetchDiscountProducts();
  }, []);

  const fetchDiscountProducts = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/discount-products', {
        admin_id: adminId,
      });

      if (response.data.status_code === 200 && response.data.products) {
        setProducts(response.data.products);
      } else {
        setError(response.data.message || 'No discounted products found.');
      }
    } catch (err) {
      setError('Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/download-discount-products-excel',
        { admin_id: adminId },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'discount_products.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      alert('Failed to download Excel.');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadExcel = async () => {
    if (!file) {
      alert('Please select an Excel file first.');
      return;
    }

    const formData = new FormData();
    formData.append('uploaded_file', file);
    formData.append('admin_id', adminId);

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/apply-discount-by-category',
        formData
      );
      alert(response.data.message || 'Discounts applied successfully!');
      fetchDiscountProducts(); // Refresh product list
    } catch (error) {
      alert('Failed to apply discounts.');
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
  <h3>Discounted Products</h3>
  <div className="discount-buttons">
    <button onClick={downloadExcel}>Download Excel</button>
    <input type="file" accept=".xlsx" onChange={handleFileChange} />
    <button onClick={uploadExcel}>Upload Discount Excel</button>
  </div>
</div>


      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p className="loading-text">Fetching products, please wait...</p>
      ) : (
        <>
          <div className="customer-table-container">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Final Price</th>
                  <th>Discount</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product, index) => (
                  <tr key={product.product_id}>
                    <td>{indexOfFirstProduct + index + 1}</td>
                    <td>
                      <img src={product.product_images[0]} alt={product.product_name} width="50" height="50" />
                    </td>
                    <td>{product.product_name}</td>
                    <td>{product.sku_number}</td>
                    <td>₹{product.price}</td>
                    <td>₹{product.final_price}</td>
                    <td>₹{product.discount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-container">
            <span>Page {currentPage} of {totalPages}</span>
            <button className="previous-button" onClick={prevPage} disabled={currentPage === 1}>PREVIOUS</button>

            {currentPage > 3 && (
              <>
                <button onClick={() => paginate(1)}>1</button>
                <span>...</span>
              </>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page =>
                page === currentPage ||
                page === currentPage - 1 ||
                page === currentPage + 1
              )
              .map(page => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={page === currentPage ? "active-page" : ""}
                >
                  {page}
                </button>
              ))}

            {currentPage < totalPages - 2 && (
              <>
                <span>...</span>
                <button onClick={() => paginate(totalPages)}>{totalPages}</button>
              </>
            )}

            <button className="next-button" onClick={nextPage} disabled={currentPage === totalPages}>NEXT</button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDiscountProducts;

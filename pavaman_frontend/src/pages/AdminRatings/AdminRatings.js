import{ useState, useEffect } from 'react';
import API_BASE_URL from "../../config";
import "./AdminRatings.css";
import axios from 'axios';
import PopupMessage from "../../components/Popup/Popup";
import { useNavigate } from 'react-router-dom';
const AdminRatings = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
    const fetchFeedback = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/retrieve-feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ admin_id: adminId,action: "customer_rating" }),
        });
        const data = await response.json();
        if (response.ok) {
          const startIndex = (currentPage - 1) * itemsPerPage;
          const paginatedData = data.feedback.slice(startIndex, startIndex + itemsPerPage);
          setFeedbackList(paginatedData);
          setTotalPages(Math.ceil(data.feedback.length / itemsPerPage));
        } else {
          setError(data.error || 'An error occurred');
      displayPopup(data.error || 'An error occurred', "error");
        }
      } catch (err) {
        setError('Server error: ' + err.message);
      displayPopup('Server error: ' + err.message, "error");

      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [adminId, currentPage]);

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
const downloadExcel = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/download-feedback-excel`,
      { admin_id: adminId },
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'feedback_report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
          displayPopup('Failed to download Excel.', "error");
  }
};
const navigateToAverageRatings = () => {
  navigate("/average-ratings");
};
  return (
    <div className="report-wrapper">
      <div className="discount-header">
        <h3 className="report-title heading-admin">Feedback Reports</h3>
        <div className='discount-buttons'>
        <button className='cart-place-order-average-btn ' onClick={navigateToAverageRatings}>Average Rating Page</button>
        <button className='cart-place-order' onClick={downloadExcel}>Download Excel</button>
        </div>
      </div>
           <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>
      {loading && <p className="loading-text">Loading, Please wait...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <>
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Product Image</th>
                  <th>Product Name</th>
                  <th>Order ID</th>
                  <th>Rating</th>
                  <th>Feedback</th>
                  <th>Created At</th>
                  <th>Customer Name</th>
                  <th>Customer Email</th>
                </tr>
              </thead>
              <tbody>
                {feedbackList.map((item, index) => (
                  <tr key={index}>
                    <td className="order-table-data">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="order-table-data"><img src={item.product_image} className=' ratings-image' /></td>
                    <td className="order-table-data">{item.product_name}</td>
                    <td className="order-table-data">{item.order_id}</td>
                    <td className="order-table-data">{item.rating}</td>
                    <td className="order-table-data">{item.feedback}</td>
                    <td className="order-table-data">{item.created_at}</td>
                    <td className="order-table-data">{item.customer_name}</td>
                    <td className="order-table-data text-style">{item.customer_email}</td>
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
               className={`pagination-button ${page === currentPage ? 'active-page' : ''}`}
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

export default AdminRatings;
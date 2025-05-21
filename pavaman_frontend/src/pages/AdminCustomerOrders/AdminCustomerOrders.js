import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminCustomerOrders.css";
import { Link } from "react-router-dom";
import "./AdminCustomerOrders.css"
import { FaEye } from "react-icons/fa";
import generateInvoicePDF from '../Customer/CustomerInvoice/CustomerInvoice';
import API_BASE_URL from "../../config";
const Report = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 15;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const adminId = sessionStorage.getItem("admin_id");
        if (!adminId) {
          setError("Admin session expired. Please log in again.");
          return;
        }

        const response = await axios.post(
          `${API_BASE_URL}/get-payment-details-by-order`,
          { admin_id: adminId }
        );

        if (
          response.data.status_code === 200 &&
          Array.isArray(response.data.payments)
        ) {
          setReports(response.data.payments);
        } else {
          setError("Failed to load report data.");
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Something went wrong while fetching reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reports.length / reportsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const [statusMap, setStatusMap] = useState({});

  return (
    <div className="report-wrapper">
      <h2 className="report-title">Ordered Payment Reports</h2>
      {loading && <p className="loading-text">Loading reports...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <>
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Name</th>
                  <th>Payment Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Razorpay Order ID</th>
                  <th>Invoice</th>
                  <th>Shipping Status</th>
                  <th>Delivery Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {currentReports.map((report, index) => {
                  const orderId = report.razorpay_order_id;
                  return (
                    <tr key={index}>
                      <td className="order-table-data">{indexOfFirstReport + index + 1}</td>
                      <td className="order-table-data">{report.customer_name}</td>
                      <td className="order-table-data">{report.payment_date}</td>
                      <td className="order-table-data">₹{report.total_amount}</td>
                      <td className="order-table-data payment-mode">{report.payment_mode}</td>
                      <td>{orderId}</td>
                      <td className="order-table-data payment-mode">
                        <button
                          className="invoice-button-customer-order"
                          onClick={() => generateInvoicePDF(report.customer_id, report, 'view')}
                          title="View Invoice"
                        >
                          <FaEye />
                        </button>
                      </td>
                      <td className="order-table-data payment-mode">
                        {report.order_products && report.order_products.length > 0
                          ? report.order_products.map((product, index) => (
                            <div key={index}>
                              {product.shipping_status}
                            </div>
                          ))
                          : "N/A"}
                      </td>
                      <td className="order-table-data payment-mode">
                        {report.order_products && report.order_products.length > 0
                          ? report.order_products.map((product, index) => (
                            <div key={index}>
                              {product.delivery_status}
                            </div>
                          ))
                          : "N/A"}
                      </td>
                      <td>
                        <Link to={`/admin-order-details/${orderId}`} className="view-link">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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

export default Report;

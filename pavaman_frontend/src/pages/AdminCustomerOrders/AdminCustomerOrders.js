import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminCustomerOrders.css";
import { Link } from "react-router-dom";

const Report = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const adminId = sessionStorage.getItem("admin_id");
        if (!adminId) {
          setError("Admin session expired. Please log in again.");
          return;
        }

        const response = await axios.post(
          "http://127.0.0.1:8000/get-payment-details-by-order",
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

  // Pagination logic
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reports.length / reportsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="report-wrapper">
      <h2 className="report-title">Payment Reports</h2>
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
                  <th>Rozarpay Order ID</th>
                  {/* <th></th> */}
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {currentReports.map((report, index) => (
                  <tr key={index}>
                    <td className="customer-order-date">{indexOfFirstReport + index + 1}</td>
                    {/* <td>{report.first_name} {report.last_name}</td> */}
                    <td className="customer-order-date-name">{report.customer_name}</td>

                    <td className="customer-order-date">{report.payment_date}</td>
                    <td className="customer-order-date">₹{report.total_amount}</td>
                    <td className="customer-order-date">{report.payment_mode}</td>
                    <td className="customer-order-date">{report.razorpay_order_id}</td>
                    <td className="customer-order-date">
                    <Link to={`/admin-order-details/${report.razorpay_order_id}`} className="view-link">
  View
</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
                className={`pagination-button ${
                  page === currentPage ? "active-page" : ""
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

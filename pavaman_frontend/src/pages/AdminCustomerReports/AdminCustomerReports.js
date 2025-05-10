import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminCustomerReports.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { FcSalesPerformance } from "react-icons/fc";
import { PiHandCoinsBold } from "react-icons/pi";
import { GiCoins } from "react-icons/gi";
import { BsCoin } from "react-icons/bs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, startOfWeek as startOfWeekFunc, endOfWeek as endOfWeekFunc } from 'date-fns';
import PopupMessage from "../../components/Popup/Popup";
import { Link } from "react-router-dom";

const AdminCustomerReports = () => {
  const [adminId, setAdminId] = useState(null);
  const [summary, setSummary] = useState({ today: 0, month: 0, total: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [error, setError] = useState('');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportFilter, setReportFilter] = useState('yearly'); // 'yearly' | 'monthly' | 'weekly'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedWeek, setSelectedWeek] = useState(1); // week number
  const [yearRange, setYearRange] = useState({
    from: new Date(new Date().getFullYear(), 0),
    to: new Date(new Date().getFullYear(), 11),
  });
  const [monthRange, setMonthRange] = useState({
    from: new Date(new Date().getFullYear(), 0),
    to: new Date(new Date().getFullYear(), 11),
  });
  const [weekDate, setWeekDate] = useState(new Date());
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  // Function to format amounts to currency
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

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
    const storedAdminId = sessionStorage.getItem('admin_id');
    if (!storedAdminId) {
      displayPopup(
        <>
          Admin session expired. Please <Link to="/admin-login" className="popup-link">log in</Link> again.
        </>,
        "error"
      );
      return;
    }

    setAdminId(storedAdminId);
    fetchSalesSummary(storedAdminId);
    fetchTopProducts(storedAdminId);
    fetchOrderStatusSummary(storedAdminId);
  }, []);

  useEffect(() => {
    if (adminId) {
      fetchMonthlyRevenue(adminId);
    }
  }, [adminId, reportYear, reportFilter, selectedMonth, selectedWeek]);

  const fetchSalesSummary = async (admin_id) => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/report-sales-summary', { admin_id });
      if (res.data.status_code === 200) {
        setSummary({
          today: res.data.today_sales_amount,
          month: res.data.this_month_sales_amount,
          total: res.data.total_sales_amount
        });
      }
    } catch (err) {
      console.error('Error fetching sales summary', err);
    }
  };

  const fetchMonthlyRevenue = async (admin_id) => {
    try {
      const payload = {
        admin_id,
        action: reportFilter === "yearly" ? "year" : reportFilter === "monthly" ? "month" : "week",
      };

      if (reportFilter === "yearly") {
        payload.start_date_str = format(yearRange.from, 'yyyy-MM-dd');
        payload.end_date_str = format(yearRange.to, 'yyyy-MM-dd');
      } else if (reportFilter === "monthly") {
        payload.start_date_str = format(monthRange.from, 'yyyy-MM-dd');
        payload.end_date_str = format(monthRange.to, 'yyyy-MM-dd');
      } else if (reportFilter === "weekly") {
        const startOfWeek = startOfWeekFunc(weekDate, { weekStartsOn: 1 }); // Monday as start of the week
        const endOfWeek = endOfWeekFunc(weekDate, { weekStartsOn: 1 });
        payload.start_date_str = format(startOfWeek, 'yyyy-MM-dd');
        payload.end_date_str = format(endOfWeek, 'yyyy-MM-dd');
      }

      const res = await axios.post('http://127.0.0.1:8000/report-monthly-revenue-by-year', payload);

      if (res.data.status_code === 200) {
        if (reportFilter === 'monthly') {
          setMonthlyRevenue(res.data.monthly_revenue || {});
        } else if (reportFilter === 'yearly') {
          setMonthlyRevenue(res.data.yearly_revenue || {});
        } else if (reportFilter === 'weekly') {
          setMonthlyRevenue(res.data.daywise_revenue || {});
        }
      } else if (res.data.status_code === 400) {
        displayPopup(res.data.error || "Something went wrong. Please try again.", "error");
      }
    } catch (err) {
      console.error('Error fetching monthly revenue', err);
      displayPopup(
        err?.response?.data?.error || "Something went wrong. Please try again.",
        "error"
      );
    }


  };


  const fetchTopProducts = async (admin_id) => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/top-five-selling-products', { admin_id });
      if (res.data.status_code === 200) {
        setTopProducts(res.data.top_5_products);
      }
    } catch (err) {
      console.error('Error fetching top products', err);
      displayPopup(error, "Error fetching top products.", "error");

    }
  };

  const fetchOrderStatusSummary = async (admin_id) => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/order-status-summary', { admin_id });
      if (res.data.status_code === 200 && res.data.order_status_summary) {
        const data = res.data.order_status_summary;
        const transformed = Object.entries(data).map(([status, value]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize first letter
          value: value
        }));
        setOrderStatusData(transformed);
      }
    } catch (err) {
      console.error('Error fetching order status summary', err);
    }
  };

  const handleFilterClick = () => {
    fetchMonthlyRevenue(adminId); // Trigger fetching with the updated filter data
  };

  return (
    <div className="dashboard-reports">
      <h2 className='sales-reports'>Sales Reports</h2>

      <div className="summary-cards">
        <div className="card-sales-first"><h3 className='today-heading'><BsCoin className="today-icon" />Today</h3> <p>{formatAmount(summary.today)}</p></div>
        <div className="card-sales-second"><h3 className='today-heading'><PiHandCoinsBold className="monthly-icon" />Monthly</h3><p>{formatAmount(summary.month)}</p></div>
        <div className="card-sales-third"><h3 className='today-heading'><GiCoins className="yearly-icon" />Yearly</h3><p>{formatAmount(summary.total)}</p></div>
      </div>

      <div className="charts-status">

        <div className="chart-box">
          <h3>Yearly Revenue ({reportYear})</h3>
          <div className="admin-popup">
            <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
          </div>
          <div className="filter-controls">
            <label>Report Filter:</label>
            <select value={reportFilter} onChange={(e) => setReportFilter(e.target.value)}>
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>

            {reportFilter === 'yearly' && (
              <>
                <div>
                  <label >From Year:</label>
                  <DatePicker
                    selected={yearRange.from}
                    onChange={(date) => setYearRange((prev) => ({ ...prev, from: date }))}
                    showYearPicker
                    dateFormat="yyyy"
                  />
                </div>
                <div>
                  <label >To Year:</label>
                  <DatePicker
                    selected={yearRange.to}
                    onChange={(date) => setYearRange((prev) => ({ ...prev, to: date }))}
                    showYearPicker
                    dateFormat="yyyy"
                  />
                </div>
              </>
            )}

            {reportFilter === 'monthly' && (
              <>
                <div>
                  <label >From Month:</label>
                  <DatePicker
                    selected={monthRange.from}
                    onChange={(date) => setMonthRange((prev) => ({ ...prev, from: date }))}
                    showMonthYearPicker
                    dateFormat="MM/yyyy"
                  />
                </div>
                <div>
                  <label >To Month:</label>
                  <DatePicker
                    selected={monthRange.to}
                    onChange={(date) => setMonthRange((prev) => ({ ...prev, to: date }))}
                    showMonthYearPicker
                    dateFormat="MM/yyyy"
                  />
                </div>
              </>
            )}

            {reportFilter === 'weekly' && (
              <div>
                <label >Select Week:</label>
                <DatePicker
                  selected={weekDate}
                  onChange={(date) => setWeekDate(date)}
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            )}

            <button className='reprt-revenue-filter' onClick={handleFilterClick}>Filter</button>
          </div>

          <div className="bar-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(monthlyRevenue).map(([key, value]) => ({ name: key, revenue: value }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickFormatter={(value) => {
                    try {
                      if (reportFilter === 'yearly') {
                        return value; // e.g., 2021, 2022, 2023
                      }

                      if (reportFilter === 'monthly') {
                        return format(new Date(reportYear, parseInt(value) - 1), 'MMM, yy');
                      }

                      if (reportFilter === 'weekly') {
                        const match = value.match(/\((\d{2} \w+ \d{4})\)/);
                        if (match) {
                          const dateStr = match[1];
                          const dateParts = dateStr.split(" ");
                          return `${dateParts[0]} ${dateParts[1]} ${dateParts[2].slice(-2)}`;
                        }
                        return value;
                      }
                    } catch {
                      return value;
                    }
                  }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pie-chart-box">
          <h3 >Order Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="product-boxes">
        <div className="top-products">
          <h3>Top 5 Products</h3>
          <ul>
            {topProducts.map(p => (
              <li key={p.product_id}>{p.product_name}  {p.total_sold}</li>
            ))}
          </ul>
        </div>

        <div className="bottom-products">
          <h3>Bottom 5 Products</h3>
          <p>Coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerReports;

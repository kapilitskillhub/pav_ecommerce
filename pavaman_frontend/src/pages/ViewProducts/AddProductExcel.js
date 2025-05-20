import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddProductsExcel.css';
import { useLocation, useNavigate } from 'react-router-dom';

const AddProductExcel = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [excelFile, setExcelFile] = useState(null);
  const [images, setImages] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [adminId, setAdminId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const state = location.state;

    if (state && state.admin_id && state.category_id && state.sub_category_id) {
      setAdminId(state.admin_id);
      setCategoryId(state.category_id);
      setSubCategoryId(state.sub_category_id);
    } else {
      setMessage("Missing required information. Redirecting...");
      setTimeout(() => {
        navigate("/view-products");
      }, 2000);
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!excelFile || !adminId || !categoryId || !subCategoryId) {
      setMessage("Missing required fields.");
      return;
    }

    const formData = new FormData();
    formData.append('excel_file', excelFile);
    formData.append('admin_id', adminId);
    formData.append('category_id', categoryId);
    formData.append('sub_category_id', subCategoryId);
    images.forEach(file => formData.append('images[]', file));
    materials.forEach(file => formData.append('materials[]', file));

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload-products-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(response.data.message || "Upload success!");
    } catch (error) {
      setMessage(error.response?.data?.error || "Upload failed.");
    }
  };

  return (
    <div className="excel-upload-box">
      <h2 className="excel-upload-heading">Upload Product Excel</h2>
      <form onSubmit={handleSubmit}>
        <div className="excel-upload-form-group">
          <label className="excel-upload-label">Select Excel File</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setExcelFile(e.target.files[0])}
            className="excel-upload-input"
            required
          />
        </div>

        <div className="excel-upload-form-group">
          <label className="excel-upload-label">Upload Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files))}
            className="excel-upload-input"
          />
        </div>

        <div className="excel-upload-form-group">
          <label className="excel-upload-label">Upload Materials</label>
          <input
            type="file"
            multiple
            onChange={(e) => setMaterials(Array.from(e.target.files))}
            className="excel-upload-input"
          />
        </div>

        <input type="hidden" name="admin_id" value={adminId} />
        <input type="hidden" name="category_id" value={categoryId} />
        <input type="hidden" name="sub_category_id" value={subCategoryId} />

        <div className="discount-button-group">
          <button type="submit" className="excel-upload-button">Upload</button>
        </div>
      </form>

      {message && <p className="excel-upload-message">{message}</p>}
    </div>
  );
};

export default AddProductExcel;

import { useState, useEffect } from 'react';
import axios from 'axios';
import './AddProductsExcel.css';
import { useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from "../../config";

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
  const [messageType, setMessageType] = useState('');
  const [uploadedProducts, setUploadedProducts] = useState([]);

  useEffect(() => {
    const state = location.state;

    if (state && state.admin_id && state.category_id && state.sub_category_id) {
      setAdminId(state.admin_id);
      setCategoryId(state.category_id);
      setSubCategoryId(state.sub_category_id);
    } else {
      setMessage("Missing required information. Redirecting...");
      setMessageType("error");
      setTimeout(() => {
        navigate("/view-products");
      }, 2000);
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!excelFile || !adminId || !categoryId || !subCategoryId) {
      setMessage("Missing required fields.");
      setMessageType("error");
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
      const response = await axios.post(`${API_BASE_URL}/upload-products-excel`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(response.data.message || "Upload success!");
      setMessageType("success");

      setTimeout(() => {
        navigate("/view-products", {
          state: {
            admin_id: adminId,
            category_id: categoryId,
            sub_category_id: subCategoryId
          }
        });
      }, 3000);
    } 
  
catch (error) {
  const data = error.response?.data;
  if (data) {
    if (data.error && data.products) {
      setMessage(`${data.error} Uploaded products count: ${data.products.length}`);
      setUploadedProducts(data.products);
      setMessageType("error");
    } else if (data.error) {
      setMessage(data.error);
      setMessageType("error");
    } else {
      setMessage("Upload failed.");
      setMessageType("error");
    }
  } else {
    setMessage("Upload failed.");
    setMessageType("error");
  }
  setExcelFile(null);
  setImages([]);
  setMaterials([]);
  const fileInputs = document.querySelectorAll("input[type='file']");
  fileInputs.forEach(input => input.value = '');
}
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="excel-upload-box">
      <h2 className="excel-upload-heading">Upload Product Excel</h2>

      {message && (
        <p className={`excel-upload-message ${messageType === 'error' ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      {uploadedProducts.length > 0 && (
        <div className="uploaded-products-list">
          <h3>Uploaded Products:</h3>
          <ul>
            {uploadedProducts.map((prod, index) => (
              <li key={index}>{prod.product_name}</li>
            ))}
          </ul>
        </div>
      )}
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
    </div>
  );
};

export default AddProductExcel;
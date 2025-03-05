import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from 'react';

import Header from './components/Header/Header';
import SideMenu from './components/SideMenu/SideMenu';
import AddCategory from "./pages/AddCategory/AddCategory";
import EditCategory from './pages/EditCategory/EditCategory';
import SignIn from './components/SignIn/Signin';
import ViewCategories from './pages/ViewCategories/ViewCategories';
import ViewSubcategories from './pages/ViewSubCategories/ViewSubCategories';
import AddSubCategory from './pages/AddSubCategory/AddSubCategory';
import AddProduct from './pages/AddProduct/AddProduct';
import ViewProducts from './pages/ViewProducts/ViewProducts';
import ViewProductDetails from './pages/ViewMoreProductDetails/ViewMoreProductDetails';
import AddSpecification from './pages/AddSpecifications/AddSpecifications';
import EditSpecification from './pages/EditSpecifications/EditSpecifications';
import EditSubcategory from './pages/EditSubCategory/EditSubCategory';
import EditProduct from './pages/EditProduct/EditProduct';
import Dashboard from './pages/Dashboard/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => { 
    const adminData = sessionStorage.getItem("adminData"); 
    if (adminData) { 
      setIsAuthenticated(true); 
    }
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* If not authenticated, show only SignIn page */}
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <SignIn setIsAuthenticated={setIsAuthenticated} />
            }
          />
          
          {/* Prevent unauthorized access to other routes */}
          {!isAuthenticated && <Route path="*" element={<Navigate to="/" />} />}
        </Routes>

        {/* Render header and layout only if authenticated */}
        {isAuthenticated && (
          <>
            <Header setIsAuthenticated={setIsAuthenticated} setCategories={setCategories} setSubcategories={setSubcategories} setProducts={setProducts} />
            
            <div className="main-layout">
              <div className="side-menu-container">
              <SideMenu setIsAuthenticated={setIsAuthenticated} />
              </div>
              <div className="content">
                <Routes>
                  <Route path='/dashboard' element={<Dashboard/>}/>
                  <Route path="/add-category" element={<AddCategory />} />
                  <Route path="/edit-category" element={<EditCategory />} />
                  <Route path="/view-categories" element={<ViewCategories categories={categories} setCategories={setCategories} setSubcategories={setSubcategories} />} />
                  <Route path="/view-subcategories" element={<ViewSubcategories subcategories={subcategories} setSubcategories={setSubcategories} />} />
                  <Route path="/add-subcategory" element={<AddSubCategory />} />
                  <Route path="/view-products" element={<ViewProducts products={products} setProducts={setProducts} />} />
                  <Route path="/add-product" element={<AddProduct />} />
                  <Route path="/view-product-details" element={<ViewProductDetails />} />
                  <Route path="/add-product-specifications" element={<AddSpecification />} />
                  <Route path="/edit-product-specifications" element={<EditSpecification />} />
                  <Route path="/edit-subcategory" element={<EditSubcategory />} />
                  <Route path="/edit-product" element={<EditProduct />} />
                  {/* <Route path="*" element={<Navigate to="/dashboard" />} /> */}
                </Routes>
              </div>
            </div>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
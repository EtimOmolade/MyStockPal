import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ProductList from "./ProductList";
import RecordSales from "./RecordSales";
import RecordDamages from "./RecordDamages";
import Dashboard from "./Dashboard";
import ArchivedProducts from "./ArchivedProducts";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";
import StockHistory from "./StockHistory";
import "./App.css";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") setDarkMode(true);
  }, []);

  // Apply theme on toggle
  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "";
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <Router>
      <nav>
        
  <div className="logo">MyStockPal</div>
        <div className="nav-links">
          <Link to="/">Products</Link> |{" "}
          <Link to="/add-product">Add Product</Link> |{" "}
          <Link to="/sales">Record Sales</Link> |{" "}
          <Link to="/damages">Record Damages</Link> |{" "}
          <Link to="/archived-products">Archived Products</Link> |{" "}
          <Link to="/history">History</Link> |{" "}
          <Link to="/dashboard">Dashboard</Link>
        </div>

        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
      </nav>

      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/edit/:id" element={<EditProduct />} />
        <Route path="/sales" element={<RecordSales />} />
        <Route path="/damages" element={<RecordDamages />} />
        <Route path="/archived-products" element={<ArchivedProducts />} />
        <Route path="/history" element={<StockHistory />} /> 
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

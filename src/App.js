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
import ProductView from "./ProductView";
import StockHistoryDetails from "./StockHistoryDetails";
import DashboardDetails from "./DashboardDetails";
import "./App.css";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        <div className="nav-left">
          <div className="logo">MyStockPal</div>

          {/* Hamburger icon */}
          <div
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        {/* Navigation links */}
        <div className={`nav-links ${menuOpen ? "show" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Products</Link>
          <Link to="/add-product" onClick={() => setMenuOpen(false)}>Add Product</Link>
          <Link to="/sales" onClick={() => setMenuOpen(false)}>Record Sales</Link>
          <Link to="/damages" onClick={() => setMenuOpen(false)}>Record Damages</Link>
          <Link to="/archived-products" onClick={() => setMenuOpen(false)}>Archived Products</Link>
          <Link to="/history" onClick={() => setMenuOpen(false)}>History</Link>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
        </div>

        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
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
        <Route path="/product/:id" element={<ProductView />} />
<Route path="/stock-history/:id" element={<StockHistoryDetails />} />
<Route path="/dashboard/:id" element={<DashboardDetails />} />
      </Routes>
    </Router>
  );
}

export default App;

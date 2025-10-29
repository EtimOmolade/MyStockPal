import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ProductList from "./Product/ProductList";
import RecordSales from "./Navbars/RecordSales";
import RecordDamages from "./Navbars/RecordDamages";
import Dashboard from "./Dashboard/Dashboard";
import ArchivedProducts from "./Navbars/ArchivedProducts";
import AddProduct from "./Navbars/AddProduct";
import EditProduct from "./Product/EditProduct";
import StockHistory from "./History/StockHistory";
import ProductView from "./Product/ProductView";
import StockHistoryDetails from "./History/StockHistoryDetails";
import DashboardDetails from "./Dashboard/DashboardDetails";
import "./App.css";

import Login from "./Authentication/Login";
import Signup from "./Authentication/Signup";
import ProtectedRoute from "./Authentication/ProtectedRoute";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "";
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <Router>
      <nav>
        <div className="nav-left">
          <div className="logo">MyStockPal</div>
          <div
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span><span></span><span></span>
          </div>
        </div>

        <div className={`nav-links ${menuOpen ? "show" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Products</Link>
          <Link to="/add-product" onClick={() => setMenuOpen(false)}>Add Product</Link>
          <Link to="/sales" onClick={() => setMenuOpen(false)}>Record Sales</Link>
          <Link to="/damages" onClick={() => setMenuOpen(false)}>Record Damages</Link>
          <Link to="/archived-products" onClick={() => setMenuOpen(false)}>Archived Products</Link>
          <Link to="/history" onClick={() => setMenuOpen(false)}>History</Link>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
        </div>

        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>

        <button className="logout-btn" onClick={() => signOut(auth).then(() => alert("Logged out!"))}>
          🚪 Logout
        </button>
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/add-product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><RecordSales /></ProtectedRoute>} />
        <Route path="/damages" element={<ProtectedRoute><RecordDamages /></ProtectedRoute>} />
        <Route path="/archived-products" element={<ProtectedRoute><ArchivedProducts /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><StockHistory /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProtectedRoute><ProductView /></ProtectedRoute>} />
        <Route path="/stock-history/:id" element={<ProtectedRoute><StockHistoryDetails /></ProtectedRoute>} />
        <Route path="/dashboard/:id" element={<ProtectedRoute><DashboardDetails /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;

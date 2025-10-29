// src/ArchivedProducts.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

function ArchivedProducts() {
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null); // ✅ For "More" toggle
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ✅ Handle resize for responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Fetch archived products
  useEffect(() => {
    fetchArchivedProducts();
  }, []);

  const fetchArchivedProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "products"), where("archived", "==", true));
      const querySnapshot = await getDocs(q);
      const archived = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setArchivedProducts(archived.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error("Error fetching archived products:", err);
      alert("❌ Failed to load archived products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Restore (unarchive) a product
  const handleUnarchive = async (id) => {
    if (window.confirm("Restore this product to active inventory?")) {
      try {
        const productRef = doc(db, "products", id);
        await updateDoc(productRef, {
          archived: false,
          lastUpdated: serverTimestamp(),
        });
        setArchivedProducts((prev) => prev.filter((p) => p.id !== id));
        alert("✅ Product restored successfully!");
      } catch (error) {
        console.error("Error restoring product:", error);
        alert("❌ Failed to restore product.");
      }
    }
  };

  // ✅ Format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "—";
    if (timestamp.seconds)
      return new Date(timestamp.seconds * 1000).toLocaleString();
    if (typeof timestamp.toDate === "function")
      return timestamp.toDate().toLocaleString();
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  return (
    <div className="inventory-page">
      <h2>🗃️ Archived Products</h2>
      <p style={{ fontSize: "14px", color: "#777" }}>
        Showing archived records as of:{" "}
        <strong>{new Date().toDateString()}</strong>
      </p>

      {loading ? (
        <p>Loading archived products...</p>
      ) : archivedProducts.length === 0 ? (
        <p>No archived products found.</p>
      ) : (
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Stock</th>
                <th>Sold</th>
                <th className="hide-mobile">Damaged</th>
                <th className="hide-mobile">Price</th>
                <th className="hide-mobile">Amount</th>
                <th className="hide-mobile">Date Added</th>
                <th className="hide-mobile">Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {archivedProducts.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.total || 0}</td>
                  <td>{p.sold || 0}</td>
                  <td className="hide-mobile">{p.damaged || 0}</td>
                  <td className="hide-mobile">₦{p.price || 0}</td>
                  <td className="hide-mobile">
                    ₦{(p.amount || 0).toLocaleString()}
                  </td>
                  <td className="hide-mobile">{formatTimestamp(p.dateAdded)}</td>
                  <td className="hide-mobile">{formatTimestamp(p.lastUpdated)}</td>

                  <td>
                    {/* ✅ Responsive action section */}
                    {isMobile ? (
                      <div>
                        {expandedRow === p.id ? (
                          <div className="expanded-actions">
                            <Link to={`/product/${p.id}`}>
                              <button className="view-btn">View</button>
                            </Link>
                            <button
                              className="unarchive-btn"
                              onClick={() => handleUnarchive(p.id)}
                            >
                              Restore
                            </button>
                            <button
                              className="more-btn"
                              onClick={() => setExpandedRow(null)}
                            >
                              Close
                            </button>
                          </div>
                        ) : (
                          <button
                            className="more-btn"
                            onClick={() => setExpandedRow(p.id)}
                          >
                            More
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <Link to={`/product/${p.id}`}>
                          <button className="view-btn">View</button>
                        </Link>
                        <button
                          className="unarchive-btn"
                          onClick={() => handleUnarchive(p.id)}
                        >
                          Restore
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <Link to="/">
          <button className="btn-primary" style={{ marginTop: "10px" }}>
            ⬅ Back to Products
          </button>
        </Link>
      </div>
    </div>
  );
}

export default ArchivedProducts;

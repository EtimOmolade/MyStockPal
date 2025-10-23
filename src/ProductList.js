// src/ProductList.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebase";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [updateQty, setUpdateQty] = useState({}); // store qty input for each product

  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch products from Firestore
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const activeProducts = productList.filter((p) => !p.archived);
      const sortedProducts = activeProducts.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setProducts(sortedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // Archive / Unarchive product
  const handleArchive = async (id, currentStatus) => {
    const confirmMsg = currentStatus
      ? "Unarchive this product?"
      : "Archive this product? It will no longer show in the product list.";

    if (window.confirm(confirmMsg)) {
      try {
        const productRef = doc(db, "products", id);
        await updateDoc(productRef, { archived: !currentStatus });
        fetchProducts();
      } catch (error) {
        console.error("Error updating archive status:", error);
      }
    }
  };

  // Update stock quantity
  const handleUpdateStock = async (productId, productName) => {
    const qty = parseInt(updateQty[productId]);
    if (isNaN(qty) || qty === 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    try {
      const productRef = doc(db, "products", productId);

      const product = products.find((p) => p.id === productId);
      if (!product) return;

      // Update total stock
      await updateDoc(productRef, {
        total: (product.total || 0) + qty,
        lastUpdated: serverTimestamp(),
      });

      // Record in history
      await addDoc(collection(db, "history"), {
        productId,
        product: productName,
        quantity: qty,
        action: qty > 0 ? "Stock Added" : "Stock Removed",
        date: serverTimestamp(),
        note: qty > 0 ? `Added ${qty} units` : `Removed ${Math.abs(qty)} units`,
      });

      setUpdateQty({ ...updateQty, [productId]: "" });
      fetchProducts();
      alert("✅ Stock updated successfully!");
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("❌ Could not update stock.");
    }
  };

  // Format Firestore timestamps for display
  const formatTimestamp = (ts) => {
    if (!ts) return "—";

    // Firestore timestamp object
    if (ts.seconds && typeof ts.seconds === "number") {
      const d = new Date(
        ts.seconds * 1000 + (ts.nanoseconds ? Math.round(ts.nanoseconds / 1e6) : 0)
      );
      return d.toLocaleString();
    }

    // Timestamp with toDate()
    if (typeof ts.toDate === "function") {
      try {
        return ts.toDate().toLocaleString();
      } catch {
        return "—";
      }
    }

    // Already a Date object or string
    const d = new Date(ts);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  return (
    <div className="table-container">
      <h2>📦 Product Inventory</h2>

      {products.length === 0 ? (
        <p>No products found. Add some!</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Total</th>
              <th>Sold</th>
              <th>Damaged</th>
              <th>Remaining</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Date Added</th>
              <th>Last Updated</th>
              <th>Update Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const remaining = (p.total || 0) - ((p.sold || 0) + (p.damaged || 0));
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.total}</td>
                  <td>{p.sold}</td>
                  <td>{p.damaged}</td>
                  <td>{remaining < 0 ? 0 : remaining}</td>
                  <td>₦{p.price}</td>
                  <td>₦{p.amount?.toLocaleString()}</td>
                  <td>{formatTimestamp(p.dateAdded)}</td>
                  <td>{formatTimestamp(p.lastUpdated)}</td>
                  <td>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={updateQty[p.id] || ""}
                      onChange={(e) =>
                        setUpdateQty({ ...updateQty, [p.id]: e.target.value })
                      }
                      style={{ width: "80px" }}
                    />
                    <button
                      onClick={() => handleUpdateStock(p.id, p.name)}
                      style={{ marginLeft: "5px", padding: "5px 10px" }}
                    >
                      Update
                    </button>
                  </td>
                  <td>
                    <Link to={`/edit/${p.id}`}>
                      <button className="edit-btn">Edit</button>
                    </Link>
                    <button
                      className="archive-btn"
                      onClick={() => handleArchive(p.id, p.archived)}
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProductList;

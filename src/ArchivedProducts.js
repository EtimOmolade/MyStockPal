import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, doc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";

function ArchivedProducts() {
  const [archivedProducts, setArchivedProducts] = useState([]);

  useEffect(() => {
    fetchArchivedProducts();
  }, []);

  const fetchArchivedProducts = async () => {
    try {
      const q = query(collection(db, "products"), where("archived", "==", true));
      const querySnapshot = await getDocs(q);
      const archived = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setArchivedProducts(archived);
    } catch (err) {
      console.error("Error fetching archived products:", err);
    }
  };

  const handleUnarchive = async (id) => {
    if (window.confirm("Restore this product to active inventory?")) {
      try {
        const productRef = doc(db, "products", id);
        await updateDoc(productRef, {
          archived: false,
          lastUpdated: serverTimestamp(), // ✅ Firestore timestamp
        });
        fetchArchivedProducts(); // refresh list
        alert("✅ Product restored successfully!");
      } catch (error) {
        console.error("Error unarchiving product:", error);
        alert("❌ Failed to restore product.");
      }
    }
  };

  // Helper to display Firestore timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "—";
    if (timestamp.toDate) return timestamp.toDate().toLocaleString();
    return timestamp;
  };

  return (
    <div className="table-container">
      <h2>🗃️ Archived Products</h2>

      {archivedProducts.length === 0 ? (
        <p>No archived products found.</p>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {archivedProducts.map((p) => {
              const remaining = (p.total || 0) - ((p.sold || 0) + (p.damaged || 0));
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.total}</td>
                  <td>{p.sold}</td>
                  <td>{p.damaged}</td>
                  <td>{remaining < 0 ? 0 : remaining}</td>
                  <td>₦{p.price}</td>
                  <td>₦{p.amount}</td>
                  <td>{formatTimestamp(p.dateAdded)}</td>
                  <td>{formatTimestamp(p.lastUpdated)}</td>
                  <td>
                    <button className="unarchive-btn" onClick={() => handleUnarchive(p.id)}>
                      Restore
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

export default ArchivedProducts;

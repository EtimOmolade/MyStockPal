import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase"; // ✅ make sure firebase.js is set up

function ProductList() {
  const [products, setProducts] = useState([]);

  // ✅ Fetch products from Firestore
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Only show non-archived products
      const activeProducts = productList.filter((p) => !p.archived);
      setProducts(activeProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // ✅ Archive or Unarchive product
  const handleArchive = async (id, currentStatus) => {
    const confirmMsg = currentStatus
      ? "Unarchive this product?"
      : "Archive this product? It will no longer show in the product list.";

    if (window.confirm(confirmMsg)) {
      try {
        const productRef = doc(db, "products", id);
        await updateDoc(productRef, { archived: !currentStatus });
        fetchProducts(); // refresh list
      } catch (error) {
        console.error("Error updating archive status:", error);
      }
    }
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
                  <td>{p.dateAdded || "—"}</td>
                  <td>{p.lastUpdated || "—"}</td>
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

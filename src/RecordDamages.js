import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebase"; // ✅ import Firestore instance

function RecordDamages() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [damagedQty, setDamagedQty] = useState("");

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
      setProducts(productList);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // ✅ Record damaged products
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProductId || !damagedQty) {
      alert("Please fill in all fields!");
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) {
      alert("Product not found!");
      return;
    }

    if (parseInt(damagedQty) > product.total) {
      alert("❌ Quantity exceeds available stock!");
      return;
    }

    const now = new Date().toLocaleString();

    const updatedProduct = {
      ...product,
      damaged: (product.damaged || 0) + parseInt(damagedQty),
      total: product.total - parseInt(damagedQty),
      lastUpdated: now,
    };

    try {
      // ✅ Update product in Firestore
      const productRef = doc(db, "products", selectedProductId);
      await updateDoc(productRef, updatedProduct);

      // ✅ Record history in Firestore
      await addDoc(collection(db, "history"), {
        date: now,
        product: product.name,
        action: "Damage",
        quantity: parseInt(damagedQty),
        note: `Damaged quantity: ${damagedQty}`,
      });

      alert("✅ Damage recorded successfully!");
      setDamagedQty("");
      setSelectedProductId("");
      fetchProducts(); // refresh list
    } catch (error) {
      console.error("Error updating product:", error);
      alert("❌ Failed to record damage");
    }
  };

  return (
    <div className="form-container">
      <h2>Record Damaged Products</h2>

      <form onSubmit={handleSubmit}>
        <label>Select Product:</label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          required
        >
          <option value="">-- Select a product --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <label>Quantity Damaged:</label>
        <input
          type="number"
          value={damagedQty}
          onChange={(e) => setDamagedQty(e.target.value)}
          required
        />

        <button type="submit" className="btn-primary">
          Record Damage
        </button>
      </form>

      <div style={{ textAlign: "center" }}>
        <Link to="/">
          <button className="btn-primary" style={{ marginTop: "10px" }}>
            ⬅ Back to Products
          </button>
        </Link>
      </div>
    </div>
  );
}

export default RecordDamages;

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

function RecordDamages() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantityType, setQuantityType] = useState("unit"); // "unit" or "pack"
  const [damagedQty, setDamagedQty] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Fetch all products when component mounts
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
      console.error("🔥 Error fetching products:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProductId || !damagedQty) {
      alert("⚠️ Please fill in all fields!");
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) {
      alert("❌ Product not found!");
      return;
    }

    let qty = parseInt(damagedQty, 10);
    if (isNaN(qty) || qty <= 0) {
      alert("⚠️ Enter a valid quantity!");
      return;
    }

    // ✅ Convert packs to units
    if (quantityType === "pack" && product.itemsPerPack) {
      qty *= product.itemsPerPack;
    }

    if (qty > product.total) {
      alert("❌ Quantity exceeds available stock!");
      return;
    }

    setLoading(true);

    try {
      const productRef = doc(db, "products", selectedProductId);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const currentData = productSnap.data();

        // ✅ Update Firestore product
        await updateDoc(productRef, {
          damaged: (currentData.damaged || 0) + qty,
          total: (currentData.total || 0) - qty,
          lastUpdated: serverTimestamp(),
        });

        // ✅ Record action in history
        await addDoc(collection(db, "history"), {
          productId: selectedProductId,
          product: currentData.name,
          action: "Damaged",
          quantity: qty,
          recordedBy: auth.currentUser?.email || "Unknown",
          date: serverTimestamp(),
          note: `🧯 Damaged ${qty} ${quantityType}(s)`,
        });

        alert(`✅ ${qty} ${quantityType}(s) recorded as damaged for ${currentData.name}`);
        setDamagedQty("");
        setSelectedProductId("");
        setQuantityType("unit");

        // ✅ Refresh product list
        await fetchProducts();
      } else {
        alert("❌ Product no longer exists in database.");
      }
    } catch (error) {
      console.error("🔥 Error recording damage:", error);
      alert("❌ Failed to record damage. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>🧯 Record Damaged Products</h2>

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

        <label>Quantity Type:</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="quantityType"
              value="unit"
              checked={quantityType === "unit"}
              onChange={() => setQuantityType("unit")}
            />{" "}
            Unit
          </label>
          <label>
            <input
              type="radio"
              name="quantityType"
              value="pack"
              checked={quantityType === "pack"}
              onChange={() => setQuantityType("pack")}
            />{" "}
            Pack
          </label>
        </div>

        <label>Quantity Damaged:</label>
        <input
          type="number"
          value={damagedQty}
          onChange={(e) => setDamagedQty(e.target.value)}
          required
          min="1"
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Recording..." : "Record Damage"}
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

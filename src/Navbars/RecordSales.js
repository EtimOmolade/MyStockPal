// src/RecordSales.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

function RecordSales() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([
    { productId: "", quantity: "", saleType: "unit", amount: 0 },
  ]); // ✅ Starts with 1 row by default
  const [paymentMethod, setPaymentMethod] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  // ✅ Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  // ✅ Handle adding a new product row
  const handleAddProduct = () => {
    setSelectedProducts([
      ...selectedProducts,
      { productId: "", quantity: "", saleType: "unit", amount: 0 },
    ]);
  };

  // ✅ Handle removing a product row
  const handleRemoveProduct = (index) => {
    const updated = [...selectedProducts];
    updated.splice(index, 1);
    setSelectedProducts(updated);
    recalculateTotal(updated);
  };

  // ✅ Handle changes in product selection or quantity
  const handleChange = (index, field, value) => {
    const updated = [...selectedProducts];
    updated[index][field] = value;

    const selectedProduct = products.find(
      (p) => p.id === updated[index].productId
    );

    if (selectedProduct && field !== "amount") {
      const qty =
        updated[index].saleType === "pack"
          ? (value && field === "quantity"
              ? value * (selectedProduct.itemsPerPack || 1)
              : updated[index].quantity * (selectedProduct.itemsPerPack || 1))
          : parseInt(updated[index].quantity || 0, 10);

      updated[index].amount = selectedProduct.price * (qty || 0);
    }

    setSelectedProducts(updated);
    recalculateTotal(updated);
  };

  // ✅ Recalculate total amount
  const recalculateTotal = (list) => {
    const total = list.reduce((sum, item) => sum + (item.amount || 0), 0);
    setTotalAmount(total);
  };

  // ✅ Submit multiple product sales
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProducts.length || !paymentMethod) {
      alert("Please fill out the form completely!");
      return;
    }

    try {
      for (const item of selectedProducts) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;

        const qty =
          item.saleType === "pack"
            ? item.quantity * (product.itemsPerPack || 1)
            : parseInt(item.quantity, 10);

        if (qty > product.total) {
          alert(`❌ Not enough stock for ${product.name}!`);
          return;
        }

        // 🔹 Update product stock
        const productRef = doc(db, "products", product.id);
        await updateDoc(productRef, {
          total: (product.total || 0) - qty,
          sold: (product.sold || 0) + qty,
          lastUpdated: serverTimestamp(),
        });

        // 🔹 Add to history
        await addDoc(collection(db, "history"), {
          productId: product.id,
          product: product.name,
          quantity: qty,
          saleType: item.saleType,
          action: "Sold",
          payment: paymentMethod,
          date: serverTimestamp(),
          note:
            item.saleType === "pack"
              ? `${item.quantity} pack(s) (${qty} units) sold at ₦${product.price} each`
              : `${qty} unit(s) sold at ₦${product.price} each`,
        });
      }

      alert("✅ Sale(s) recorded successfully!");

      // 🔄 Reset form
      setSelectedProducts([
        { productId: "", quantity: "", saleType: "unit", amount: 0 },
      ]);
      setPaymentMethod("");
      setTotalAmount(0);

      // 🔄 Refresh product list
      const refreshed = await getDocs(collection(db, "products"));
      setProducts(refreshed.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error recording sales:", error);
      alert("❌ Could not record sale, please try again.");
    }
  };

  return (
    <div className="form-container">
      <h2>🛒 Record Sales</h2>

      <form onSubmit={handleSubmit}>
        {selectedProducts.map((item, index) => (
          <div key={index} className="sale-row">
            <label>Product {index + 1}:</label>
            <select
              value={item.productId}
              onChange={(e) =>
                handleChange(index, "productId", e.target.value)
              }
              required
            >
              <option value="">-- Select a product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <label>Sale Type:</label>
            <select
              value={item.saleType}
              onChange={(e) => handleChange(index, "saleType", e.target.value)}
            >
              <option value="unit">Single Unit</option>
              <option value="pack">Pack</option>
            </select>

            <label>
              Quantity ({item.saleType === "pack" ? "Packs" : "Units"}):
            </label>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => handleChange(index, "quantity", e.target.value)}
              min="1"
              required
            />

            <label>Amount:</label>
            <input
              type="text"
              value={item.amount ? `₦${item.amount}` : ""}
              readOnly
            />

            {selectedProducts.length > 1 && (
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemoveProduct(index)}
              >
                ❌ Remove
              </button>
            )}
            <hr />
          </div>
        ))}

        <button
          type="button"
          className="btn-secondary"
          onClick={handleAddProduct}
        >
          ➕ Add Another Product
        </button>

        <label>Payment Method:</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        >
          <option value="">-- Select payment method --</option>
          <option value="cash">Cash</option>
          <option value="transfer">Transfer</option>
          <option value="pos">POS</option>
        </select>

        <h3>Total Amount: ₦{totalAmount.toLocaleString()}</h3>

        <button type="submit" className="btn-primary">
          Record Sale
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

export default RecordSales;

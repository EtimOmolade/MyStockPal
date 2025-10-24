import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "./firebase";
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
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantitySold, setQuantitySold] = useState("");
  const [saleType, setSaleType] = useState("unit"); // ✅ "unit" or "pack"
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");

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

  // ✅ Auto-calculate amount when inputs change
  useEffect(() => {
    const product = products.find((p) => p.name === selectedProduct);
    if (product && quantitySold) {
      const qty =
        saleType === "pack"
          ? quantitySold * (product.itemsPerPack || 1)
          : parseInt(quantitySold, 10);
      setAmount(product.price * qty);
    } else {
      setAmount("");
    }
  }, [selectedProduct, quantitySold, saleType, products]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProduct || !quantitySold || !paymentMethod) {
      alert("Please fill in all fields!");
      return;
    }

    const product = products.find((p) => p.name === selectedProduct);
    if (!product) {
      alert("Product not found!");
      return;
    }

    const qty =
      saleType === "pack"
        ? quantitySold * (product.itemsPerPack || 1)
        : parseInt(quantitySold, 10);

    if (qty > product.total) {
      alert("❌ Not enough stock available!");
      return;
    }

    try {
      // 🔹 Update product stock
      const productRef = doc(db, "products", product.id);
      await updateDoc(productRef, {
        total: (product.total || 0) - qty,
        sold: (product.sold || 0) + qty,
        lastUpdated: serverTimestamp(),
      });

      // 🔹 Add record to history
      await addDoc(collection(db, "history"), {
        productId: product.id,
        product: product.name,
        quantity: qty,
        saleType,
        action: "Sold",
        payment: paymentMethod,
        date: serverTimestamp(),
        note:
          saleType === "pack"
            ? `${quantitySold} pack(s) (${qty} units) sold at ₦${product.price} each`
            : `${qty} single unit(s) sold at ₦${product.price} each`,
      });

      alert("✅ Sale recorded successfully!");

      // 🔄 Reset form
      setQuantitySold("");
      setSelectedProduct("");
      setPaymentMethod("");
      setSaleType("unit");
      setAmount("");

      // 🔄 Refresh product list
      const refreshed = await getDocs(collection(db, "products"));
      setProducts(refreshed.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error recording sale:", error);
      alert("❌ Could not record sale, please try again.");
    }
  };

  return (
    <div className="form-container">
      <h2>🛒 Record Sales</h2>

      <form onSubmit={handleSubmit}>
        <label>Select Product:</label>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          required
        >
          <option value="">-- Select a product --</option>
          {products.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        <label>Sale Type:</label>
        <select
          value={saleType}
          onChange={(e) => setSaleType(e.target.value)}
          required
        >
          <option value="unit">Single Unit</option>
          <option value="pack">Pack</option>
        </select>

        <label>Quantity Sold ({saleType === "pack" ? "Packs" : "Units"}):</label>
        <input
          type="number"
          value={quantitySold}
          onChange={(e) => setQuantitySold(e.target.value)}
          required
          min="1"
        />

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

        <label>Amount:</label>
        <input type="text" value={amount ? `₦${amount}` : ""} readOnly />

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

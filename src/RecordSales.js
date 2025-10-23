import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "./firebase";
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";

function RecordSales() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantitySold, setQuantitySold] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");

  // Fetch products from Firebase
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

  // Auto-calculate amount
  useEffect(() => {
    const product = products.find((p) => p.name === selectedProduct);
    if (product && quantitySold) {
      setAmount(product.price * quantitySold);
    } else {
      setAmount("");
    }
  }, [selectedProduct, quantitySold, products]);

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

    if (quantitySold > product.total) {
      alert("❌ Not enough stock available!");
      return;
    }

    const qty = parseInt(quantitySold);

    try {
      // Update the product in Firebase
      const productRef = doc(db, "products", product.id);
      await updateDoc(productRef, {
        sold: (product.sold || 0) + qty,
        total: (product.total || 0) - qty,
        amount: ((product.sold || 0) + qty) * product.price,
        lastUpdated: serverTimestamp(), // ✅ Firestore timestamp
      });

      // Add record to history collection
      await addDoc(collection(db, "history"), {
        productId: product.id,
        product: product.name,
        action: "Sale",
        quantity: qty,
        payment: paymentMethod,
        date: serverTimestamp(), // ✅ Firestore timestamp
        note: `₦${product.price} each — total ₦${amount}`,
      });

      alert("✅ Sale recorded successfully!");
      setQuantitySold("");
      setSelectedProduct("");
      setPaymentMethod("");
      setAmount("");

      // Refresh product list
      const refreshed = await getDocs(collection(db, "products"));
      setProducts(refreshed.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error updating product:", error);
      alert("❌ Could not record sale, please try again.");
    }
  };

  return (
    <div className="form-container">
      <h2>Record Sales</h2>

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

        <label>Quantity Sold:</label>
        <input
          type="number"
          value={quantitySold}
          onChange={(e) => setQuantitySold(e.target.value)}
          required
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
        <input type="text" value={amount} readOnly />

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

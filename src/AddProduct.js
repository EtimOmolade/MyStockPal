import React, { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "./firebase"; // ✅ import your Firebase config
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const AddProduct = () => {
  const [product, setProduct] = useState({
    name: "",
    total: "",
    price: "",
  });

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.name || !product.total || !product.price) {
      alert("Please fill in all fields!");
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString();

    const newProduct = {
      name: product.name,
      total: parseInt(product.total),
      price: parseFloat(product.price),
      sold: 0,
      damaged: 0,
      amount: 0,
      dateAdded: `${formattedDate} ${formattedTime}`,
      timestamp: serverTimestamp(), // ✅ Use Firebase server time
    };

    try {
      // ✅ Add product to Firestore
      const productRef = await addDoc(collection(db, "products"), newProduct);

      // ✅ Record in stock history
      await addDoc(collection(db, "history"), {
        productId: productRef.id,
        product: product.name,
        quantity: product.total,
        action: "Stock Added",
        date: serverTimestamp(),
        note: `Added ${product.total} units at ₦${product.price} each`,
      });

      alert("✅ Product added and recorded successfully!");
      setProduct({ name: "", total: "", price: "" });
    } catch (error) {
      console.error("Error adding product:", error);
      alert("❌ Could not add product, please try again.");
    }
  };

  return (
    <div className="form-container">
      <h2>Add New Product</h2>

      <form onSubmit={handleSubmit}>
        <label>Product Name:</label>
        <input
          type="text"
          name="name"
          value={product.name}
          onChange={handleChange}
          placeholder="Enter product name"
          required
        />

        <label>Total Quantity:</label>
        <input
          type="number"
          name="total"
          value={product.total}
          onChange={handleChange}
          placeholder="Enter total quantity"
          required
        />

        <label>Price per Unit:</label>
        <input
          type="number"
          name="price"
          value={product.price}
          onChange={handleChange}
          placeholder="Enter price per unit"
          required
        />

        <button type="submit" className="btn-primary">
          Add Product
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <Link to="/" className="btn-secondary">
          <button className="btn-primary" style={{ marginTop: "10px" }}>
            ⬅ Back to Products
          </button>
        </Link>
      </div>
    </div>
  );
};

export default AddProduct;

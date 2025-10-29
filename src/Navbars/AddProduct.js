import React, { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const AddProduct = () => {
  const [product, setProduct] = useState({
    name: "",
    total: "",
    price: "",
    itemsPerPack: "", // ✅ new field
    hasPack: false, // ✅ to know if the product has packs
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct({
      ...product,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.name || !product.total || !product.price) {
      alert("Please fill in all required fields!");
      return;
    }

    // ✅ Parse numeric values safely
    const totalQty = parseInt(product.total, 10);
    const unitPrice = parseFloat(product.price);
    const itemsPerPack = product.hasPack
      ? parseInt(product.itemsPerPack || 1, 10)
      : null;

    const newProduct = {
      name: product.name.trim(),
      total: totalQty,
      price: unitPrice,
      sold: 0,
      damaged: 0,
      amount: 0,
      hasPack: product.hasPack,
      itemsPerPack: itemsPerPack,
      dateAdded: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    };

    try {
      // 🔹 Add product to Firestore
      const productRef = await addDoc(collection(db, "products"), newProduct);

      // 🔹 Record in stock history
      await addDoc(collection(db, "history"), {
        productId: productRef.id,
        product: product.name,
        quantity: totalQty,
        action: "Stock Added",
        date: serverTimestamp(),
        note: `Added ${totalQty} units${product.hasPack ? ` (${itemsPerPack} per pack)` : ""
          } at ₦${unitPrice} each`,
      });

      alert("✅ Product added and recorded successfully!");
      setProduct({
        name: "",
        total: "",
        price: "",
        itemsPerPack: "",
        hasPack: false,
      });
    } catch (error) {
      console.error("Error adding product:", error);
      alert("❌ Could not add product, please try again.");
    }
  };

  return (
    <div className="form-container">
      <h2>➕ Add New Product</h2>

      <form onSubmit={handleSubmit}>
        {/* Product Name */}
        <label>Product Name:</label>
        <input
          type="text"
          name="name"
          value={product.name}
          onChange={handleChange}
          placeholder="Enter product name"
          required
        />

        {/* Total Quantity */}
        <label>Total Quantity:</label>
        <input
          type="number"
          name="total"
          value={product.total}
          onChange={handleChange}
          placeholder="Enter total quantity"
          required
        />

        {/* Price */}
        <label>Price per Unit (₦):</label>
        <input
          type="number"
          name="price"
          value={product.price}
          onChange={handleChange}
          placeholder="Enter price per unit"
          required
        />

        {/* Pack Option */}
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="hasPack"
            name="hasPack"
            checked={product.hasPack}
            onChange={handleChange}
          />
          <label htmlFor="hasPack">This product is sold in packs</label>
        </div>

        {/* Items per Pack (show only if checkbox is checked) */}
        {product.hasPack && (
          <>
            <label>Number of Items per Pack:</label>
            <input
              type="number"
              name="itemsPerPack"
              value={product.itemsPerPack}
              onChange={handleChange}
              placeholder="Enter number of items in a pack"
              required
            />
          </>
        )}

        <button type="submit" className="btn-primary">
          Add Product
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <Link to="/">
          <button className="btn-primary" style={{ marginTop: "10px" }}>
            ⬅ Back 
          </button>
        </Link>
      </div>
    </div>
  );
};

export default AddProduct;

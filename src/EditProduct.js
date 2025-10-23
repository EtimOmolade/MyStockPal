import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: "",
    total: "",
    price: "",
    sold: 0,
    damaged: 0,
    amount: 0,
  });

  // ✅ Fetch product from Firestore
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct(docSnap.data());
        } else {
          console.error("Product not found");
        }
      } catch (err) {
        console.error("Error loading product:", err);
      }
    };

    fetchProduct();
  }, [id]);

  // ✅ Handle form input
  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  // ✅ Save changes and record history
  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedProduct = {
      ...product,
      total: parseInt(product.total),
      price: parseFloat(product.price),
      amount: (product.sold || 0) * parseFloat(product.price),
      lastUpdated: new Date().toLocaleString(),
    };

    try {
      // ✅ Update product in Firestore
      const docRef = doc(db, "products", id);
      await updateDoc(docRef, updatedProduct);

      // ✅ Add to history collection
      await addDoc(collection(db, "history"), {
        date: new Date().toLocaleString(),
        product: updatedProduct.name,
        action: "Edited Product",
        quantity: updatedProduct.total,
        payment: "—",
        note: `Price updated to ₦${updatedProduct.price}`,
      });

      alert("✅ Product updated successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("❌ Failed to save changes");
    }
  };

  return (
    <div className="form-container">
      <h2>✏️ Edit Product</h2>
      <form onSubmit={handleSubmit}>
        <label>Product Name:</label>
        <input
          type="text"
          name="name"
          value={product.name}
          onChange={handleChange}
          required
        />

        <label>Total Quantity:</label>
        <input
          type="number"
          name="total"
          value={product.total}
          onChange={handleChange}
          required
        />

        <label>Price per Unit:</label>
        <input
          type="number"
          name="price"
          value={product.price}
          onChange={handleChange}
          required
        />

        <button type="submit" className="btn-primary">
          💾 Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProduct;

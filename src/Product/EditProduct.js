import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Link } from "react-router-dom";
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
    hasPack: false,
    itemsPerPack: "",
  });
  const [loading, setLoading] = useState(false);

  // ✅ Fetch product in real-time
  useEffect(() => {
    const docRef = doc(db, "products", id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProduct({
          ...data,
          itemsPerPack: data.itemsPerPack || "",
          hasPack: data.hasPack || false
        });
      } else {
        console.error("Product not found");
      }
    }, (err) => console.error("Error loading product:", err));

    return () => unsubscribe();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct({
      ...product,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const itemsPerPack = product.hasPack
      ? parseInt(product.itemsPerPack || 1, 10)
      : null;

    const updatedProduct = {
      ...product,
      total: parseInt(product.total),
      price: parseFloat(product.price),
      amount: (product.sold || 0) * parseFloat(product.price),
      hasPack: product.hasPack,
      itemsPerPack: itemsPerPack,
      lastUpdated: serverTimestamp(),
    };

    try {
      const docRef = doc(db, "products", id);

      await updateDoc(docRef, updatedProduct);

      const changes = [];
      if (product.name !== updatedProduct.name) changes.push(`Name: ${product.name} -> ${updatedProduct.name}`);
      if (Number(product.total) !== updatedProduct.total) changes.push(`Stock: ${product.total} -> ${updatedProduct.total}`);
      if (Number(product.price) !== updatedProduct.price) changes.push(`Price: ₦${product.price} -> ₦${updatedProduct.price}`);
      if (product.hasPack !== updatedProduct.hasPack) changes.push(`Has Pack: ${product.hasPack} -> ${updatedProduct.hasPack}`);
      if (product.itemsPerPack !== updatedProduct.itemsPerPack) changes.push(`Items/Pack: ${product.itemsPerPack} -> ${updatedProduct.itemsPerPack}`);

      await addDoc(collection(db, "history"), {
        productId: id,
        product: updatedProduct.name,
        action: "Edited Product",
        quantity: updatedProduct.total,
        oldTotal: Number(product.total), // Store old value for revert
        oldPrice: Number(product.price), // Store old value for revert
        payment: "—",
        recordedBy: auth.currentUser?.email || "Unknown",
        date: serverTimestamp(),
        note: changes.length > 0 ? `Updated: ${changes.join(", ")}` : "No details changed",
      });

      alert("✅ Product updated successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("❌ Failed to save changes");
    } finally {
      setLoading(false);
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

        {/* Pack Option */}
        <div className="checkbox-group" style={{ margin: "15px 0" }}>
          <input
            type="checkbox"
            id="hasPack"
            name="hasPack"
            checked={product.hasPack}
            onChange={handleChange}
          />
          <label htmlFor="hasPack" style={{ marginLeft: "8px" }}>This product is sold in packs</label>
        </div>

        {/* Items per Pack (show only if checkbox is checked) */}
        {product.hasPack && (
          <div style={{ marginBottom: "15px" }}>
            <label>Number of Items per Pack:</label>
            <input
              type="number"
              name="itemsPerPack"
              value={product.itemsPerPack}
              onChange={handleChange}
              placeholder="Enter number of items in a pack"
              required
            />
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : "💾 Save Changes"}
        </button>
      </form>
      <div style={{ textAlign: "center" }}>
        <Link to={`/product/${id}`}>
          <button className="btn-primary" style={{ marginTop: "10px" }}>
            ⬅ Back
          </button>
        </Link>

      </div>
    </div>
  );
};

export default EditProduct;

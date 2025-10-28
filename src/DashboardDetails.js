// src/DashboardDetails.js
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

function DashboardDetails() {
  const { id } = useParams(); // Get product ID from URL
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };

    fetchProduct();
  }, [id]);

  if (!product) {
    return <p>Loading product details...</p>;
  }

  return (
    <div className="dashboard-view">
      <h2>{product.name} Details</h2>
      <p><strong>Total Stock:</strong> {product.total}</p>
      <p><strong>Sold:</strong> {product.sold}</p>
      <p><strong>Damaged:</strong> {product.damaged}</p>
      <p><strong>Remaining:</strong> {product.total - (product.sold + product.damaged)}</p>
      <p><strong>Revenue:</strong> ₦{(product.revenue || 0).toLocaleString()}</p>

      <Link to="/dashboard">
        <button className="edit-btn">← Back</button>
      </Link>
    </div>
  );
}

export default DashboardDetails;

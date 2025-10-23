import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

const Dashboard = () => {
  const [products, setProducts] = useState([]);

  // ✅ Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, []);

  // ✅ Calculations
  const totalStock = products.reduce((acc, p) => acc + (p.total || 0), 0);
  const totalSold = products.reduce((acc, p) => acc + (p.sold || 0), 0);
  const totalDamaged = products.reduce((acc, p) => acc + (p.damaged || 0), 0);
  const totalRevenue = products.reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="dashboard-container">
      <h2>📊 Stock Overview</h2>

      <div className="summary-cards">
        <div className="card">
          <h3>Total Stock</h3>
          <p>{totalStock}</p>
        </div>
        <div className="card">
          <h3>Total Sold</h3>
          <p>{totalSold}</p>
        </div>
        <div className="card">
          <h3>Total Damaged</h3>
          <p>{totalDamaged}</p>
        </div>
        <div className="card">
          <h3>Total Revenue</h3>
          <p>₦{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <h3 className="table-title">Product Summary</h3>
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Total Qty</th>
              <th>Sold</th>
              <th>Damaged</th>
              <th>Revenue (₦)</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.total}</td>
                <td>{p.sold}</td>
                <td>{p.damaged}</td>
                <td>{(p.amount || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Dashboard;

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

const emptyRow = {
  productId: "",
  quantity: "",
  saleType: "unit",
  amount: "",
  vendorPrice: "",
  productPrice: "",
};

function RecordSales() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([
    { ...emptyRow },
  ]);

  const [isVendorSale, setIsVendorSale] = useState(null);
  const [vendorName, setVendorName] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchProducts();
  }, []);

  const handleAddProduct = () => {
    setSelectedProducts((prev) => [...prev, { ...emptyRow }]);
  };

  const handleRemoveProduct = (index) => {
    const updated = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(updated);
    recalculateTotal(updated);
  };

  /* ✅ FIXED vendor toggle */
  const handleVendorToggle = (value) => {
    setIsVendorSale(value);

    if (value === "no") {
      setVendorName("");

      const recalculated = selectedProducts.map((item) => {
        const product = products.find(
          (p) => p.id === item.productId
        );

        if (!product || !item.quantity) {
          return {
            ...item,
            vendorPrice: "",
            amount: "",
          };
        }

        const quantity =
          item.saleType === "pack"
            ? Number(item.quantity) * (product.itemsPerPack || 1)
            : Number(item.quantity);

        return {
          ...item,
          vendorPrice: "",
          amount: product.price * quantity,
          productPrice: product.price,
        };
      });

      setSelectedProducts(recalculated);
      recalculateTotal(recalculated);
    }

    if (value === "yes") {
      const cleared = selectedProducts.map((item) => ({
        ...item,
        amount: "",
      }));

      setSelectedProducts(cleared);
      recalculateTotal(cleared);
    }
  };

  const handleChange = (index, field, value) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], [field]: value };

    const product = products.find(
      (p) => p.id === updated[index].productId
    );

    if (product) {
      const quantity =
        updated[index].saleType === "pack"
          ? Number(updated[index].quantity || 0) *
            (product.itemsPerPack || 1)
          : Number(updated[index].quantity || 0);

      updated[index].amount =
        isVendorSale === "yes"
          ? Number(updated[index].vendorPrice || 0) * quantity
          : product.price * quantity;

      updated[index].productPrice = product.price;
    }

    setSelectedProducts(updated);
    recalculateTotal(updated);
  };

  const recalculateTotal = (list) => {
    setTotalAmount(list.reduce((sum, i) => sum + (i.amount || 0), 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentMethod || !isVendorSale) {
      alert("Please complete all required fields");
      return;
    }

    if (isVendorSale === "yes" && !vendorName) {
      alert("Please enter vendor name");
      return;
    }

    try {
      for (const item of selectedProducts) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;

        const qty =
          item.saleType === "pack"
            ? item.quantity * (product.itemsPerPack || 1)
            : Number(item.quantity);

        if (qty > product.total) {
          alert(`Not enough stock for ${product.name}`);
          return;
        }

        await updateDoc(doc(db, "products", product.id), {
          total: product.total - qty,
          sold: (product.sold || 0) + qty,
          lastUpdated: serverTimestamp(),
        });

        await addDoc(collection(db, "history"), {
          productId: product.id,
          product: product.name,
          quantity: qty,
          saleType: item.saleType,

          forVendor: isVendorSale === "yes",
          vendorName: isVendorSale === "yes" ? vendorName : "",
          vendorPrice:
            isVendorSale === "yes" ? Number(item.vendorPrice) : 0,

          productPrice: item.productPrice,
          amount: item.amount,
          payment: paymentMethod,
          action: "Sold",
          date: serverTimestamp(),
        });
      }

      alert("✅ Sale recorded successfully");

      setSelectedProducts([{ ...emptyRow }]);
      setIsVendorSale(null);
      setVendorName("");
      setPaymentMethod("");
      setTotalAmount(0);
    } catch (err) {
      console.error(err);
      alert("❌ Error recording sale");
    }
  };

  return (
    <div className="form-container">
      <h2>🛒 Record Sales</h2>

      <form onSubmit={handleSubmit}>
        <label>Is this sale for a vendor?</label>
        <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
          <label>
            <input
              type="radio"
              name="vendor-sale"
              checked={isVendorSale === "yes"}
              onChange={() => handleVendorToggle("yes")}
            />{" "}
            Yes
          </label>

          <label>
            <input
              type="radio"
              name="vendor-sale"
              checked={isVendorSale === "no"}
              onChange={() => handleVendorToggle("no")}
            />{" "}
            No
          </label>
        </div>

        {isVendorSale === "yes" && (
          <>
            <label>Vendor Name</label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              required
            />
          </>
        )}

        {selectedProducts.map((item, index) => (
          <div key={index} className="sale-row">
            <label>Product {index + 1}</label>
            <select
              value={item.productId}
              onChange={(e) =>
                handleChange(index, "productId", e.target.value)
              }
              required
            >
              <option value="">-- Select product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <label>Sale Type</label>
            <select
              value={item.saleType}
              onChange={(e) =>
                handleChange(index, "saleType", e.target.value)
              }
            >
              <option value="unit">Unit</option>
              <option value="pack">Pack</option>
            </select>

            {isVendorSale === "yes" && (
              <>
                <label>Vendor Price (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={item.vendorPrice}
                  onChange={(e) =>
                    handleChange(
                      index,
                      "vendorPrice",
                      Number(e.target.value)
                    )
                  }
                  required
                />
              </>
            )}

            <label>
              Quantity ({item.saleType === "pack" ? "Packs" : "Units"})
            </label>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) =>
                handleChange(
                  index,
                  "quantity",
                  Number(e.target.value)
                )
              }
              required
            />

            <label>Amount</label>
            <input
              type="text"
              value={
                item.amount ? `₦${item.amount.toLocaleString()}` : ""
              }
              readOnly
            />

            {selectedProducts.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveProduct(index)}
              >
                ❌ Remove
              </button>
            )}

            <hr />
          </div>
        ))}

        <button type="button" onClick={handleAddProduct}>
          ➕ Add Another Product
        </button>

        <label>Payment Method</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        >
          <option value="">-- Select payment --</option>
          <option value="cash">Cash</option>
          <option value="transfer">Transfer</option>
          <option value="pos">POS</option>
        </select>

        <h3>Total Amount: ₦{totalAmount.toLocaleString()}</h3>

        <button type="submit">Record Sale</button>
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

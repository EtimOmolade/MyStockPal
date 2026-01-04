import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const AdminDebug = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const d = await getDoc(doc(db, "users", u.uid));
        if (d.exists()) setRole(d.data().role);
        else setRole("No User Doc");
      }
    });
  }, []);

  const makeAdmin = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "admin"
      }, { merge: true });
      setRole("admin");
      setMsg("✅ Success! You are now an Admin. Refresh the page.");
      alert("Success! You are now an Admin. Please refresh the page.");
    } catch (e) {
      console.error(e);
      setMsg("❌ Error: " + e.message);
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: 10, background: "#f0f0f0", borderBottom: "1px solid #ccc", fontSize: "12px" }}>
      <strong>Debug:</strong> User: {user.email} | Role: <b>{role}</b>
      {role !== "admin" && (
        <button onClick={makeAdmin} style={{ marginLeft: 10, background: "red", color: "white" }}>
          Fix Admin Access (Click Me)
        </button>
      )}
      <span style={{ marginLeft: 10, color: "green" }}>{msg}</span>
    </div>
  );
};

export default AdminDebug;

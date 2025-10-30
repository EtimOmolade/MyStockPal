// src/Signup.js
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      toast.error("❌ Passwords do not match!");
      return;
    }

    setPasswordError("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("🎉 Account created successfully!");
      navigate("/");
    } catch (error) {
      toast.error("❌ " + error.message);
    }
  };

  return (
    <div className="auth-container">
      <ToastContainer />
      <h2>📝 Sign Up</h2>

      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="📧 Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="🔑 Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="🔁 Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={passwordError ? "input-error" : ""}
        />

        {/* Inline password mismatch message */}
        {passwordError && (
          <p style={{ color: "red", fontSize: "0.9em", marginTop: "-8px" }}>
            {passwordError}
          </p>
        )}

        <button type="submit">Sign Up</button>

        <p>
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} className="link">
<button type="submit">Login</button>          </span>
        </p>
      </form>

      
    </div>
  );
}

export default Signup;

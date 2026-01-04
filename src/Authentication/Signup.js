// // src/Signup.js
// import React, { useState } from "react";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { auth, db } from "../firebase";
// import { doc, setDoc, serverTimestamp } from "firebase/firestore";
// import { useNavigate } from "react-router-dom";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// function Signup() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [passwordError, setPasswordError] = useState("");
//   const navigate = useNavigate();

//   const handleSignup = async (e) => {
//     e.preventDefault();

//     if (password !== confirmPassword) {
//       setPasswordError("Passwords do not match");
//       toast.error("❌ Passwords do not match!");
//       return;
//     }

//     setPasswordError("");

//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;

//       // ✅ Create user document in Firestore with role
//       await setDoc(doc(db, "users", user.uid), {
//         email: user.email,
//         role: "user", // Default role
//         createdAt: serverTimestamp(),
//       });

//       toast.success("🎉 Account created successfully!");
//       navigate("/");
//     } catch (error) {
//       toast.error("❌ " + error.message);
//     }
//   };

//   return (
//     <div className="auth-container">
//       <ToastContainer />
//       <h2>📝 Sign Up</h2>

//       <form onSubmit={handleSignup}>
//         <input
//           type="email"
//           placeholder="📧 Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />

//         <div className="password-wrapper" style={{ marginTop: "2rem" }}>
//           <input
//             type={showPassword ? "text" : "password"}
//             placeholder="🔑 Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//           />
//           <span
//             className="password-toggle-icon"
//             onClick={() => setShowPassword(!showPassword)}
//             title={showPassword ? "Hide password" : "Show password"}
//           >
//             {showPassword ? (
//               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
//             ) : (
//               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
//             )}
//           </span>
//         </div>

//         <div className="password-wrapper" style={{ marginTop: "2rem" }}>
//           <input
//             type={showConfirmPassword ? "text" : "password"}
//             placeholder=" Confirm Password"
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//             required
//             className={passwordError ? "input-error" : ""}
//           />
//           <span
//             className="password-toggle-icon"
//             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//             title={showConfirmPassword ? "Hide password" : "Show password"}
//           >
//             {showConfirmPassword ? (
//               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
//             ) : (
//               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
//             )}
//           </span>
//         </div>

//         {/* Inline password mismatch message */}
//         {passwordError && (
//           <p style={{ color: "red", fontSize: "0.9em", marginTop: "-8px" }}>
//             {passwordError}
//           </p>
//         )}

//         <button type="submit" style={{ marginTop: "2rem" }}>Sign Up</button>

//         <p>
//           Already have an account?{" "}
//           <span onClick={() => navigate("/login")} className="link">
//             <button type="submit">Login</button>          </span>
//         </p>
//       </form>


//     </div>
//   );
// }

// export default Signup;

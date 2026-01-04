import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole
      });
      toast.success(`User role updated to ${newRole}`);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This will remove their profile data.")) return;

    try {
      await deleteDoc(doc(db, "users", userId));
      toast.success("User profile deleted.");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user.");
    }
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="user-list">
      <ToastContainer />
      <h3>User Management</h3>
      <table className="dashboard-table" style={{ width: "100%", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>
                <span style={{
                  backgroundColor: user.role === "admin" ? "#ff4d4d" : "#4caf50",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.8em"
                }}>
                  {user.role}
                </span>
              </td>
              <td>{user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</td>
              <td>
                <div style={{ display: "flex", gap: "10px" }}>
                  {user.role !== "admin" ? (
                    <button
                      onClick={() => handleRoleChange(user.id, "admin")}
                      style={{ backgroundColor: "#2196F3", fontSize: "0.8em", padding: "5px 10px" }}
                    >
                      Make Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(user.id, "user")}
                      style={{ backgroundColor: "#FF9800", fontSize: "0.8em", padding: "5px 10px" }}
                    >
                      Revoke Admin
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    style={{ backgroundColor: "#f44336", fontSize: "0.8em", padding: "5px 10px" }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserList;

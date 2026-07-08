import React, { useState, useEffect } from 'react';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { useLogout } from '../hooks/useLogout';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  useProtectedRoute(['admin']);
  const { handleLogout } = useLogout();
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    staff_id: '',
    password: '',
    role: 'staff',
    department: '',
    location: 'Lagos',
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      setDashboard(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers({ limit: 50 });
      setUsers(response.data.data.users);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createUser(formData);
      toast.success('User created successfully');
      setShowUserForm(false);
      setFormData({
        name: '',
        email: '',
        staff_id: '',
        password: '',
        role: 'staff',
        department: '',
        location: 'Lagos',
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      const response = await adminAPI.resetPassword(userId);
      toast.success(`Temp password: ${response.data.data.tempPassword}`);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await adminAPI.generateReport({ format: 'excel' });
      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'orders-report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          {/* Dashboard Stats */}
          {dashboard && activeTab === 'overview' && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}>
                  📦
                </div>
                <div className="stat-content">
                  <h3>Today's Orders</h3>
                  <p className="stat-value">{dashboard.todayStats.totalOrders}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>
                  🍚
                </div>
                <div className="stat-content">
                  <h3>Rice Orders</h3>
                  <p className="stat-value">{dashboard.todayStats.riceOrders}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#e9d5ff' }}>
                  🍲
                </div>
                <div className="stat-content">
                  <h3>Swallow Orders</h3>
                  <p className="stat-value">{dashboard.todayStats.swallowOrders}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#d1fae5' }}>
                  👥
                </div>
                <div className="stat-content">
                  <h3>Staff Members</h3>
                  <p className="stat-value">{dashboard.userStats.staff}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('users');
                fetchUsers();
              }}
            >
              Users
            </button>
            <button
              className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reports
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">User Management</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowUserForm(!showUserForm)}
                >
                  {showUserForm ? 'Cancel' : 'Add User'}
                </button>
              </div>

              {showUserForm && (
                <form onSubmit={handleCreateUser} className="user-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        name="name"
                        className="form-input"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        className="form-input"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Staff ID</label>
                      <input
                        type="text"
                        name="staff_id"
                        className="form-input"
                        value={formData.staff_id}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        name="password"
                        className="form-input"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select
                        name="role"
                        className="form-input"
                        value={formData.role}
                        onChange={handleInputChange}
                      >
                        <option value="staff">Staff</option>
                        <option value="chef">Chef</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        name="department"
                        className="form-input"
                        value={formData.department}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Create User
                  </button>
                </form>
              )}

              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className="badge badge-info">{user.role}</span>
                      </td>
                      <td>{user.department}</td>
                      <td>
                        <span className={`badge badge-${user.status === 'active' ? 'success' : 'danger'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-small"
                            onClick={() => handleResetPassword(user.id)}
                          >
                            Reset
                          </button>
                          <button
                            className="btn-small btn-danger"
                            onClick={() => handleDeleteUser(user.id)}
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
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Reports</h2>
              </div>
              <div className="report-actions">
                <button className="btn btn-primary" onClick={handleGenerateReport}>
                  Download Excel Report
                </button>
                <p className="report-info">Generate and download detailed meal ordering reports</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

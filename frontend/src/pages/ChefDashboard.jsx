import React, { useState, useEffect } from 'react';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { useLogout } from '../hooks/useLogout';
import { chefAPI } from '../services/api';
import { initializeSocket, onEvent, offEvent } from '../services/socket';
import toast from 'react-hot-toast';
import '../styles/ChefDashboard.css';

const ChefDashboard = () => {
  useProtectedRoute(['chef']);
  const { handleLogout } = useLogout();
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    department: '',
    meal_category: '',
    status: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      initializeSocket(token);
    }
    fetchOrders();
    fetchSummary();

    // Listen for new orders
    onEvent('newOrder', (order) => {
      setOrders((prev) => [order, ...prev]);
      toast.success('New order received!');
      playNotificationSound();
      fetchSummary();
    });

    onEvent('orderStatusChanged', (data) => {
      setOrders((prev) => prev.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o)));
      fetchSummary();
    });

    return () => {
      offEvent('newOrder');
      offEvent('orderStatusChanged');
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await chefAPI.getAllOrders(filters);
      setOrders(response.data.data.orders);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await chefAPI.getKitchenSummary();
      setSummary(response.data.data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.length < 2) {
      toast.error('Search query must be at least 2 characters');
      return;
    }

    try {
      const response = await chefAPI.searchOrders(searchQuery);
      setOrders(response.data.data);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await chefAPI.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated');
      fetchOrders();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
    audio.play().catch((e) => console.log('Could not play sound:', e));
  };

  const printSummary = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
      <html><head><title>Kitchen Summary</title></head><body>
      <h1>Kitchen Summary</h1>
      <h2>Rice Orders</h2>
      <ul>
        ${summary?.riceOrders.map((item) => `<li>${item.count} Plates - ${item.meal}</li>`).join('')}
      </ul>
      <h2>Swallow Orders</h2>
      <ul>
        ${summary?.swallowOrders.map((item) => `<li>${item.count} Plates - ${item.meal}</li>`).join('')}
      </ul>
      </body></html>
    `);
    printWindow.print();
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: '#f59e0b',
      Preparing: '#3b82f6',
      Ready: '#10b981',
      Served: '#6b7280',
      Cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="chef-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Chef Dashboard</h1>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          {/* Kitchen Summary */}
          {summary && (
            <div className="card summary-card">
              <div className="card-header">
                <h2 className="card-title">Kitchen Summary</h2>
                <button className="btn btn-primary" onClick={printSummary}>
                  Print Summary
                </button>
              </div>

              <div className="summary-grid">
                <div className="summary-section">
                  <h3>Rice Orders ({summary.riceOrders.length})</h3>
                  <ul className="summary-list">
                    {summary.riceOrders.map((item, idx) => (
                      <li key={idx}>
                        <span className="count">{item.count}</span>
                        <span className="meal">{item.meal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="summary-section">
                  <h3>Swallow Orders ({summary.swallowOrders.length})</h3>
                  <ul className="summary-list">
                    {summary.swallowOrders.map((item, idx) => (
                      <li key={idx}>
                        <span className="count">{item.count}</span>
                        <span className="meal">{item.meal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Orders</h2>
            </div>

            <div className="filters">
              <form onSubmit={handleSearch} className="search-form">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by staff name or ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Search
                </button>
              </form>

              <div className="filter-grid">
                <select name="location" className="form-input" onChange={handleFilterChange}>
                  <option value="">All Locations</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Lagos">Lagos</option>
                </select>

                <select name="meal_category" className="form-input" onChange={handleFilterChange}>
                  <option value="">All Categories</option>
                  <option value="Rice">Rice</option>
                  <option value="Swallow">Swallow</option>
                </select>

                <select name="status" className="form-input" onChange={handleFilterChange}>
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready</option>
                  <option value="Served">Served</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Name</th>
                    <th>Dept</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Meal</th>
                    <th>Protein</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.order_time}</td>
                        <td>{order.staff_name}</td>
                        <td>{order.department}</td>
                        <td>{order.location}</td>
                        <td>{order.meal_category}</td>
                        <td>
                          {order.rice_type || order.swallow_type}
                        </td>
                        <td>{order.protein}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(order.status) }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            className="form-input"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Ready">Ready</option>
                            <option value="Served">Served</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChefDashboard;

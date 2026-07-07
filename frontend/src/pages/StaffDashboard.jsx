import React, { useState, useEffect } from 'react';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { useLogout } from '../hooks/useLogout';
import { orderAPI } from '../services/api';
import { initializeSocket, onEvent, offEvent, emitEvent } from '../services/socket';
import toast from 'react-hot-toast';
import '../styles/StaffDashboard.css';

const StaffDashboard = () => {
  useProtectedRoute(['staff']);
  const { handleLogout } = useLogout();
  const [todayOrder, setTodayOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    location: 'Lagos',
    meal_category: 'Rice',
    rice_type: '',
    rice_combination: '',
    swallow_type: '',
    soup: '',
    protein: 'Chicken',
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      initializeSocket(token);
    }
    fetchTodayOrder();
  }, []);

  useEffect(() => {
    onEvent('orderStatusChanged', (data) => {
      if (data.orderId === todayOrder?.id) {
        setTodayOrder({ ...todayOrder, status: data.status });
        toast.success(`Order status updated to ${data.status}`);
      }
    });

    return () => offEvent('orderStatusChanged');
  }, [todayOrder]);

  const fetchTodayOrder = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getTodayOrder();
      setTodayOrder(response.data.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setTodayOrder(null);
      } else {
        toast.error('Failed to load order');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'meal_category') {
        updated.rice_type = '';
        updated.rice_combination = '';
        updated.swallow_type = '';
        updated.soup = '';
      }
      return updated;
    });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (todayOrder) {
      toast.error('You have already placed your meal order today');
      return;
    }

    try {
      setLoading(true);
      const response = await orderAPI.createOrder(formData);
      setTodayOrder(response.data.data);
      emitEvent('newOrder', response.data.data);
      toast.success(response.data.message);
      setFormData({
        location: 'Lagos',
        meal_category: 'Rice',
        rice_type: '',
        rice_combination: '',
        swallow_type: '',
        soup: '',
        protein: 'Chicken',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await orderAPI.updateOrder(todayOrder.id, formData);
      setTodayOrder(response.data.data);
      toast.success('Order updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
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
    <div className="staff-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Staff Meal Ordering</h1>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          <div className="dashboard-grid">
            {/* Order Form */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Place Your Order</h2>
              </div>

              {todayOrder ? (
                <div className="order-status">
                  <div className="status-badge" style={{ backgroundColor: getStatusColor(todayOrder.status) }}>
                    Status: {todayOrder.status}
                  </div>
                  <p className="order-info">Order ID: {todayOrder.id}</p>
                </div>
              ) : null}

              <form onSubmit={todayOrder ? handleUpdateOrder : handleSubmitOrder}>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select
                    name="location"
                    className="form-input"
                    value={formData.location}
                    onChange={handleInputChange}
                  >
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Meal Category</label>
                  <select
                    name="meal_category"
                    className="form-input"
                    value={formData.meal_category}
                    onChange={handleInputChange}
                  >
                    <option value="Rice">Rice</option>
                    <option value="Swallow">Swallow</option>
                  </select>
                </div>

                {formData.meal_category === 'Rice' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Rice Type</label>
                      <select
                        name="rice_type"
                        className="form-input"
                        value={formData.rice_type}
                        onChange={handleInputChange}
                      >
                        <option value="">Select rice type</option>
                        <option value="Jollof Rice">Jollof Rice</option>
                        <option value="Fried Rice">Fried Rice</option>
                        <option value="White Rice">White Rice</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Protein/Side Combination</label>
                      <select
                        name="rice_combination"
                        className="form-input"
                        value={formData.rice_combination}
                        onChange={handleInputChange}
                      >
                        <option value="">Select combination</option>
                        <option value="Moimoi + Chicken + Fish">Moimoi + Chicken + Fish</option>
                        <option value="Plantain + Chicken + Fish">Plantain + Chicken + Fish</option>
                        <option value="Chicken">Chicken</option>
                        <option value="Fish">Fish</option>
                        <option value="Chicken + Beef">Chicken + Beef</option>
                        <option value="Fish + Beef">Fish + Beef</option>
                        <option value="Plantain + Fish + Beef">Plantain + Fish + Beef</option>
                        <option value="Moimoi + Fish + Beef">Moimoi + Fish + Beef</option>
                        <option value="Moimoi + Beef">Moimoi + Beef</option>
                        <option value="Moimoi + Plantain + Beef">Moimoi + Plantain + Beef</option>
                      </select>
                    </div>
                  </>
                )}

                {formData.meal_category === 'Swallow' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Swallow Type</label>
                      <select
                        name="swallow_type"
                        className="form-input"
                        value={formData.swallow_type}
                        onChange={handleInputChange}
                      >
                        <option value="">Select swallow type</option>
                        <option value="Akpu/Fufu">Akpu/Fufu</option>
                        <option value="Semo">Semo</option>
                        <option value="Wheat">Wheat</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Soup</label>
                      <select
                        name="soup"
                        className="form-input"
                        value={formData.soup}
                        onChange={handleInputChange}
                      >
                        <option value="">Select soup</option>
                        <option value="Egusi">Egusi</option>
                        <option value="Vegetable">Vegetable</option>
                        <option value="Ogbono">Ogbono</option>
                        <option value="Oha">Oha</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Protein</label>
                      <select
                        name="protein"
                        className="form-input"
                        value={formData.protein}
                        onChange={handleInputChange}
                      >
                        <option value="">Select protein</option>
                        <option value="Beef">Beef</option>
                        <option value="Titus Fish">Titus Fish</option>
                        <option value="Croaker">Croaker</option>
                        <option value="Chicken">Chicken</option>
                        <option value="Goat Meat">Goat Meat</option>
                      </select>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : (todayOrder ? 'Update Order' : 'Submit Order')}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            {todayOrder && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Today's Order</h2>
                </div>
                <div className="order-details">
                  <div className="detail-item">
                    <span className="label">Category:</span>
                    <span className="value">{todayOrder.meal_category}</span>
                  </div>
                  {todayOrder.rice_type && (
                    <div className="detail-item">
                      <span className="label">Rice Type:</span>
                      <span className="value">{todayOrder.rice_type}</span>
                    </div>
                  )}
                  {todayOrder.swallow_type && (
                    <div className="detail-item">
                      <span className="label">Swallow Type:</span>
                      <span className="value">{todayOrder.swallow_type}</span>
                    </div>
                  )}
                  {todayOrder.soup && (
                    <div className="detail-item">
                      <span className="label">Soup:</span>
                      <span className="value">{todayOrder.soup}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="label">Protein:</span>
                    <span className="value">{todayOrder.protein}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Time:</span>
                    <span className="value">{todayOrder.order_time}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className="badge" style={{ backgroundColor: getStatusColor(todayOrder.status) }}>
                      {todayOrder.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;

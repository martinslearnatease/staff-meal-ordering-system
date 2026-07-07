import React, { useState } from 'react';
import { useLogin } from '../hooks/useLogin';
import '../styles/Login.css';

const Login = () => {
  const { handleLogin, loading } = useLogin();
  const [loginType, setLoginType] = useState('staff');
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    staff_id: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loginData = loginType === 'staff'
      ? { staff_id: credentials.staff_id, password: credentials.password }
      : { username: credentials.username, password: credentials.password };

    await handleLogin(loginData);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Meal Ordering System</h1>
          <p>Kitchen Management Portal</p>
        </div>

        <div className="login-tabs">
          <button
            className={`tab ${loginType === 'staff' ? 'active' : ''}`}
            onClick={() => setLoginType('staff')}
          >
            Staff
          </button>
          <button
            className={`tab ${loginType === 'admin' ? 'active' : ''}`}
            onClick={() => setLoginType('admin')}
          >
            Chef/Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {loginType === 'staff' ? (
            <div className="form-group">
              <label className="form-label">Staff ID</label>
              <input
                type="text"
                name="staff_id"
                className="form-input"
                placeholder="e.g., EMP001"
                value={credentials.staff_id}
                onChange={handleChange}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className="form-input"
                placeholder="e.g., admin or chef1"
                value={credentials.username}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Default Credentials:</p>
          <ul>
            <li><strong>Staff:</strong> EMP001 / Staff@123</li>
            <li><strong>Chef:</strong> chef1 / Chef@123</li>
            <li><strong>Admin:</strong> admin / Admin@123</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;

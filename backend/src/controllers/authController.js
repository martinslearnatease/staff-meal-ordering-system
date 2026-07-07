const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { validate, loginSchema, staffLoginSchema } = require('../utils/validators');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      staff_id: user.staff_id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      location: user.location,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' },
  );

  const refreshToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' },
  );

  return { accessToken, refreshToken };
};

const login = async (req, res) => {
  try {
    const { username, password, staff_id: staffId } = req.body;

    let user;
    let validationResult;

    // Determine login type
    if (staffId) {
      // Staff login
      validationResult = validate(staffLoginSchema, { staff_id: staffId, password });
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.messages,
        });
      }

      user = await User.findOne({ where: { staff_id: staffId } });
    } else {
      // Admin or Chef login
      validationResult = validate(loginSchema, { username, password });
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.messages,
        });
      }

      user = await User.findOne({ where: { name: username } });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    const { accessToken, refreshToken } = generateTokens(user);

    logger.info(`User ${user.id} (${user.role}) logged in successfully`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          staff_id: user.staff_id,
          role: user.role,
          department: user.department,
          location: user.location,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user || user.status === 'inactive') {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
        });
      }

      const { accessToken: newAccessToken } = generateTokens(user);

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
    });
  }
};

const logout = (req, res) => {
  try {
    logger.info(`User ${req.user.id} logged out`);
    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new passwords are required',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    await user.update({ password: newPassword });

    logger.info(`User ${userId} changed password`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed',
    });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  changePassword,
};

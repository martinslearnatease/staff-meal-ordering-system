const { Op } = require('sequelize');
const User = require('../models/User');
const Order = require('../models/Order');
const SystemSetting = require('../models/SystemSetting');
const logger = require('../utils/logger');
const { validate, createUserSchema } = require('../utils/validators');

const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's orders
    const todayOrders = await Order.findAll({
      where: {
        order_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    // Count by category
    const riceCount = todayOrders.filter((o) => o.meal_category === 'Rice').length;
    const swallowCount = todayOrders.filter((o) => o.meal_category === 'Swallow').length;

    // Count by location
    const abujaCount = todayOrders.filter((o) => o.location === 'Abuja').length;
    const lagosCount = todayOrders.filter((o) => o.location === 'Lagos').length;

    // Most popular items
    const riceTypes = {};
    const proteins = {};
    const soups = {};

    todayOrders.forEach((order) => {
      if (order.rice_type) riceTypes[order.rice_type] = (riceTypes[order.rice_type] || 0) + 1;
      proteins[order.protein] = (proteins[order.protein] || 0) + 1;
      if (order.soup) soups[order.soup] = (soups[order.soup] || 0) + 1;
    });

    const mostPopularRice = Object.entries(riceTypes).sort((a, b) => b[1] - a[1])[0];
    const mostPopularProtein = Object.entries(proteins).sort((a, b) => b[1] - a[1])[0];
    const mostPopularSoup = Object.entries(soups).sort((a, b) => b[1] - a[1])[0];

    // Get user counts
    const staffCount = await User.count({ where: { role: 'staff' } });
    const chefCount = await User.count({ where: { role: 'chef' } });
    const adminCount = await User.count({ where: { role: 'admin' } });

    res.json({
      success: true,
      data: {
        todayStats: {
          totalOrders: todayOrders.length,
          riceOrders: riceCount,
          swallowOrders: swallowCount,
          abujaOrders: abujaCount,
          lagosOrders: lagosCount,
        },
        mostPopular: {
          rice: mostPopularRice ? { name: mostPopularRice[0], count: mostPopularRice[1] } : null,
          protein: mostPopularProtein ? { name: mostPopularProtein[0], count: mostPopularProtein[1] } : null,
          soup: mostPopularSoup ? { name: mostPopularSoup[0], count: mostPopularSoup[1] } : null,
        },
        userStats: {
          staff: staffCount,
          chef: chefCount,
          admin: adminCount,
        },
      },
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data',
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const { role, status, limit = 20, offset = 0 } = req.query;
    const where = {};

    if (role) where.role = role;
    if (status) where.status = status;

    const users = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        total: users.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
    });
  }
};

const createUser = async (req, res) => {
  try {
    const validationResult = validate(createUserSchema, req.body);

    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.messages,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: req.body.email },
          { staff_id: req.body.staff_id },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or staff ID already exists',
      });
    }

    const user = await User.create(req.body);

    logger.info(`New user created: ${user.id} (${user.role})`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        staff_id: user.staff_id,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['name', 'email', 'department', 'location', 'status'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.update(updateData);

    logger.info(`User ${id} updated`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        staff_id: user.staff_id,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.destroy();

    logger.info(`User ${id} deleted`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const defaultPassword = 'TempPassword@123';

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.update({ password: defaultPassword });

    logger.info(`Password reset for user ${id}`);

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        tempPassword: defaultPassword,
        userId: user.id,
      },
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll();
    const settingsObj = {};

    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({
      success: true,
      data: settingsObj,
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings',
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { key, value } = req.body;

    let setting = await SystemSetting.findOne({ where: { key } });

    if (!setting) {
      setting = await SystemSetting.create({ key, value });
    } else {
      await setting.update({ value });
    }

    logger.info(`Setting ${key} updated to ${value}`);

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: setting,
    });
  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
    });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getSettings,
  updateSettings,
};

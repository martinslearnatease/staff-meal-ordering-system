const { Op } = require('sequelize');
const Order = require('../models/Order');
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const logger = require('../utils/logger');
const { validate, createOrderSchema } = require('../utils/validators');
const { emitToChefs, emitToUser } = require('../sockets');

const checkOrderingStatus = async () => {
  try {
    const setting = await SystemSetting.findOne({ where: { key: 'ordering_open' } });
    return setting ? setting.value === 'true' : true;
  } catch (error) {
    logger.error('Error checking ordering status:', error);
    return true;
  }
};

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const validationResult = validate(createOrderSchema, req.body);

    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.messages,
      });
    }

    // Check if ordering is open
    const orderingOpen = await checkOrderingStatus();
    if (!orderingOpen) {
      return res.status(403).json({
        success: false,
        message: 'Meal ordering has closed for today',
      });
    }

    // Check if user already has an order today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingOrder = await Order.findOne({
      where: {
        user_id: userId,
        order_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message: 'You have already placed your meal order today',
      });
    }

    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Create order
    const order = await Order.create({
      user_id: userId,
      staff_name: user.name,
      staff_id: user.staff_id,
      department: user.department,
      location: req.body.location || user.location,
      meal_category: req.body.meal_category,
      rice_type: req.body.rice_type,
      swallow_type: req.body.swallow_type,
      soup: req.body.soup,
      protein: req.body.protein,
      rice_combination: req.body.rice_combination,
      order_date: today,
      order_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      status: 'Pending',
    });

    logger.info(`Order created: ${order.id} by user ${userId}`);

    // Emit to chefs in real-time
    emitToChefs('newOrder', {
      id: order.id,
      staff_name: order.staff_name,
      staff_id: order.staff_id,
      department: order.department,
      location: order.location,
      meal_category: order.meal_category,
      rice_type: order.rice_type,
      swallow_type: order.swallow_type,
      soup: order.soup,
      protein: order.protein,
      rice_combination: order.rice_combination,
      order_time: order.order_time,
      status: order.status,
    });

    res.status(201).json({
      success: true,
      message: 'Your meal order has been submitted successfully',
      data: order,
    });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
    });
  }
};

const getTodayOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const order = await Order.findOne({
      where: {
        user_id: userId,
        order_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No order found for today',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Get today order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order',
    });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const allowEdit = await SystemSetting.findOne({ where: { key: 'allow_edit_after_submission' } });

    if (allowEdit && allowEdit.value !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit order after submission',
      });
    }

    const order = await Order.findOne({
      where: { id, user_id: userId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status !== 'Pending') {
      return res.status(409).json({
        success: false,
        message: 'Cannot edit order that is being prepared',
      });
    }

    await order.update(req.body);

    logger.info(`Order ${id} updated by user ${userId}`);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  } catch (error) {
    logger.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
    });
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    const orders = await Order.findAndCountAll({
      where: { user_id: userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['order_date', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        orders: orders.rows,
        total: orders.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    logger.error('Get order history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order history',
    });
  }
};

module.exports = {
  createOrder,
  getTodayOrder,
  updateOrder,
  getOrderHistory,
};

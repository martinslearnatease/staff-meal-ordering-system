const { Op } = require('sequelize');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const { generateKitchenSummary, emitToChefs } = require('../sockets');

const getAllOrders = async (req, res) => {
  try {
    const {
      limit = 50, offset = 0, location, department, meal_category, status,
    } = req.query;

    const where = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    where.order_date = {
      [Op.gte]: today,
      [Op.lt]: tomorrow,
    };

    if (location) where.location = location;
    if (department) where.department = department;
    if (meal_category) where.meal_category = meal_category;
    if (status) where.status = status;

    const orders = await Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['order_time', 'DESC']],
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
    logger.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
    });
  }
};

const getKitchenSummary = async (req, res) => {
  try {
    const summary = await generateKitchenSummary();
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Get kitchen summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate kitchen summary',
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Preparing', 'Ready', 'Served', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    await order.update({ status });

    logger.info(`Order ${id} status updated to ${status}`);

    // Emit to all connected chefs
    emitToChefs('orderStatusChanged', {
      orderId: id,
      status,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
    });
  }
};

const searchOrders = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const orders = await Order.findAll({
      where: {
        [Op.or]: [
          { staff_name: { [Op.like]: `%${q}%` } },
          { staff_id: { [Op.like]: `%${q}%` } },
          { department: { [Op.like]: `%${q}%` } },
        ],
      },
      limit: 20,
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    logger.error('Search orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search orders',
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status !== 'Served') {
      return res.status(409).json({
        success: false,
        message: 'Only served orders can be deleted',
      });
    }

    await order.destroy();

    logger.info(`Order ${id} deleted`);

    emitToChefs('orderDeleted', { orderId: id });

    res.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    logger.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
    });
  }
};

module.exports = {
  getAllOrders,
  getKitchenSummary,
  updateOrderStatus,
  searchOrders,
  deleteOrder,
};

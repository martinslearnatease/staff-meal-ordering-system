const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const Order = require('../models/Order');
const User = require('../models/User');

let io;
const connectedUsers = new Map();

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.error('Socket authentication failed:', err);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.id} (${socket.user.role})`);
    connectedUsers.set(socket.user.id, socket);

    // Chef joins kitchen room
    if (socket.user.role === 'chef') {
      socket.join('kitchen');
      logger.info(`Chef ${socket.user.id} joined kitchen room`);
    }

    // Staff joins personal room
    if (socket.user.role === 'staff') {
      socket.join(`staff-${socket.user.id}`);
    }

    // Admin joins admin room
    if (socket.user.role === 'admin') {
      socket.join('admin');
    }

    // Handle new order submission
    socket.on('newOrder', async (orderData) => {
      try {
        logger.info(`New order submitted by ${socket.user.id}`, orderData);

        // Emit to kitchen (chefs)
        io.to('kitchen').emit('orderReceived', {
          ...orderData,
          notification: `New order from ${orderData.staff_name}`,
          timestamp: new Date().toISOString(),
        });

        // Play notification sound on chef dashboards
        io.to('kitchen').emit('playNotificationSound');
      } catch (error) {
        logger.error('Error handling newOrder:', error);
      }
    });

    // Handle order status update
    socket.on('updateOrderStatus', async (data) => {
      try {
        const { orderId, status } = data;
        logger.info(`Order ${orderId} status updated to ${status}`);

        // Notify all connected clients
        io.emit('orderStatusChanged', {
          orderId,
          status,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Error updating order status:', error);
      }
    });

    // Handle kitchen summary request
    socket.on('requestKitchenSummary', async () => {
      try {
        if (socket.user.role !== 'chef') {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        const summary = await generateKitchenSummary();
        socket.emit('kitchenSummary', summary);
      } catch (error) {
        logger.error('Error generating kitchen summary:', error);
        socket.emit('error', { message: 'Failed to generate summary' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.id}`);
      connectedUsers.delete(socket.user.id);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.user.id}:`, error);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

const emitToChefs = (eventName, data) => {
  const io = getIO();
  io.to('kitchen').emit(eventName, data);
};

const emitToAllAdmins = (eventName, data) => {
  const io = getIO();
  io.to('admin').emit(eventName, data);
};

const emitToUser = (userId, eventName, data) => {
  const socket = connectedUsers.get(userId);
  if (socket) {
    socket.emit(eventName, data);
  }
};

const generateKitchenSummary = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.findAll({
      where: {
        order_date: {
          [require('sequelize').Op.gte]: today,
        },
        status: ['Pending', 'Preparing'],
      },
    });

    const summary = {
      riceOrders: [],
      swallowOrders: [],
      totalOrders: orders.length,
    };

    // Group rice orders
    const riceGrouped = {};
    orders.forEach((order) => {
      if (order.meal_category === 'Rice') {
        const key = `${order.rice_type} + ${order.rice_combination}`;
        riceGrouped[key] = (riceGrouped[key] || 0) + 1;
      }
    });

    Object.entries(riceGrouped).forEach(([meal, count]) => {
      summary.riceOrders.push({ meal, count });
    });

    // Group swallow orders
    const swallowGrouped = {};
    orders.forEach((order) => {
      if (order.meal_category === 'Swallow') {
        const key = `${order.swallow_type} + ${order.soup} + ${order.protein}`;
        swallowGrouped[key] = (swallowGrouped[key] || 0) + 1;
      }
    });

    Object.entries(swallowGrouped).forEach(([meal, count]) => {
      summary.swallowOrders.push({ meal, count });
    });

    return summary;
  } catch (error) {
    logger.error('Error generating kitchen summary:', error);
    return { riceOrders: [], swallowOrders: [], totalOrders: 0 };
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToChefs,
  emitToAllAdmins,
  emitToUser,
  generateKitchenSummary,
};

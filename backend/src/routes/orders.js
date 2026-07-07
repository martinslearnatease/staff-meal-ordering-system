const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Staff routes
router.post('/', authorizeRole('staff'), orderController.createOrder);
router.get('/today', authorizeRole('staff'), orderController.getTodayOrder);
router.put('/:id', authorizeRole('staff'), orderController.updateOrder);
router.get('/history', authorizeRole('staff'), orderController.getOrderHistory);

module.exports = router;

const express = require('express');
const chefController = require('../controllers/chefController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and chef role
router.use(authenticateToken);
router.use(authorizeRole('chef'));

router.get('/orders', chefController.getAllOrders);
router.get('/orders/summary', chefController.getKitchenSummary);
router.get('/orders/search', chefController.searchOrders);
router.put('/orders/:id/status', chefController.updateOrderStatus);
router.delete('/orders/:id', chefController.deleteOrder);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrderById,
  getUserOrders,
  getAllOrders,
  updateOrderToPaid,
  updateOrderToDelivered,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getUserDashboard,
} = require('../controllers/orderController');

// User routes
router.use(protect);

router.route('/')
  .post(createOrder)
  .get(getUserOrders);

router.route('/dashboard')
  .get(getUserDashboard);

router.route('/:id')
  .get(getOrderById);

router.route('/:id/cancel')
  .post(cancelOrder);

// Admin routes
router.use(admin);

router.route('/admin/all')
  .get(getAllOrders);

router.route('/admin/stats')
  .get(getOrderStats);

router.route('/admin/:id')
  .put(updateOrderStatus);

router.route('/admin/:id/pay')
  .put(updateOrderToPaid);

router.route('/admin/:id/deliver')
  .put(updateOrderToDelivered);

module.exports = router;
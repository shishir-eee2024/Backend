const orderService = require('../services/orderService');

const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user._id, req.body);
    
    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user._id);
    
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await orderService.getUserOrders(req.user._id, page, limit);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || '';
    
    const result = await orderService.getAllOrders(page, limit, status);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const updateOrderToPaid = async (req, res) => {
  try {
    const order = await orderService.updateOrderToPaid(req.params.id, req.body);
    
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await orderService.updateOrderToDelivered(req.params.id);
    
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status, notes);
    
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await orderService.cancelOrder(req.params.id, req.user._id, reason);
    
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const getOrderStats = async (req, res) => {
  try {
    const stats = await orderService.getOrderStats();
    
    res.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const getUserDashboard = async (req, res) => {
  try {
    const dashboard = await orderService.getUserDashboard(req.user._id);
    
    res.json({
      success: true,
      ...dashboard,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
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
};
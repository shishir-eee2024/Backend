const cartService = require('../services/cartService');

const getCart = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.user._id);
    
    res.json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    const cart = await cartService.addToCart(req.user._id, productId, quantity || 1);
    
    res.json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    const cart = await cartService.updateCartItem(req.user._id, itemId, quantity);
    
    res.json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const cart = await cartService.removeFromCart(req.user._id, itemId);
    
    res.json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await cartService.clearCart(req.user._id);
    
    res.json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
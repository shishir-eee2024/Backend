const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

class OrderService {
  async createOrder(userId, orderData) {
    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Prepare order items from cart
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    }));

    // Check stock availability
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
    }

    // Calculate prices
    const itemsPrice = cart.totalPrice;
    const taxPrice = itemsPrice * 0.18; // 18% tax
    const shippingPrice = itemsPrice > 500 ? 0 : 99; // Free shipping above ₹500

    // Create order
    const order = await Order.create({
      user: userId,
      orderItems,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice: itemsPrice + taxPrice + shippingPrice,
    });

    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [], totalItems: 0, totalPrice: 0 }
    );

    return order;
  }

  async getOrderById(orderId, userId) {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Check if user owns the order or is admin
    if (order.user.toString() !== userId.toString()) {
      throw new Error('Not authorized to view this order');
    }

    return order;
  }

  async getUserOrders(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      page,
      totalPages,
      total,
    };
  }

  async getAllOrders(page = 1, limit = 20, status = '') {
    const skip = (page - 1) * limit;
    const query = {};
    
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      page,
      totalPages,
      total,
    };
  }

  async updateOrderToPaid(orderId, paymentResult) {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = paymentResult;
    order.paymentStatus = 'completed';

    const updatedOrder = await order.save();
    return updatedOrder;
  }

  async updateOrderToDelivered(orderId) {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.orderStatus = 'delivered';

    const updatedOrder = await order.save();
    return updatedOrder;
  }

  async updateOrderStatus(orderId, status, notes = '') {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    order.orderStatus = status;
    if (notes) {
      order.notes = notes;
    }

    // Set cancelled timestamp if cancelling
    if (status === 'cancelled') {
      order.cancelledAt = Date.now();
      order.cancelledBy = 'admin';
    }

    const updatedOrder = await order.save();
    return updatedOrder;
  }

  async cancelOrder(orderId, userId, reason = '') {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Check if user owns the order
    if (order.user.toString() !== userId.toString()) {
      throw new Error('Not authorized to cancel this order');
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      throw new Error(`Order cannot be cancelled in ${order.orderStatus} status`);
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = Date.now();
    order.cancelledBy = 'customer';
    order.cancellationReason = reason;

    // Restore product stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    const updatedOrder = await order.save();
    return updatedOrder;
  }

  async getOrderStats() {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
    ]);

    const monthlyStats = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          orders: { $sum: 1 },
          sales: { $sum: '$totalPrice' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    return {
      summary: stats[0] || { totalOrders: 0, totalSales: 0, avgOrderValue: 0 },
      monthlyStats,
    };
  }
}

module.exports = new OrderService();
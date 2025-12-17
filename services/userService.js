const User = require('./models/User');
const Order = require('../models/Order');

class UserService {
  async getAllUsers(page = 1, limit = 20, search = '') {
    const skip = (page - 1) * limit;
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      page,
      totalPages,
      total,
    };
  }

  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(userId, userData) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Update user fields
    user.name = userData.name || user.name;
    user.email = userData.email || user.email;
    user.phone = userData.phone || user.phone;
    user.shippingAddress = userData.shippingAddress || user.shippingAddress;
    
    if (userData.isAdmin !== undefined) {
      user.isAdmin = userData.isAdmin;
    }

    const updatedUser = await user.save();
    return updatedUser;
  }

  async deleteUser(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has any orders
    const orderCount = await Order.countDocuments({ user: userId });
    if (orderCount > 0) {
      throw new Error('Cannot delete user with existing orders');
    }

    await User.findByIdAndDelete(userId);
    return true;
  }

  async getUserStats(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const stats = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
    ]);

    const recentOrders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const orderStatusCounts = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        joined: user.createdAt,
      },
      stats: stats[0] || { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 },
      recentOrders,
      orderStatusCounts,
    };
  }

  async getUserDashboard(userId) {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    const totalOrders = await Order.countDocuments({ user: userId });
    const pendingOrders = await Order.countDocuments({ 
      user: userId, 
      orderStatus: { $in: ['pending', 'processing'] } 
    });
    const totalSpent = await Order.aggregate([
      { $match: { user: userId, isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    const recentOrders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      user,
      summary: {
        totalOrders,
        pendingOrders,
        totalSpent: totalSpent[0]?.total || 0,
      },
      recentOrders,
    };
  }

  async updateUserPassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return true;
  }
}

module.exports = new UserService();
const Cart = require('../models/Cart');
const Product = require('../models/Product');

class CartService {
  async getCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name image price category');
    
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    
    return cart;
  }

  async addToCart(userId, productId, quantity = 1) {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if product exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item if product doesn't exist
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        name: product.name,
        image: product.image,
      });
    }

    await cart.save();
    return cart;
  }

  async updateCartItem(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      throw new Error('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }

    if (quantity < 1) {
      // Remove item if quantity is 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    return cart;
  }

  async removeFromCart(userId, itemId) {
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      throw new Error('Cart not found');
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    
    await cart.save();
    return cart;
  }

  async clearCart(userId) {
    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    cart.items = [];
    await cart.save();
    
    return cart;
  }
}

module.exports = new CartService();
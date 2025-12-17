const Product = require('../models/Product');

class ProductService {
  async getAllProducts(page = 1, limit = 12, category = '', search = '') {
    const query = { isActive: true };
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      products,
      page,
      totalPages,
      total,
    };
  }

  async getProductById(productId) {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async createProduct(productData) {
    const product = await Product.create(productData);
    return product;
  }

  async updateProduct(productId, productData) {
    const product = await Product.findByIdAndUpdate(
      productId,
      productData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async deleteProduct(productId) {
    const product = await Product.findByIdAndUpdate(
      productId,
      { isActive: false },
      { new: true }
    );
    
    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async getCategories() {
    const categories = await Product.distinct('category');
    return categories;
  }
}

module.exports = new ProductService();
// server.js - Simple MongoDB Backend for BazarNepal
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://15.206.88.247:5173', 'http://15.206.88.247:3000'],
    credentials: true
}));
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bazarnepal');
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// Simple User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

// Simple Product Schema
const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    category: String,
    image: String,
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    specifications: Object,
    createdAt: { type: Date, default: Date.now }
});

// Simple Cart Schema
const cartSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    productId: mongoose.Schema.Types.ObjectId,
    quantity: { type: Number, default: 1 },
    addedAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Cart = mongoose.model('Cart', cartSchema);

// ============ API ROUTES ============

// 1. Health Check
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments();
        
        res.json({ 
            success: true, 
            message: 'Server is running',
            database: dbStatus,
            counts: {
                users: userCount,
                products: productCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Auth Routes
// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        
        // Create new user
        const user = new User({ name, email, password });
        await user.save();
        
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Login (Simple - no bcrypt for now)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Product Routes
// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create product
app.post('/api/products', async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Cart Routes
// Get user cart
app.get('/api/cart/:userId', async (req, res) => {
    try {
        const cartItems = await Cart.find({ userId: req.params.userId })
            .populate('productId', 'name price image');
        
        const items = cartItems.map(item => ({
            id: item._id,
            productId: item.productId._id,
            name: item.productId.name,
            price: item.productId.price,
            image: item.productId.image,
            quantity: item.quantity
        }));
        
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        res.json({
            success: true,
            cart: {
                items,
                totalItems,
                totalPrice
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add to cart
app.post('/api/cart', async (req, res) => {
    try {
        const { userId, productId, quantity = 1 } = req.body;
        
        // Check if already in cart
        const existingCart = await Cart.findOne({ userId, productId });
        
        if (existingCart) {
            existingCart.quantity += quantity;
            await existingCart.save();
        } else {
            const cartItem = new Cart({ userId, productId, quantity });
            await cartItem.save();
        }
        
        res.json({ success: true, message: 'Added to cart' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update cart item
app.put('/api/cart/:id', async (req, res) => {
    try {
        const { quantity } = req.body;
        await Cart.findByIdAndUpdate(req.params.id, { quantity });
        res.json({ success: true, message: 'Cart updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Remove from cart
app.delete('/api/cart/:id', async (req, res) => {
    try {
        await Cart.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Removed from cart' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. Contact Route
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        // Here you would save to database or send email
        console.log('Contact received:', { name, email, message });
        res.json({ success: true, message: 'Thank you for your message!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. Seed Sample Data
app.post('/api/seed', async (req, res) => {
    try {
        // Clear existing data
        await Product.deleteMany({});
        await User.deleteMany({});
        
        // Create demo user
        const demoUser = new User({
            name: 'Demo User',
            email: 'demo@example.com',
            password: 'password',
            role: 'user'
        });
        await demoUser.save();
        
        // Create sample products
        const sampleProducts = [
            {
                name: 'MacBook Pro',
                description: 'Apple MacBook Pro with M2 chip',
                price: 104999,
                category: 'Electronics',
                image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop',
                stock: 10,
                rating: 4.8
            },
            {
                name: 'Wireless Headphones',
                description: 'Noise cancelling wireless headphones',
                price: 15999,
                category: 'Electronics',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
                stock: 25,
                rating: 4.5
            },
            {
                name: 'Cotton T-Shirt',
                description: 'Premium cotton t-shirt',
                price: 899,
                category: 'Fashion',
                image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
                stock: 100,
                rating: 4.2
            }
        ];
        
        await Product.insertMany(sampleProducts);
        
        res.json({ 
            success: true, 
            message: 'Sample data added',
            user: {
                email: 'demo@example.com',
                password: 'password'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📡 API Base: http://localhost:${PORT}/api`);
            console.log(`🛒 Demo: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();

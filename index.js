// index.js - Main Server File
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://15.207.110.138:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "🛒 Welcome to BazarNepal E-commerce API",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      products: "GET /api/products",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login"
      }
    }
  });
});

// Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "BazarNepal API is running",
    
  });
});

// Sample products route
app.get("/api/products", (req, res) => {
  const products = [
    {
      id: 1,
      name: "MacBook Pro",
      price: 104999,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
      description: "Powerful laptop for professionals"
    },
    {
      id: 2,
      name: "Wireless Headphones",
      price: 15999,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      description: "Noise-cancelling wireless headphones"
    }
  ];
  res.json({ success: true, products });
});

// Sample product by ID
app.get("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const product = {
    id: id,
    name: "Sample Product",
    price: 9999,
    description: "This is a sample product"
  };
  res.json({ success: true, product });
});

// Sample auth routes
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide name, email and password"
    });
  }
  
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: 1,
      name,
      email
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password"
    });
  }
  
  res.json({
    success: true,
    message: "Login successful",
    user: {
      id: 1,
      name: "Test User",
      email
    },
    token: "sample_jwt_token_here"
  });
});

// 404 Handler - FIXED: Don't use wildcard, just catch all unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
});
const authService = require('../services/authService');

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await authService.registerUser(name, email, password);

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await authService.loginUser(email, password);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await authService.getUserProfile(req.user._id);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await authService.updateUserProfile(req.user._id, req.body);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
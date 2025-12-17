const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  updateUserPassword,
  getCurrentUserProfile,
} = require('../controllers/userController');

// Public routes (none for users)

// Protected routes (for logged-in users)
router.use(protect);

router.route('/profile')
  .get(getCurrentUserProfile);

router.route('/password')
  .put(updateUserPassword);

router.route('/stats')
  .get(getUserStats);

// Admin routes
router.use(admin);

router.route('/')
  .get(getAllUsers);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
const User = require('./models/User');
const generateToken = require('../utils/generateToken');

class AuthService {
  async registerUser(name, email, password) {
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      };
    } else {
      throw new Error('Invalid user data');
    }
  }

  async loginUser(email, password) {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      };
    } else {
      throw new Error('Invalid email or password');
    }
  }

  async getUserProfile(userId) {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUserProfile(userId, userData) {
    const user = await User.findById(userId);

    if (user) {
      user.name = userData.name || user.name;
      user.email = userData.email || user.email;
      
      if (userData.password) {
        user.password = userData.password;
      }

      const updatedUser = await user.save();

      return {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser._id),
      };
    } else {
      throw new Error('User not found');
    }
  }
}

module.exports = new AuthService();
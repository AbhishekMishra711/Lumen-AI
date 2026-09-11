const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'lumen_default_secret_jwt_2026';

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { username, email, password, selected_class } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      return res.status(400).json({ error: 'Username already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const validClasses = ['grinder', 'scholar', 'tactician'];
    const userClass = validClasses.includes(selected_class) ? selected_class : 'grinder';

    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      selected_class: userClass,
    });

    const token = jwt.sign({ id: newUser._id, username: newUser.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        selected_class: newUser.selected_class,
        level: newUser.level,
        xp: newUser.xp,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during registration', details: error.message });
  }
};

/**
 * Login existing user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        selected_class: user.selected_class,
        level: user.level,
        xp: user.xp,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login', details: error.message });
  }
};

/**
 * Get current user profile (by token or userId)
 */
const getMe = async (req, res) => {
  try {
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Invalid token
      }
    }

    if (!userId && req.query.userId) {
      userId = req.query.userId;
    }

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
};

/**
 * Update selected class
 */
const updateClass = async (req, res) => {
  try {
    const { userId, selected_class } = req.body;
    const validClasses = ['grinder', 'scholar', 'tactician'];

    if (!validClasses.includes(selected_class)) {
      return res.status(400).json({ error: 'Invalid class' });
    }

    let id = userId;
    const authHeader = req.headers.authorization;
    if (!id && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        id = decoded.id;
      } catch (e) {}
    }

    if (!id) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { selected_class },
      { new: true }
    ).select('-password');

    return res.json({ success: true, user: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update class', details: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateClass,
};

import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required.', 400);
    }
    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters.', 400);
    }
    const existing = await User.findOne({ email });
    if (existing) throw new AppError('Email already registered.', 409);

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password required.', 400);

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password.', 401);
    }
    const token = generateToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res) {
  res.json({ success: true, user: req.user });
}

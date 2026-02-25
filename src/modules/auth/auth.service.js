const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const smsService = require('../../utils/sms');

/**
 * Auth Service
 * Handles all authentication-related database operations
 */

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} Created user
 */
const register = async (userData) => {
  const { phone_number, name, password } = userData;

  // Check if phone number already exists
  const existingUser = await prisma.user.findUnique({
    where: { phone_number }
  });

  if (existingUser) {
    if (existingUser.is_verified) {
      throw new Error('Phone number already registered');
    } else {
      throw new Error('Phone number is registered but not verified. Please verify your account or request a new OTP.');
    }
  }

  // Hash password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Insert new user
  const user = await prisma.user.create({
    data: {
      phone_number,
      name,
      password_hash,
      role: 'Customer',
      is_active: true,
      is_verified: false
    }
  });

  // Generate 6-digit OTP
  const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.otpCode.create({
    data: {
      phone_number,
      otp_code,
      expires_at
    }
  });

  // Send OTP
  await smsService.sendOTP(phone_number, otp_code);

  return { message: 'Registration successful. Please verify your phone number with the OTP sent to you.' };
};

/**
 * Login user
 * @param {string} phone_number - User's phone number
 * @param {string} password - User's password
 * @returns {Object} User data with JWT token
 */
const login = async (phone_number, password) => {
  // Find user by phone number
  const user = await prisma.user.findUnique({
    where: { phone_number }
  });

  if (!user) {
    throw new Error('Invalid phone number or password');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new Error('Account is deactivated. Please contact support.');
  }

  // Check if user is verified
  if (!user.is_verified) {
    throw new Error('Account is not verified. Please verify your phone number first.');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Invalid phone number or password');
  }

  // Generate JWT token
  const token = generateToken(user.user_id, user.role);

  // Update last login date
  await prisma.user.update({
    where: { user_id: user.user_id },
    data: { last_login_date: new Date() }
  });

  return {
    user: {
      user_id: user.user_id,
      phone_number: user.phone_number,
      name: user.name,
      role: user.role
    },
    token
  };
};

/**
 * Logout user (client-side token invalidation)
 * Since JWT is stateless, logout is handled client-side
 * @param {number} user_id - User ID
 * @returns {Object} Success message
 */
const logout = async (user_id) => {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: { user_id: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // In a stateless JWT system, logout is primarily handled client-side
  return { message: 'Logged out successfully' };
};

/**
 * Create guest user and return guest JWT
 * @param {Object} guestData - Guest data (optional phone_number and name)
 * @returns {Object} Guest data with JWT token
 */
const createGuest = async (guestData = {}) => {
  const { phone_number, name } = guestData;

  // Insert new guest
  const guest = await prisma.guest.create({
    data: {
      phone_number: phone_number || null,
      name: name || null
    },
    select: {
      guest_id: true,
      phone_number: true,
      name: true,
      created_at: true
    }
  });

  // Generate guest JWT token
  const token = generateGuestToken(guest.guest_id);

  return {
    guest,
    token
  };
};

/**
 * Generate JWT token for registered users
 * @param {number} user_id - User ID
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (user_id, role) => {
  const payload = { user_id, role };
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate JWT token for guest users
 * @param {number} guest_id - Guest ID
 * @returns {string} JWT token
 */
const generateGuestToken = (guest_id) => {
  const payload = { guest_id, role: 'Guest' };
  const expiresIn = process.env.JWT_GUEST_EXPIRES_IN || '1d';

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify user exists and is active
 * @param {number} user_id - User ID
 * @returns {Object} User data
 */
const verifyUser = async (user_id) => {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true,
      phone_number: true,
      name: true,
      role: true,
      is_active: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Verify OTP code
 * @param {string} phone_number - User's phone number
 * @param {string} otp_code - The OTP code
 * @returns {Object} User data with JWT token
 */
const verifyOtp = async (phone_number, otp_code) => {
  const user = await prisma.user.findUnique({ where: { phone_number } });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.is_verified) {
    throw new Error('Account is already verified');
  }

  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      phone_number,
      otp_code,
      is_used: false,
      expires_at: { gt: new Date() }
    },
    orderBy: { created_at: 'desc' }
  });

  if (!otpRecord) {
    throw new Error('Invalid or expired OTP code');
  }

  // Mark OTP as used and update user as verified in a transaction
  await prisma.$transaction([
    prisma.otpCode.update({
      where: { otp_id: otpRecord.otp_id },
      data: { is_used: true }
    }),
    prisma.user.update({
      where: { user_id: user.user_id },
      data: { is_verified: true, last_login_date: new Date() }
    })
  ]);

  // Generate JWT token
  const token = generateToken(user.user_id, user.role);

  return {
    user: {
      user_id: user.user_id,
      phone_number: user.phone_number,
      name: user.name,
      role: user.role
    },
    token
  };
};

/**
 * Resend OTP code
 * @param {string} phone_number - User's phone number
 * @returns {Object} Success message
 */
const resendOtp = async (phone_number) => {
  const user = await prisma.user.findUnique({ where: { phone_number } });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.is_verified) {
    throw new Error('Account is already verified');
  }

  // Generate new OTP
  const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.otpCode.create({
    data: {
      phone_number,
      otp_code,
      expires_at
    }
  });

  // Send OTP
  await smsService.sendOTP(phone_number, otp_code);

  return { message: 'A new OTP has been sent to your phone number.' };
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  createGuest,
  generateToken,
  generateGuestToken,
  verifyUser
};

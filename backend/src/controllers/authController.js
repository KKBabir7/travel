import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { addEmailJob } from '../config/bullmq.js';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, username: user.username, roles: user.roles },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const sendTokenResponse = (user, statusCode, res) => {
  const { accessToken, refreshToken } = generateTokens(user);

  // Store refresh token in user document
  user.refreshToken = refreshToken;
  user.save();

  // Set HTTP-only Cookie for refresh token
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(statusCode).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      roles: user.roles,
      profilePicture: user.profilePicture
    }
  });
};

export const register = async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username or Email already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({
      username,
      email,
      password,
      displayName,
      verificationOtp: otp,
      otpExpires
    });

    // Add Email Send job to queue
    await addEmailJob({
      to: user.email,
      subject: 'TravelSphere - Verify Your Email',
      text: `Your email verification OTP is ${otp}. It expires in 10 minutes.`,
      html: `<h3>Welcome to TravelSphere!</h3><p>Your verification OTP is <strong>${otp}</strong>.</p><p>It will expire in 10 minutes.</p>`
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the verification OTP code.'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ 
      email, 
      verificationOtp: otp,
      otpExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.emailVerified = true;
    user.verificationOtp = undefined;
    user.otpExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.emailVerified) {
      // Re-send verification OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOtp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await addEmailJob({
        to: user.email,
        subject: 'TravelSphere - Verify Your Email',
        text: `Your verification OTP is ${otp}. It expires in 10 minutes.`,
        html: `<p>Your verification OTP is <strong>${otp}</strong>.</p>`
      });

      return res.status(403).json({ 
        success: false, 
        message: 'Email not verified. An OTP has been sent to your email.' 
      });
    }

    user.rememberMe = !!rememberMe;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token not found' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user);
    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with that email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOtp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await addEmailJob({
      to: user.email,
      subject: 'TravelSphere - Reset Password OTP',
      text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your password reset OTP is <strong>${otp}</strong>.</p>`
    });

    res.status(200).json({ success: true, message: 'Password reset OTP email sent' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ 
      email, 
      verificationOtp: otp,
      otpExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.verificationOtp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: 1 } });
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

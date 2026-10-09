import * as authService from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user }
  });
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    await authService.verifyEmailToken(token);
    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now access all platform features.'
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPasswordWithToken(token, newPassword);
    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

import { UserModel, IUser } from '../models/UserModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger'; // Assuming logger is auto-injected

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = '1h';

export const registerUser = async (username: string, email: string, userKey: string): Promise<IUser> => { // Renamed from password
  logger.info(`Attempting to register user: ${email}`);
  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    const pwdHash = await bcrypt.hash(userKey, 10); // Renamed from password
    const newUser = new UserModel({
      username,
      email,
      pwdHash,
      role: 'User'
    });

    await newUser.save();
    logger.info(`User registered successfully: ${email}`);
    return newUser;
  } catch (error: any) {
    logger.error(`Error registering user ${email}: ${error.message}`);
    throw error;
  }
};

export const loginUser = async (email: string, passVal: string): Promise<{ token: string; user: IUser }> => { // Renamed from password
  logger.info(`Attempting to log in user: ${email}`);
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials.');
    }

    const isMatch = await bcrypt.compare(passVal, user.pwdHash); // Renamed from password
    if (!isMatch) {
      throw new Error('Invalid credentials.');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info(`User logged in successfully: ${email}`);
    return { token, user };
  } catch (error: any) {
    logger.error(`Error logging in user ${email}: ${error.message}`);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<IUser | null> => {
  logger.info(`Fetching profile for user ID: ${userId}`);
  try {
    const user = await UserModel.findById(userId).select('-pwdHash'); // Exclude password hash
    return user;
  } catch (error: any) {
    logger.error(`Error fetching user profile ${userId}: ${error.message}`);
    throw error;
  }
};

// Updated on 2026-01-05 19:40:20

// Updated on 2026-03-31 16:32:03

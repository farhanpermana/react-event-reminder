import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

export const Reminder = sequelize.define('Reminder', {
  code: DataTypes.STRING,
  content: DataTypes.TEXT,
  username: DataTypes.STRING,
  referenceType: DataTypes.STRING,
  referenceCode: DataTypes.STRING,
  type: DataTypes.ENUM('email', 'telegram'),
  scheduleType: DataTypes.ENUM('everyday', 'workingday'),
  targetTime: DataTypes.STRING, // 'HH:mm' format
});
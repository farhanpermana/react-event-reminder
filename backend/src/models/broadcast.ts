import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// This model represents broadcast entries synced from Google Sheets
interface BroadcastAttributes {
  id: number;
  code: string;
  content: string;
  username?: string;
  imageUrl?: string;
  imageType?: 'asset' | 'url';
  referenceType?: 'tryout-section' | 'course';
  referenceCode?: string;
  type: 'telegram' | 'email';
  scheduleType: 'every_day' | 'working_day' | 'on-going';
  targetTime: string;
  lastExecuted?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BroadcastCreationAttributes extends Optional<BroadcastAttributes, 'id'> {}

class Broadcast extends Model<BroadcastAttributes, BroadcastCreationAttributes> implements BroadcastAttributes {
  public id!: number;
  public code!: string;
  public content!: string;
  public username?: string;
  public imageUrl?: string;
  public imageType?: 'asset' | 'url';
  public referenceType?: 'tryout-section' | 'course';
  public referenceCode?: string;
  public type!: 'telegram' | 'email';
  public scheduleType!: 'every_day' | 'working_day' | 'on-going';
  public targetTime!: string;
  public lastExecuted?: Date;
  public isActive!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Broadcast.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    imageType: {
      type: DataTypes.ENUM('asset', 'url'),
      allowNull: true,
    },
    referenceType: {
      type: DataTypes.ENUM('tryout-section', 'course'),
      allowNull: true,
    },
    referenceCode: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('telegram', 'email'),
      allowNull: false,
    },
    scheduleType: {
      type: DataTypes.ENUM('every_day', 'working_day', 'on-going'),
      allowNull: false,
    },
    targetTime: {
      type: DataTypes.STRING(),
      allowNull: false,
    },
    lastExecuted: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'broadcasts',
    sequelize,
  }
);

export default Broadcast;

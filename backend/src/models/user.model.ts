// src/models/User.ts
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserAttributes {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  data?: any;  // JSON field to store additional data
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public fullName!: string;
  public phoneNumber!: string | undefined;
  public data!: any;
  public isActive!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to get Telegram ID

  // Add this static method to your User class
static async findByTelegramId(telegramId: number): Promise<User | null> {
  return User.findOne({
    where: sequelize.literal(`JSON_EXTRACT(data, '$.telegram.id') = ${telegramId}`),
  });
}

 // Helper method to get Telegram ID
public getTelegramId(): number | null {
  try {
    let parsedData = this.data;

    // If the data field is a string, parse it
    if (typeof this.data === 'string') {
      parsedData = JSON.parse(this.data);
    }

    const telegramId = parsedData?.telegram?.id;
    return typeof telegramId === 'number' ? telegramId : null;
  } catch (error) {
    console.error('Error getting Telegram ID:', error);
    return null;
  }
}


  // Helper method to set Telegram ID
  public setTelegramId(telegramId: number): void {
    const currentData = this.data ?? {};
    this.data = {
      ...currentData,
      telegram: {
        ...(currentData.telegram ?? {}),
        id: telegramId
      }
    };
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'users',
    sequelize,
  }
);

export default User;
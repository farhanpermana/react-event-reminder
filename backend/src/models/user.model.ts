import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface UserAttributes {
  id: string;               // Primary key, UUID
  fullName: string;         // Nama lengkap pengguna
  username: string;         // Nama pengguna (unik)
  email: string;            // Alamat email (unik)
  phoneNumber?: string;     // Nomor telepon (unik)
  password: string;         // Password yang di-hash
  isActive: number;         // Status aktif (0 = tidak aktif, 1 = aktif)
  data: Record<string, any>; // Data tambahan pengguna dalam format JSON
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'data'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public fullName!: string;
  public username!: string;
  public email!: string;
  public phoneNumber?: string;
  public password!: string;
  public data!: Record<string, any>;
  public isActive!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper to get Telegram ID if stored under data
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

  // Helper to set Telegram ID
  public setTelegramId(telegramId: number): void {
    this.data = { ...this.data, telegram: { id: telegramId } };
  }

  // Find by Telegram ID
  static async findByTelegramId(telegramId: number): Promise<User | null> {
    return User.findOne({
      where: sequelize.literal(
        `JSON_EXTRACT(data, '$.telegram.id') = ${telegramId}`
      ),
    });
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
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
    timestamps: true,
  }
);

export default User;

import { QueryInterface, DataTypes } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('broadcasts', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
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
        type: DataTypes.STRING,
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
        type: DataTypes.STRING,
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
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('broadcasts');
  },
};

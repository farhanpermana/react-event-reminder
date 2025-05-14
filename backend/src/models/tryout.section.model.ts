// src/models/TryoutSection.ts
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TryoutSectionAttributes {
  id: string;
  code: string; // Kode unik section tryout (string to accommodate both implementations)
  title: string; // Judul section
  description?: string | null; // Deskripsi section
  courseId?: number; // Reference to course, but no formal relation
  startDateTime?: Date; // Waktu mulai tryout section
  endDateTime?: Date; // Waktu selesai tryout section
  order?: number; // Urutan tampilan section
  data?: any; // Data tambahan dalam format JSON
  tag?: string; // Tag atau label terkait section
  isActive: boolean; // Status aktif (true = aktif, false = tidak aktif)
  createdAt?: Date;
  updatedAt?: Date;
}

interface TryoutSectionCreationAttributes extends Optional<TryoutSectionAttributes, 'id'> {}

class TryoutSection extends Model<TryoutSectionAttributes, TryoutSectionCreationAttributes> implements TryoutSectionAttributes {
  public id!: string;
  public code!: string;
  public title!: string;
  public description!: string | undefined;
  public courseId!: number | undefined;
  public startDateTime!: Date | undefined;
  public endDateTime!: Date | undefined;
  public order!: number | undefined;
  public data!: any;
  public tag!: string | undefined;
  public isActive!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TryoutSection.init(
  {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },      
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    courseId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true, // Made optional
      // No references to Course model
    },
    startDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'tryout_sections',
    sequelize,
    timestamps: true,
  }
);

// No associations with Course model

export default TryoutSection;
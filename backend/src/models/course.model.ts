// src/models/Course.ts
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CourseAttributes {
  id: string; 
  code: string; // Kode kursus (unik)
  title: string; // Judul kursus
  description?: string | null;  // Deskripsi kursus
  startDate: Date; // Tanggal mulai kursus
  endDate: Date; // Tanggal selesai kursus
  order?: number; // Urutan kursus (untuk penempatan)
  data?: any; // Data tambahan dalam format JSON
  tag?: string; // Tag atau label kursus
  isActive: boolean; // Status aktif (true = aktif, false = tidak aktif)
  createdAt?: Date;
  updatedAt?: Date;
}

interface CourseCreationAttributes extends Optional<CourseAttributes, 'id'> {}

class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  public id!: string;
  public code!: string;
  public title!: string;
  public description!: string | undefined;
  public startDate!: Date;
  public endDate!: Date;
  public order!: number | undefined;
  public data!: any;
  public tag!: string | undefined;
  public isActive!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Course.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },    
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false, // Keep as false based on the second model
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
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
    tableName: 'courses',
    sequelize,
    timestamps: true, // Enabling timestamps based on the second model
  }
);

export default Course;
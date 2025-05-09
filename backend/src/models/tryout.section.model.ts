import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import Course from './course.model';

interface TryoutSectionAttributes {
  id: number;
  code: string;
  title: string;
  courseId: number;
  startDateTime: Date;
  endDateTime: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TryoutSectionCreationAttributes extends Optional<TryoutSectionAttributes, 'id'> {}

class TryoutSection extends Model<TryoutSectionAttributes, TryoutSectionCreationAttributes> implements TryoutSectionAttributes {
  public id!: number;
  public code!: string;
  public title!: string;
  public courseId!: number;
  public startDateTime!: Date;
  public endDateTime!: Date;
  public isActive!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TryoutSection.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
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
    courseId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Course,
        key: 'id',
      },
    },
    startDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
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
  }
);

TryoutSection.belongsTo(Course, { foreignKey: 'courseId' });
Course.hasMany(TryoutSection, { foreignKey: 'courseId' });

export default TryoutSection;
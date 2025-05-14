// src/utils/helpers.ts
import moment from 'moment-timezone';
import { timezone } from '../config/scheduler';
import { faker } from '@faker-js/faker';

export const formatDateTime = (date: Date): string => {
  return moment(date).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
};

export const isWeekday = (date: Date = new Date()): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
};

// Generate random user data for Telegram users
export const generateRandomUser = () => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const fullName = `${firstName} ${lastName}`;
  const password = faker.internet.password();
  
  // Generate a username with random numbers appended
  let username = `${firstName.toLowerCase()}${lastName.substring(0, 2).toLowerCase()}${Math.floor(Math.random() * 1000)}`;
  username = username.replace(/[^a-z0-9]/g, ''); // Remove special characters
  
  return {
    username,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    fullName,
    phoneNumber: faker.phone.number(),
    password
  };
};
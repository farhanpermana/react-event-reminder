// utils/time.ts
import moment from 'moment-timezone';
import { timezone } from '../config/scheduler';

export function parseTargetTime(startDate: Date, targetTime: string): Date | null {
  const m = moment.tz(startDate, timezone);

  if (/^(\d+)d$/.test(targetTime)) {
    const days = parseInt(targetTime);
    return m.subtract(days, 'days').toDate();
  }

  if (/^(\d+)h$/.test(targetTime)) {
    const hours = parseInt(targetTime);
    return m.subtract(hours, 'hours').toDate();
  }

  return null;
}

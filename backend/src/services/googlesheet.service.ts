// src/services/googleSheet.ts
import { JWT } from 'google-auth-library';
import { google, sheets_v4 } from 'googleapis';
import dotenv from 'dotenv';
import { Broadcast } from '../models';
import { Op } from 'sequelize';

dotenv.config();

interface SheetRow {
  code: string;
  content: string;
  username?: string;
  image?: string;
  imageType?: 'asset' | 'url';
  referenceType?: 'tryout-section' | 'course';
  referenceCode?: string;
  type: 'telegram' | 'email';
  scheduleType: 'every_day' | 'working_day' | 'on-going';
  targetTime: string;
}

class GoogleSheetService {
  private readonly client: JWT;
  private readonly sheetsApi: sheets_v4.Sheets;
  private readonly spreadsheetId: string = process.env.GOOGLE_SHEET_ID!;
  private readonly range: string = 'reminder'; // Adjust as needed

  constructor() {
    this.client = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheetsApi = google.sheets({ version: 'v4', auth: this.client });
  }

  async fetchAll(): Promise<SheetRow[]> {
    const { data } = await this.sheetsApi.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${this.range}`,
    });

    const rows = data.values;
    if (!rows || rows.length < 2) return [];

    const headers = rows[0];
    const result: SheetRow[] = rows.slice(1).map((row) => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] ?? '';
      });

      return {
        code: obj.code?.toUpperCase(),
        content: obj.content,
        username: obj.username ?? undefined,
        image: obj.image ?? undefined,
        imageType: ['asset', 'url'].includes(obj.imageType?.toLowerCase())
          ? (obj.imageType.toLowerCase() as 'asset' | 'url')
          : undefined,
        referenceType: ['tryout-section', 'course'].includes(obj.referenceType)
          ? (obj.referenceType as 'tryout-section' | 'course')
          : undefined,
        referenceCode: obj.referenceCode ?? undefined,
        type: obj.type as 'telegram' | 'email',
        scheduleType: obj.scheduleType as 'every_day' | 'working_day' | 'on-going',
        targetTime: obj.targetTime,
      };
    });

    return result;
  }

  async getMessageByCode(code: string): Promise<string | null> {
    const sheetRows = await this.fetchAll();
    const row = sheetRows.find((row) => row.code === code.toUpperCase());

    return row?.content ?? null;
  }

  async syncToDatabase() {
    const sheetRows = await this.fetchAll();

    for (const row of sheetRows) {
      if (!row.code || !row.content || !row.type || !row.scheduleType || !row.targetTime) continue;

      const [broadcast, created] = await Broadcast.findOrCreate({
        where: { code: row.code, type: row.type },
        defaults: {
          code: row.code,
          type: row.type,
          content: row.content,
          username: row.username,
          imageUrl: row.image,
          imageType: row.imageType,
          referenceType: row.referenceType,
          referenceCode: row.referenceCode,
          scheduleType: row.scheduleType,
          targetTime: row.targetTime,
          isActive: true,
        },
      });

      if (!created) {
        await broadcast.update({
          content: row.content,
          username: row.username,
          imageUrl: row.image,
          imageType: row.imageType,
          referenceType: row.referenceType,
          referenceCode: row.referenceCode,
          scheduleType: row.scheduleType,
          targetTime: row.targetTime,
          isActive: true,
        });
      }
    }

    const codes = sheetRows.map((row) => row.code);
    await Broadcast.update(
      { isActive: false },
      {
        where: {
          code: {
            [Op.notIn]: codes,
          },
        },
      }
    );

    return {
      synced: sheetRows.length,
      message: `Successfully synced ${sheetRows.length} broadcasts from Google Sheets`,
    };
  }
}

export default new GoogleSheetService();

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
        let syncedCount = 0;

        // Kumpulkan semua kode yang ada di Google Sheet
        const sheetCodes = new Set<string>();
        for (const row of sheetRows) {
            if (row.code) { // Pastikan kode ada sebelum menambahkannya
                sheetCodes.add(row.code);
            }
        }

        // 1. Upsert (perbarui/buat) record dari Google Sheet
        for (const row of sheetRows) {
            if (!row.code || !row.content || !row.type || !row.scheduleType || !row.targetTime) {
                console.warn(`Skipping incomplete row from sheet:`, row);
                continue;
            }

            await Broadcast.upsert({
                code: row.code,
                content: row.content,
                username: row.username,
                imageUrl: row.image,
                imageType: row.imageType,
                referenceType: row.referenceType,
                referenceCode: row.referenceCode,
                type: row.type,
                scheduleType: row.scheduleType,
                targetTime: row.targetTime,
                isActive: true // Set aktif untuk record yang ada di sheet
            });
            syncedCount++;
        }

        // 2. Deaktivasi atau Hapus record yang tidak lagi ada di Google Sheet
        // Kamu bisa memilih antara menghapus (destroy) atau menonaktifkan (update isActive: false)
        // MenNonaktifkan (Soft Delete) biasanya lebih aman untuk audit trail
        const recordsToDeactivate = await Broadcast.findAll({
            where: {
                // Temukan semua record di DB yang code-nya TIDAK ada di sheetCodes
                code: {
                    [Op.notIn]: Array.from(sheetCodes)
                },
                isActive: true // Hanya yang aktif, untuk menghindari re-deaktivasi yang tidak perlu
            }
        });

        let deactivatedCount = 0;
        for (const record of recordsToDeactivate) {
            await record.update({ isActive: false }); // Nonaktifkan record
            deactivatedCount++;
        }

        // Atau, jika kamu ingin menghapus secara permanen:
        // const deletedCount = await Broadcast.destroy({
        //     where: {
        //         code: {
        //             [Op.notIn]: Array.from(sheetCodes)
        //         }
        //     }
        // });


        return {
            synced: syncedCount,
            deactivated: deactivatedCount, // Tambahkan ini di respons
            message: `Successfully synced ${syncedCount} broadcasts and deactivated ${deactivatedCount} non-existent broadcasts from Google Sheets.`,
        };
    }
}

export default new GoogleSheetService();

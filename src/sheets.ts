import { google } from 'googleapis';
import { authClient, spreadsheetIds, AUTH_ERRORS } from './constants';

type SheetData = string | number;

export default class GoogleSheet {
  spreadsheetId;
  sheets;

  writable(range: string, data: SheetData[][]) {
    return {
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: {
        values: data
      }
    } as const;
  }

  constructor(accessToken: string) {
    const { dev: devSheetId, production: prodSheetId } = spreadsheetIds;
    this.spreadsheetId = process.env.NODE_ENV === 'production' ? prodSheetId : devSheetId;
    const auth = authClient();
    try {
      auth.setCredentials({
        access_token: accessToken
      });

      this.sheets = google.sheets({
        version: 'v4',
        auth,
      });
    } catch (err) {
      throw AUTH_ERRORS.INVALID_GOOGLE_OAUTH_ACCESS_TOKEN;
    }
  }

  async getRange(range: string) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range,
    });

    return response.data.values;
  }

  async getRanges(ranges: string[]) {
    const response = await this.sheets.spreadsheets.values.batchGet({
      spreadsheetId: this.spreadsheetId,
      ranges,
    });

    return response.data.valueRanges;
  }

  async deleteByRow(range: string, row: number) {
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: `${range}!A${row}:Z${row}`,
    });
  }

  async updateByRow(range: string, row: number, data: SheetData[][]) {
    await this.sheets.spreadsheets.values.update(
      this.writable(`${range}!A${row}:Z${row}`, data)
    );
  }

  async postInRange(range: string, data: SheetData[][]) {
    const rangeData = await this.getRange(range);

    if (!rangeData) {
      throw new Error('Range not found');
    }

    if (data.length > 1) {
      await this.sheets.spreadsheets.values.update(
        this.writable(range, [
          ...rangeData,
          ...data,
        ])
      );
      return rangeData.length + 1;
    }

    let insertRow = rangeData.findIndex(row => row.join('') === '');
    insertRow = insertRow === -1 ? rangeData.length + 1 : insertRow + 1;

    await this.sheets.spreadsheets.values.update(
      this.writable(`${range}!A${insertRow}:Z${insertRow}`, data)
    );

    return insertRow;
  }

  async replaceRange(range: string, data: SheetData[][]) {
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range,
    });

    const payload = this.writable(range, data);
    await this.sheets.spreadsheets.values.update(payload);
  }
}
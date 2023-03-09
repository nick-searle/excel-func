import IExcelBlob from "../types/IExcelBlob";
import ICrudService from "../types/ICrudService";
import * as Excel from "exceljs";
import * as fs from "fs"
import * as Base64Buffer from "base64-arraybuffer"

import IPurchaseOrder from "../types/IPurchaseOrder";
import IColumnMap from "../types/IColumnMap";
import { on } from "events";

export default class ExcelService<T extends IPurchaseOrder> {
  private excelDataService: ICrudService<IExcelBlob>;
  private userId: string;

  constructor(userId: string, excelDataService: ICrudService<IExcelBlob>) {
    this.userId = userId;
    this.excelDataService = excelDataService;
  }

  // Persist object as excel file based on mapping
  // Returns base64 string of excel doc
  public createFile = async (pageName: string, obj: T[], mapping: IColumnMap[]): Promise<IExcelBlob> => {
    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet(pageName);

    sheet.columns = mapping
      .sort((a, b) => a.order - b.order)
      .map(map => { 
        return <Excel.Column> 
        { 
          key: map.propName, 
          header: map.columnName 
        };
      });
    
    sheet.addRows(obj);

    const buffer = await workbook.xlsx.writeBuffer() as Buffer;
    const base64 = Base64Buffer.encode(buffer);

    const excelBlob: IExcelBlob = 
    {
      id: new Date(new Date().toUTCString()).toISOString() + "~" + this.userId,
      data: base64
    }

    const item = await this.excelDataService.persistItem(excelBlob);

    //this.writeExcelToFile(item);
      
    return item;
  }

  public getExcelFile = async (id: string): Promise<IExcelBlob> => {
    return await this.excelDataService.getItemById(id);
  }

  public getFromExcelFile = async (pageName: string, base64String: string, mapping: IColumnMap[]): Promise<T[]> => {
    const workbook = new Excel.Workbook();
    const buffer = Base64Buffer.decode(base64String);
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets.filter(w => w.name === pageName)[0];

    if (!sheet) {
      throw new Error("Page not found");
    }

    const headerMap: Map<string, number> = new Map();
    sheet
      .getRows(1, 1)[0]
      .eachCell((cell, index) => 
        headerMap.set(
          mapping.find(m => m.columnName === cell.value.toString()).propName
          , index));
    
    // TODO: Should probably make the column mapping a mapped type but time
    const rows = sheet.getRows(2, sheet.rowCount - 1);
    const objs = rows
      .map(r => {
        const obj: unknown = {};
        headerMap.forEach((v, k) => {
          obj[k] = r.getCell(v).value;
        })
        return obj as T;
      });

      return objs;
  }

  public writeExcelToFile = (excelBlob: IExcelBlob): void => {
    const buffer = Base64Buffer.decode(excelBlob.data);
    
    fs.appendFile("./test.xlsx", Buffer.from(buffer), function (err) {
      if (err) {
        throw err;
      }
    });
  }
}
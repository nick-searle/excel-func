import IExcelBlob from "../types/IExcelBlob";
import ICrudService from "../types/ICrudService";
import * as Excel from "exceljs";
import * as fs from "fs"
import * as Base64Buffer from "base64-arraybuffer"

import IPurchaseOrder from "../types/IPurchaseOrder";
import IColumnMap from "../types/IColumnMap";

export default class ExcelService<T extends IPurchaseOrder> {
  private excelDataService: ICrudService<IExcelBlob>;
  private userId: string;

  constructor(userId: string, excelDataService: ICrudService<IExcelBlob>) {
    this.userId = userId;
    this.excelDataService = excelDataService;
  }

  // Persist object as excel file based on mapping
  // Returns base64 string of excel doc
  public createFile = async (pageName: string, obj: T[], mapping: IColumnMap[]): Promise<IExce> => {
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
      
    return item;
  }

  public getExcelFile = async (id: string) => {
    return await this.excelDataService.getItemById(id);
  }

  public writeBufferToFile = (buffer: Buffer) => {
    fs.appendFile("./test.xlsx", buffer, function (err) {
      if (err) {
        throw err;
      }
    });
  }
}

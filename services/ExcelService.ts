import IExcelBlob from "../types/IExcelBlob";
import StorageHelper from "../helpers/StorageHelper";
import ICrudService from "../types/ICrudService";

export default class ExcelService<T> {
  private excelDataService: ICrudService<IExcelBlob>;

  constructor(excelDataService: ICrudService<IExcelBlob>) {
    this.excelDataService = excelDataService;
  }

  // TODO: Create mapping dictionary of func<T> -> string
  // Persist object as excel file based on mapping
  // Returns base64 string of excel doc
  public createFile = (obj: T): string => {
    return "EXCEL GOES HERE";
  }
}

import IExcelBlob from "../types/IExcelBlob";
import StorageHelper from "../helpers/StorageHelper";

export default class ExcelDataService extends StorageHelper<IExcelBlob> {
  constructor(userId: string) {
    super(userId, "excelDocs");
  }

  getItemById = async (id: string): Promise<IExcelBlob> => {
    const item = await this.getItemByIdInternal(id);
    if (item) {
      return item;
    }
    throw console.error(`Excel blob with id: {id}`);
  }
  
  getItems = async (): Promise<IExcelBlob[]> => {
    return await this.getItemsInternal();
  }

  persistItem = async (excelBlob: IExcelBlob): Promise<IExcelBlob> => {
    return await this.persistItemInternal(excelBlob);
  }

  deleteItem = async (excelBlobId: string): Promise<void> => {
    await this.deleteItemInternal({ id: excelBlobId });
  }

  purgeCollection = async (): Promise<void> => {
    await this.purgeCollectionInternal();
  }
}

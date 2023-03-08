import IStorageType from "./IStorageType";

export default interface IExcelBlob extends IStorageType {
  id: string;
  data: string;
}

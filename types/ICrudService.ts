import IStorageType from "./IStorageType";

export default interface ICrudService<T extends IStorageType> {
  getItems: () => Promise<T[]>;
  getItemById: (id: string) => Promise<T>;
  persistItem: (item: T) => Promise<T>;
  deleteItem: (id: string) => Promise<void>;
  purgeCollection: () => Promise<void>;
}

import IPurchaseOrder from "./IPurchaseOrder";

export default interface IRequestBody {
  orders: IPurchaseOrder[];
}
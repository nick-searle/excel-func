import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import ExcelDataService from "../dataServices/ExcelDataService";
import * as ResponseHelper from "../helpers/ResponseHelper"
import ExcelService from "../services/ExcelService";
import IPurchaseOrder from "../types/IPurchaseOrder";

const checkOrders = (orders: IPurchaseOrder[]): boolean => {
    return orders.some(order => order.vendorComment && order.vendorComment.length > 0);
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  try {
    if (!req.params.userId) {
      context.res = ResponseHelper.notFound();
      return;
    }

    const excelService = new ExcelService(new ExcelDataService(req.params.userId));
    switch (req.method) {
    //   case "GET":
    //     context.res = ResponseHelper.success(await excelService.getItems());
    //     return;
      case "POST":
      case "PUT":
        if (!req.body.orders) {
          context.res = ResponseHelper.badRequest("orders should be set as an array of purchase orders");
          return;
        }
        if (checkOrders(req.body.orders)) {
            context.res = ResponseHelper.badRequest("vendorComment should not be set");
            return;
        }
        context.res = ResponseHelper.success(excelService.createFile(req.body));
        return;
    //   case "DELETE":
    //     if (!req.params.id) {
    //         excelService.purgeCollection();
    //       return;
    //     }
    //     await billDataService.deleteItem(req.params.id)
    //     context.res = ResponseHelper.success();
    //     return;
      default:
        context.res = ResponseHelper.notFound();
        return;
    }
  }
  catch (error) {
    context.res = ResponseHelper.error(error.toString());
  }
}

export default httpTrigger;

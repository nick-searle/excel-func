import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import ExcelDataService from "../dataServices/ExcelDataService";
import * as ResponseHelper from "../helpers/ResponseHelper"
import ExcelService from "../services/ExcelService";
import IColumnMap from "../types/IColumnMap";
import IPurchaseOrder from "../types/IPurchaseOrder";
import IRequestBody from "../types/IRequestBody";

const checkOrders = (orders: IPurchaseOrder[]): boolean => {
    return orders.some(order => order.vendorComment && order.vendorComment.length > 0);
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  try {
    if (!req.params.vendorId) {
      context.res = ResponseHelper.notFound();
      return;
    }

    const excelService = new ExcelService<IPurchaseOrder>(req.params.userId, new ExcelDataService(req.params.vendorId));
    switch (req.method) {
      case "GET":
        if (!req.body.blobId) {
          context.res = ResponseHelper.badRequest("expected blobId");
          return;
        }
        context.res = ResponseHelper.success(await excelService.getExcelFile(req.params.blobId));
        return;
      case "POST":
      case "PUT":
        if (!req.body.orders) {
          context.res = ResponseHelper.badRequest("expected orders array and userid");
          return;
        }
        const request = req.body as IRequestBody;
        if (checkOrders(request.orders)) {
            context.res = ResponseHelper.badRequest("vendorComment should not be set");
            return;
        }
        const mapping: IColumnMap[] = [
          { propName: 'id', columnName: 'Purchase Order ID', order: 1 },
          { propName: 'apptDate', columnName: 'Appointment Date', order: 3 },
          { propName: 'comment', columnName: 'Kroger Comment', order: 2 },
          { propName: 'vendorComment', columnName: 'Vendor Comment', order: 4 },
        ];
        context.res = ResponseHelper.success(await excelService.createFile("Purchase Orders", request.orders, mapping));
        return;
    //   case "DELETE": AT YOUR OWN RISK
    //     if (!req.params.id) {
    //         ExcelDataService.purgeCollection();
    //       return;
    //     }
    //     await ExcelDataService.deleteItem(req.params.id)
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

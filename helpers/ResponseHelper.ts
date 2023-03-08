import { IHttpResponse } from "../types/IHttpResponse";

export const notFound = <T>(): IHttpResponse<T> => {
  return {
    status: 404,
    contentType: 'application/json'
  };
}

export const badRequest = <T>(body: T | undefined = undefined): IHttpResponse<T> => {
  return {
    status: 400,
    body: body,
    contentType: 'application/json'
  };
}

export const success = <T>(body: T | undefined = undefined): IHttpResponse<T> => {
  return {
    status: 200,
    body: body,
    contentType: 'application/json'
  };
}

export const error = <T>(error: T | undefined = undefined): IHttpResponse<T> => {
  return {
    status: 404,
    body: error,
    contentType: 'application/json'
  };
}

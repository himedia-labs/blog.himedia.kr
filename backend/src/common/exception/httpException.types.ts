export type ExceptionMessage = string | string[];

export interface StandardErrorResponse {
  statusCode: number;
  message: ExceptionMessage;
  path: string;
  timestamp: string;
}

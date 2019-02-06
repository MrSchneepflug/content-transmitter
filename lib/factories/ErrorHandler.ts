import {isJsonSchemaValidationError} from "ejvm";
import {ErrorRequestHandler, NextFunction, Request, Response} from "express";
import LoggerInterface from "../interfaces/LoggerInterface";
import NullLogger from "../NullLogger";

export function createErrorHandler(logger: LoggerInterface = NullLogger): ErrorRequestHandler {
  return (err: Error, req: Request, res: Response, next: NextFunction): void => {
    if (isJsonSchemaValidationError(err)) {
      logger.warn("request failed due to JSON schema validation errors", err.validationErrors);
      res.status(400).json({errors: err.validationErrors});
    } else {
      next(err);
    }
  };
}

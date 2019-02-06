import {NextFunction, Request, RequestHandler, Response} from "express";
import {NProducer} from "sinek";
import LoggerInterface from "../interfaces/LoggerInterface";
import NullLogger from "../NullLogger";

export function createRequestHandler(
  producer: NProducer,
  topic: string,
  identifierFn: () => string,
  logger: LoggerInterface = NullLogger,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = identifierFn();

    const logPayload = {
      identifier,
      topic,
      url: req.body.url,
    };

    try {
      await producer.buffer(topic, identifier, {url: req.body.url}, undefined, 1);
    } catch (err) {
      logger.error(`failed to add url to crawler-queue`, {...logPayload, error: err.message});
      res.status(500).json({error: err.message});
      return;
    }

    logger.info(`added url to crawler-queue`, logPayload);
    res.status(201).json({identifier});
  };
}

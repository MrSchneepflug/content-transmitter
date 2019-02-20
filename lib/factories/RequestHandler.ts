import {validate} from "ejvm";
import {NextFunction, Request, RequestHandler, Response} from "express";
import {NProducer} from "sinek";
import LoggerInterface from "../interfaces/LoggerInterface";
import NullLogger from "../NullLogger";

const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  properties: {
    url: {
      type: "string",
    },
  },
  required: ["url"],
  type: "object",
};

/**
 * Creates a request-handler for Express with pre-attached JSON-schema validation middleware.
 *
 * The request-handler takes the url out of the JSON payload which is validated by the middleware beforehand.
 * It uses the producer to publish the url to the configured topic and uses the provided identifier-function to
 * generate a key for Kafka. Pass in an optional logger instance to get some useful debugging information.
 *
 * @param {NProducer} producer - configured NProducer (sinek)
 * @param {string} topic - topic to produce to
 * @param {() => string} identifierFn - function which returns the key for kafka
 * @param {LoggerInterface} logger - optional logger with debug-, info-, warn- and error-property
 * @returns {Promise<void>}
 */
export function createCrawlerEnqueueHandler(
  producer: NProducer,
  topic: string,
  identifierFn: () => string,
  logger: LoggerInterface = NullLogger,
): [RequestHandler, RequestHandler] {
  return [
    validate(schema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const identifier = identifierFn();

      const logPayload = {
        identifier,
        topic,
        url: req.body.url,
      };

      try {
        await producer.buffer(topic, identifier, {url: req.body.url}, undefined, 1);
      } catch (error) {
        logger.error("failed to add url to crawler-queue", {...logPayload, error: error.message});
        res.status(503).json({error: error.message});
        return;
      }

      logger.info("added url to crawler-queue", logPayload);
      res.status(201).json({identifier});
    },
  ];
}

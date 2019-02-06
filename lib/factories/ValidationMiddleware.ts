import {validate} from "ejvm";
import {RequestHandler} from "express";

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

export function createValidationMiddleware(): RequestHandler {
  return validate(schema);
}

import assert from "assert";
import {isJsonSchemaValidationError, JsonSchemaValidationError} from "ejvm";
import httpMocks from "node-mocks-http";
import sinon from "sinon";
import {createErrorHandler, createRequestHandler, createValidationMiddleware} from "../../";

function createMocks() {
  const {req, res} = httpMocks.createMocks();
  req.body = {url: "https://www.dummyurl.com"};

  return {
    next: sinon.stub(),
    producer: {buffer: sinon.stub()},
    req,
    res,
  };
}

describe("factories", () => {
  describe("request-handler factory", async () => {
    describe("creates a request-handler that", () => {
      describe("in a successful case", () => {
        const {next, producer, req, res} = createMocks();
        const requestHandler = createRequestHandler(producer as any, "test-topic", () => "test-identifier");

        before(async () => {
          await requestHandler(req, res, next);
        });

        it("calls the producer", () => {
          assert.strictEqual(producer.buffer.callCount, 1);
        });

        it("writes to provided topic", () => {
          assert.strictEqual(producer.buffer.getCall(0).args[0], "test-topic");
        });

        it("uses provided identifier", () => {
          assert.strictEqual(producer.buffer.getCall(0).args[1], "test-identifier");
        });

        it("uses the url of the request as payload", () => {
          assert.deepEqual(producer.buffer.getCall(0).args[2], {url: "https://www.dummyurl.com"});
        });

        it("returns a 201 status code", () => {
          assert.strictEqual(res.statusCode, 201);
        });

        it("includes the identifier within the response", () => {
          const parsedResponse = JSON.parse(res._getData());
          assert.strictEqual(parsedResponse.identifier, "test-identifier");
        });

        it("does not forward to the next middleware", () => {
          assert.strictEqual(next.callCount, 0);
        });
      });

      describe("if the producer fails", () => {
        const {next, producer, req, res} = createMocks();
        producer.buffer.rejects();

        const requestHandler = createRequestHandler(producer as any, "test-topic", () => "test-identifier");

        before(async () => {
          try {
            await requestHandler(req, res, next);
          } catch (error) {
            // do nothing
          }
        });

        it("returns a 500 status code", () => {
          assert.strictEqual(res.statusCode, 500);
        });

        it("does not forward to the next middleware", () => {
          assert.strictEqual(next.callCount, 0);
        });
      });
    });
  });

  describe("validation-middleware factory", () => {
    const validationMiddleware = createValidationMiddleware();
    const {req, res} = httpMocks.createMocks();
    const next = sinon.stub();

    afterEach(() => {
      next.reset();
    });

    describe("creates a validation-middleware that", () => {
      it("forwards to the next middleware with a valid url", () => {
        req.body = {url: "https://www.dummyurl.com"};
        validationMiddleware(req, res, next);

        assert.strictEqual(next.callCount, 1);
        assert(next.getCall(0).args.length === 0);
      });

      it("forwards to the error-handler with an invalid url", () => {
        req.body = {url: 12345};
        validationMiddleware(req, res, next);

        assert.strictEqual(next.callCount, 1);
        assert(isJsonSchemaValidationError(next.getCall(0).args[0]));
      });
    });
  });

  describe("error-handler factory", () => {
    const errorHandler = createErrorHandler();
    const req = httpMocks.createRequest();
    const next = sinon.stub();

    afterEach(() => {
      next.reset();
    });

    describe("creates an error-handler that", () => {
      it("forwards to the next error-handler if the error is not a JsonSchemaValidationError", () => {
        const error = new Error();
        const res = httpMocks.createResponse();
        errorHandler(error, req, res, next);

        assert.strictEqual(next.callCount, 1);
        assert.strictEqual(next.getCall(0).args[0], error);
      });

      describe("if the error is a JsonSchemaValidationError", () => {
        const error = new JsonSchemaValidationError([{
          dataPath: "",
          keyword: "required",
          message: "should have required property 'url'",
          params: {
            missingProperty: "url",
          },
          schemaPath: "#/required",
        }]);

        it("returns a 400 status code", () => {
          const res = httpMocks.createResponse();
          errorHandler(error, req, res, next);

          assert.strictEqual(next.callCount, 0);
          assert.strictEqual(res.statusCode, 400);
        });

        it("returns an error message", () => {
          const res = httpMocks.createResponse();
          errorHandler(error, req, res, next);

          const parsedResponse = JSON.parse(res._getData());

          assert.strictEqual(next.callCount, 0);
          assert.strictEqual(parsedResponse.errors[0].message, "should have required property 'url'");
        });
      });
    });
  });
});

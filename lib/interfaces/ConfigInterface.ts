import LoggerInterface from "./LoggerInterface";

export default interface ConfigInterface {
  consumeFrom: string;
  produceTo: string;
  logger?: LoggerInterface | undefined;
  producerPartitionCount?: number;
  crawler?: {
   maxConnections?: number;
   rateLimit?: number;
  };
}

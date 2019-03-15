import {merge} from "lodash";
import ConfigInterface from "./lib/interfaces/ConfigInterface";

import {BatchConfig, KafkaConsumerConfig, KafkaProducerConfig} from "sinek";
import Processor from "./lib/Processor";

const defaultConfig: ConfigInterface = {
  consumeFrom: "crawler-request",
  produceTo: "crawler-response",
};

const defaultConsumerConfig: KafkaConsumerConfig = {
  groupId: "crawler",
};

const defaultProducerConfig: KafkaProducerConfig = {
  clientName: "crawler",
};

const defaultBatchConfig: BatchConfig = {
  batchSize: 5,
  commitEveryNBatch: 1,
  concurrency: 1,
  commitSync: false,
  noBatchCommits: false,
  manualBatching: true,
  sortedManualBatch: false,
};

export default (
  config: ConfigInterface,
  consumerConfig: KafkaConsumerConfig,
  producerConfig: KafkaProducerConfig,
  batchConfig: BatchConfig,
): Processor => new Processor(
  merge(defaultConfig, config),
  merge(defaultConsumerConfig, consumerConfig),
  merge(defaultProducerConfig, producerConfig),
  merge(defaultBatchConfig, batchConfig),
);

export {Processor};
export {createCrawlerEnqueueHandler} from "./lib/factories/RequestHandler";
export {createErrorHandler} from "./lib/factories/ErrorHandler";

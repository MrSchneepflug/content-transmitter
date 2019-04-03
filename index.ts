import {merge} from "lodash";
import ConfigInterface from "./lib/interfaces/ConfigInterface";

import {KafkaConsumerConfig, KafkaProducerConfig} from "sinek";
import Processor from "./lib/Processor";

const defaultConfig: ConfigInterface = {
  consumeFrom: "crawler-request",
  produceTo: "crawler-response",
};

const defaultConsumerConfig: KafkaConsumerConfig = {
  groupId: "crawler",
  kafkaHost: "localhost:9092",
  // metadata.broker.list MUST be set via kafkaHost-property. If we set it here manually, it will be used as
  // an overwrite.
  //
  // @ts-ignore
  noptions: {
    "enable.auto.commit": false,
  },
  tconf: {
    "auto.offset.reset": "earliest",
  },
};

const defaultProducerConfig: KafkaProducerConfig = {
  clientName: "crawler",
};

export default (
  config: ConfigInterface,
  consumerConfig: KafkaConsumerConfig,
  producerConfig: KafkaProducerConfig,
): Processor => new Processor(
  merge(defaultConfig, config),
  merge(defaultConsumerConfig, consumerConfig),
  merge(defaultProducerConfig, producerConfig),
);

export {Processor};
export {createCrawlerEnqueueHandler} from "./lib/factories/RequestHandler";
export {createErrorHandler} from "./lib/factories/ErrorHandler";

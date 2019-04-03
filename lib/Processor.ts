import EventEmitter from "events";

import ConfigInterface from "./interfaces/ConfigInterface";
import {CrawlingRequest} from "./interfaces/CrawlingRequest";
import {CrawlingResponse} from "./interfaces/CrawlingResponse";
import LoggerInterface from "./interfaces/LoggerInterface";

import Consumer from "./kafka/Consumer";
import Producer from "./kafka/Producer";
import Crawler from "./web/Crawler";

import {KafkaConsumerConfig, KafkaProducerConfig} from "sinek";
import NullLogger from "./NullLogger";

export default class Processor extends EventEmitter {
  private readonly consumer: Consumer;
  private readonly producer: Producer;
  private readonly crawler: Crawler;
  private readonly logger: LoggerInterface;

  constructor(
    private config: ConfigInterface,
    consumerConfig: KafkaConsumerConfig,
    producerConfig: KafkaProducerConfig,
  ) {
    super();

    this.consumer = new Consumer(
      config.consumeFrom,
      consumerConfig,
      this.handleConsumerMessage.bind(this),
    );

    this.producer = new Producer(config.produceTo, config, producerConfig);
    this.crawler = new Crawler(config);

    this.consumer.on("error", this.handleError.bind(this));
    this.producer.on("error", this.handleError.bind(this));
    this.crawler.on("error", this.handleError.bind(this));

    this.logger = config.logger || NullLogger;
  }

  public async start(): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();
  }

  public close(): void {
    if (this.producer) {
        this.producer.close();
    }

    if (this.crawler) {
        this.crawler.close();
    }
  }

  private async handleConsumerMessage(message: CrawlingRequest): Promise<void> {
    const logPayload = {identifier: message.key.toString(), url: message.url};

    this.logger.info("starting crawling", logPayload);
    const startTime = new Date().getTime();

    let payload: CrawlingResponse | null = null;

    try {
      payload = await this.crawler.crawl(message.url);
    } catch (error) {
      this.logger.error("crawling failed", {error: error.message, ...logPayload});
      return;
    }

    const executionTime = new Date().getTime() - startTime;
    this.logger.info("finished crawling", {...logPayload, executionTime});

    // `payload` will not be null if the crawler resolves
    await this.producer.produce(message.key, payload!);
    this.logger.info("added content to queue", {...logPayload, topic: this.config.produceTo});
  }

  private handleError(error: Error): void {
    super.emit("error", error);
  }
}

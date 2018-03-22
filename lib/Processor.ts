import * as EventEmitter from "events";

import ConfigInterface from "./interfaces/ConfigInterface";
import ConsumerPayloadInterface from "./interfaces/ConsumerPayloadInterface";
import ProducerPayloadInterface from "./interfaces/ProducerPayloadInterface";

import Consumer from "./kafka/Consumer";
import Producer from "./kafka/Producer";
import Crawler from "./web/Crawler";

export default class Processor extends EventEmitter {

  private consumer: Consumer;
  private producer: Producer;
  private crawler: Crawler;

  constructor(config: ConfigInterface) {
    super();

    this.consumer = new Consumer(config, this.handleConsumerMessage.bind(this));
    this.producer = new Producer(config);
    this.crawler = new Crawler(config);

    this.consumer.on("error", this.handleError.bind(this));
    this.producer.on("error", this.handleError.bind(this));
    this.crawler.on("error", this.handleError.bind(this));
  }

  public async start(): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();
  }

  public close(): void {

    if (this.consumer) {
        this.consumer.close();
    }

    if (this.producer) {
        this.producer.close();
    }

    if (this.crawler) {
        this.crawler.close();
    }
  }

  private async handleConsumerMessage(message: ConsumerPayloadInterface): Promise<void> {
    const payload: ProducerPayloadInterface = await this.crawler.crawl(message.url);
    await this.producer.produce(message.key, payload);
  }

  private handleError(error: Error): void {
    super.emit("error", error);
  }
}

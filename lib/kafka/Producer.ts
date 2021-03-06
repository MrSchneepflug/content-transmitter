import EventEmitter from "events";

import {KafkaProducerConfig, NProducer as SinekProducer} from "sinek";

import {CrawlingResponse} from "../interfaces/CrawlingResponse";
import ConfigInterface from "./../interfaces/ConfigInterface";

export default class Producer extends EventEmitter {
  private readonly producer: SinekProducer;

  constructor(
    private readonly produceTo: string,
    private readonly config: ConfigInterface,
    private readonly producerConfig: KafkaProducerConfig,
  ) {
    super();

    this.producer = new SinekProducer(producerConfig, null, config.producerPartitionCount || 1);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * Initially connect to producer
   */
  public async connect(): Promise<void> {
    try {
      this.producer.on("error", this.handleError);

      await this.producer.connect();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Produce a new message
   */
  public async produce(key: string, message: CrawlingResponse): Promise<void> {
    try {
      // With version = 1
      await this.producer.buffer(this.produceTo, key, message, undefined, 1);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Closes the producer
   */
  public close(): void {
      if (this.producer) {
          this.producer.close();
      }
  }

  /**
   * If there is an error, please report it
   */
  private handleError(error: Error): void {
    super.emit("error", error);
  }
}

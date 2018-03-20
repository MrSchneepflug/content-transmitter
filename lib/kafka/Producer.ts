import * as EventEmitter from "events";

import { NProducer as SinekProducer } from "sinek";

import ConfigInterface from "./../interfaces/ConfigInterface";
import ProducerPayloadInterface from "./../interfaces/ProducerPayloadInterface";

export default class Producer extends EventEmitter {
  private producer: SinekProducer;
  private timeout: number | null = null;

  constructor(public config: ConfigInterface) {
    super();

    this.producer = new SinekProducer(config, null,
      config.producerPartitionCount || 1);

    this.handleError = this.handleError.bind(this);
  }

  /**
   * Initially connect to producer
   */
  public async connect(): Promise<void> {
    try {
      await this.producer.connect();
    } catch (error) {
      this.handleError(error);
    }

    this.producer.on("error", this.handleError);
  }

  /**
   * Produce a new message
   */
  public async produce(key: string, message: ProducerPayloadInterface): Promise<void> {
    try {
      // With version = 1
      await this.producer.buffer(this.config.produceTo, key, message, null, 1);
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

import EventEmitter from "events";

import {BatchConfig, KafkaConsumerConfig, NConsumer as SinekConsumer} from "sinek";

import ConsumerPayloadInterface from "./../interfaces/ConsumerPayloadInterface";

export default class Consumer extends EventEmitter {
  private readonly consumer: SinekConsumer;

  constructor(
    private readonly consumeFrom: string,
    private readonly config: KafkaConsumerConfig,
    private readonly batchConfig: BatchConfig,
    private readonly process: (message: ConsumerPayloadInterface) => Promise<void>,
  ) {
    super();

    this.consumer = new SinekConsumer(consumeFrom, config);
    this.consume = this.consume.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * Initially connect to Consumer
   */
  public async connect(): Promise<void> {
    try {
      await this.consumer.connect();
    } catch (error) {
      this.handleError(error);
    }

    // Consume as JSON with callback
    try {
      // Do not await this (it only fires after first message)
      this.consumer.consume(
        this.consume.bind(this),
        true,
        true,
        this.batchConfig,
      ).catch((error) => this.handleError(error));
    } catch (error) {
      this.handleError(error);
    }

    this.consumer.on("error", this.handleError.bind(this));
  }

  /**
   * Closes the consumer
   */
  public close(): void {
    if (this.consumer) {
        this.consumer.close(false);
    }
  }

  /**
   * Handle consuming messages
   */
  private async consume(
    message: object,
    callback: (error: Error | null) => void,
  ): Promise<void> {
    let error: Error | null;

    try {
      await this.handleMessage(message);
      error = null;
    } catch (producedError) {
      this.handleError(producedError);
      error = producedError;
    }

    // Return this callback to receive further messages
    callback(error);
  }

  /**
   * Handle newly created messages
   */
  private async handleMessage(message: any) {

    const messageContent: ConsumerPayloadInterface = {
        key: message.key,
        url: message.value.url,
    };

    await this.process(messageContent);
  }

  /**
   * If there is an error, please report it
   */
  private handleError(error: Error) {
    super.emit("error", error);
  }
}

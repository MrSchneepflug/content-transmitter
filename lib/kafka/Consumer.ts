import EventEmitter from "events";
import {BatchConfig, KafkaConsumerConfig, KafkaMessage, NConsumer as SinekConsumer, SortedMessageBatch} from "sinek";
import {isKafkaMessage, Message} from "../typeguards";
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

  private consume(message: Message, callback: (error: any) => void): void {
    if (Array.isArray(message)) {
      message.forEach((kafkaMessage: KafkaMessage) => this.consumeSingle(kafkaMessage, callback));
    } else if (isKafkaMessage(message)) {
      this.consumeSingle(message, callback);
    } else {
      this.consumeBatch(message, callback);
    }
  }

  /**
   * Handle consuming messages
   */
  private async consumeSingle(
    message: KafkaMessage,
    callback: (error: any) => void,
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
    try {
      callback(error);
    } catch (error) {
      this.handleError(error);
    }
  }

  private consumeBatch(batch: SortedMessageBatch, callback: (error: any) => void): void {
    for (const topic in batch) {
      if (!batch.hasOwnProperty(topic)) {
        continue;
      }

      for (const partition in batch[topic]) {
        if (!batch[topic].hasOwnProperty(partition)) {
          continue;
        }

        batch[topic][partition].forEach((message: KafkaMessage) => {
          this.consumeSingle(message, callback);
        });
      }
    }
  }

  /**
   * Handle newly created messages
   */
  private async handleMessage(message: KafkaMessage) {
      const messageContent: ConsumerPayloadInterface = {
        key: Buffer.isBuffer(message.key) ? message.key.toString() : message.key,
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

import EventEmitter from "events";
import {KafkaConsumerConfig, NConsumer as SinekConsumer} from "sinek";
import {CrawlingRequest} from "../interfaces/CrawlingRequest";
import {isKafkaMessage, Message} from "../typeguards";

export default class Consumer extends EventEmitter {
  private readonly consumer: SinekConsumer;

  constructor(
    private readonly consumeFrom: string,
    private readonly config: KafkaConsumerConfig,
    private readonly process: (message: CrawlingRequest) => Promise<void>,
  ) {
    super();

    this.consumer = new SinekConsumer(consumeFrom, config);
    this.consumer.on("error", (error) => super.emit("error", error));
  }

  public async connect(): Promise<void> {
    try {
      await this.consumer.connect();
    } catch (error) {
      super.emit("error", error);
    }

    this.consumer.consume(this.consume.bind(this), true, true).catch((error) => super.emit("error", error));
  }

  private async consume(message: Message, commit: () => void): Promise<void> {
    if (!isKafkaMessage(message)) {
      throw new Error("Can only handle messages in KafkaMessage format");
    }

    try {
      const messageContent: CrawlingRequest = {
        key: Buffer.isBuffer(message.key) ? message.key.toString() : message.key,
        url: message.value.url,
      };

      await this.process(messageContent);
      commit();
    } catch (error) {
      super.emit("error", error);
    }
  }
}

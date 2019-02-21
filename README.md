# Content Transmitter

Crawl HTML Pages (triggered by Kafka events) and produces selected content to Kafka topic.

[![Build Status](https://travis-ci.com/knamp/content-transmitter.svg?branch=master)](https://travis-ci.com/knamp/content-transmitter)

## Usage

Install via yarn

    yarn install knamp-content-transmitter

Then configure it and use it

```javascript
import ContentTransmitter from "knamp-content-transmitter";

(async () => {

  const processor = await ContentTransmitter({
    clientName: "transmitter-client",
    consumeFrom: "transmitter-consume",
    groupId: "transmitter-group",
    produceTo: "generator-consume",
  });

  processor.on("error", (error) => {
    console.error(error);
  });
})();
```

## Uses

* [Sinek](https://github.com/nodefluent/node-sinek), consuming and producing messages to and from Apache Kafka

## License

This project is under [MIT](./LICENSE).

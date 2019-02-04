import ContentTransmitter from "../..";

(async () => {

  // tslint:disable-next-line
  console.log("Content-Transmitter starting..");

  const processor = await ContentTransmitter({
    clientName: "transmitter-client",
    consumeFrom: "transmitter-consume",
    groupId: "transmitter-group",
    produceTo: "generator-consume",
  });

  processor.on("error", (error) => {
    // tslint:disable-next-line
    console.error(error);
  });

  // tslint:disable-next-line
  console.log("Content-Transmitter running.");
})();

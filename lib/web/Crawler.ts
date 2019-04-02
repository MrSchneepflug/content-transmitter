import EventEmitter from "events";

import Promise from "bluebird";
import NodeCrawler from "crawler";

import {CrawlingResponse} from "../interfaces/CrawlingResponse";
import ConfigInterface from "./../interfaces/ConfigInterface";

export default class Crawler extends EventEmitter {

  private spider: NodeCrawler;

  constructor(config: ConfigInterface) {
    super();

    this.spider = new NodeCrawler(config.crawler);
  }

  public transform(body: string): string {
    return body.replace(/\r?\n|\r/g, " ").trim();
  }

  public crawl(url: string): Promise<CrawlingResponse> {
    return new Promise((resolve, reject) => {
      this.spider.queue({
        callback: (error, result, done) => {
          done();

          if (error) {
            return reject(error);
          }

          const payload: CrawlingResponse = {
            content: this.transform(result.body),
            url,
          };

          resolve(payload);
        },
        jQuery: false,
        uri: url,
      });
    });
  }

  public close(): void {
    // empty
  }

  private handleError(error: Error): void {
    super.emit("error", error);
  }
}

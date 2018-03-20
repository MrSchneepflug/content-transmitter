import * as EventEmitter from "events";

import * as Promise from "bluebird";
import * as NodeCrawler from "crawler";

import ConfigInterface from "./../interfaces/ConfigInterface";
import ProducerPayloadInterface from "./../interfaces/ProducerPayloadInterface";

export default class Crawler extends EventEmitter {

    private spider: NodeCrawler;

    constructor(config: ConfigInterface) {
        super();

        this.spider = new NodeCrawler(config.crawler);
    }

    public crawl(url: string): Promise<ProducerPayloadInterface> {
        return new Promise((resolve, reject) => {
            this.spider.queue({
                callback: (error, result, done) => {
                    done();

                    if (error) {
                        return reject(error);
                    }

                    const payload: ProducerPayloadInterface = {
                        content: result.body,
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

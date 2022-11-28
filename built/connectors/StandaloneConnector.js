"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { debug } from "console";
const net_1 = require("net");
const tls_1 = require("tls");
const utils_1 = require("../utils");
const AbstractConnector_1 = require("./AbstractConnector");
const debug = (0, utils_1.Debug)("standalone");
class StandaloneConnector extends AbstractConnector_1.default {
    constructor(options) {
        super(options.disconnectTimeout);
        this.options = options;
    }
    connect(_) {
        debug("in connect");
        const { options } = this;
        this.connecting = true;
        let connectionOptions;
        if ("path" in options && options.path) {
            connectionOptions = {
                path: options.path,
            };
        }
        else {
            connectionOptions = {};
            if ("port" in options && options.port != null) {
                connectionOptions.port = options.port;
            }
            if ("host" in options && options.host != null) {
                connectionOptions.host = options.host;
            }
            if ("family" in options && options.family != null) {
                connectionOptions.family = options.family;
            }
        }
        if (options.tls) {
            Object.assign(connectionOptions, options.tls);
        }
        // TODO:
        // We use native Promise here since other Promise
        // implementation may use different schedulers that
        // cause issue when the stream is resolved in the
        // next tick.
        // Should use the provided promise in the next major
        // version and do not connect before resolved.
        debug("connect 1");
        return new Promise((resolve, reject) => {
            debug("connect 2");
            process.nextTick(() => {
                debug("connect 3");
                if (!this.connecting) {
                    reject(new Error(utils_1.CONNECTION_CLOSED_ERROR_MSG));
                    return;
                }
                try {
                    if (options.tls) {
                        debug("create tls connection", connectionOptions);
                        this.stream = (0, tls_1.connect)(connectionOptions);
                    }
                    else {
                        debug("create connection", connectionOptions);
                        this.stream = (0, net_1.createConnection)(connectionOptions);
                    }
                }
                catch (err) {
                    debug("caught error from createConnection", err);
                    reject(err);
                    return;
                }
                this.stream.once("error", (err) => {
                    debug("set first error", err);
                    this.firstError = err;
                });
                debug("resolve socket");
                resolve(this.stream);
            });
        });
    }
}
exports.default = StandaloneConnector;

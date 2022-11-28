// import { debug } from "console";
import { createConnection, IpcNetConnectOpts, TcpNetConnectOpts } from "net";
import { connect as createTLSConnection, ConnectionOptions } from "tls";
import { NetStream } from "../types";
import { CONNECTION_CLOSED_ERROR_MSG, Debug } from "../utils";
import AbstractConnector, { ErrorEmitter } from "./AbstractConnector";
const debug = Debug("standalone");

export type StandaloneConnectionOptions = (Partial<TcpNetConnectOpts> &
  Partial<IpcNetConnectOpts>) & {
  disconnectTimeout?: number;
  tls?: ConnectionOptions;
};

export default class StandaloneConnector extends AbstractConnector {
  constructor(protected options: StandaloneConnectionOptions) {
    super(options.disconnectTimeout);
  }

  connect(_: ErrorEmitter) {
    debug("in connect");
    const { options } = this;
    this.connecting = true;

    let connectionOptions: TcpNetConnectOpts | IpcNetConnectOpts;
    if ("path" in options && options.path) {
      connectionOptions = {
        path: options.path,
      } as IpcNetConnectOpts;
    } else {
      connectionOptions = {} as TcpNetConnectOpts;
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
    return new Promise<NetStream>((resolve, reject) => {
      debug("connect 2");
      process.nextTick(() => {
        debug("connect 3");
        if (!this.connecting) {
          reject(new Error(CONNECTION_CLOSED_ERROR_MSG));
          return;
        }

        try {
          if (options.tls) {
            debug("create tls connection", connectionOptions);
            this.stream = createTLSConnection(connectionOptions);
          } else {
            debug("create connection", connectionOptions);
            this.stream = createConnection(connectionOptions);
          }
        } catch (err) {
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

import stream from 'stream';

export class EchoStream extends stream.Transform {
  constructor() {
    super({
      transform: (data, encoding, callback): void => {
        callback(null, data);
      },
    });
  }
}

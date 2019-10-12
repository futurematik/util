/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'jest';
import { createQueue } from '.';

describe('Queue', () => {
  it('passes the smoke test', async () => {
    const queue = createQueue<number>();

    const n = 100;
    const input = [...Array(n).keys()];
    let output: number[] = [];

    const producer = async () => {
      // producer
      for (const i of input) {
        queue.push(i);
        await fakeIO();
      }
      queue.end();
    };

    const consumer = async () => {
      for await (const e of queue) {
        output.push(e);
        await fakeIO();
      }
    };

    await Promise.all([producer(), consumer(), consumer(), consumer()]);

    expect(output).toHaveLength(n);

    output = output.sort((a, b) => a - b);

    for (let i = 0; i < output.length; ++i) {
      expect(output[i]).toBe(i);
    }
  });
});

function fakeIO() {
  return new Promise(resolve => {
    const delay = Math.round(Math.random() * 2);
    setTimeout(resolve, delay);
  });
}

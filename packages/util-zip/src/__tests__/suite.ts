import 'jest';
import path from 'path';
import { readZip } from '../';

describe('ZipFile', () => {
  it('reads a zip file correctly', async () => {
    const zip = readZip(path.join(__dirname, 'assets/archive.zip'));

    const entries: ZipArchive = {};

    for await (const e of zip) {
      if (e.path.endsWith('/')) {
        continue;
      }

      const reader = await e.open();
      const contents = await readAll(reader);
      entries[e.path] = contents;
    }

    const expected = {
      'one.txt': 'This is file one.',
      'two.txt': 'This is file two.',
      'folder/three.txt': 'This is file three.',
    };

    expect(entries).toEqual(expected);
  });
});

interface ZipArchive {
  [path: string]: string;
}

async function readAll(stream: AsyncIterableIterator<Buffer>): Promise<string> {
  let value = '';
  for await (const chunk of stream) {
    value += chunk;
  }
  return value;
}

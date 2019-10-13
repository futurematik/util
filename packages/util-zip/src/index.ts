import * as yauzl from 'yauzl';
import { createQueue } from '@fmtk/util-queue';
import { Readable } from 'stream';
import { EchoStream } from './stream';

export interface ZipEntry {
  comment: string;
  compressedSize: number;
  lastModified: Date;
  path: string;
  open(): PromiseLike<Readable>;
  uncompressedSize: number;
}

export async function* readZip(
  zipPath: string,
): AsyncIterableIterator<ZipEntry> {
  const zipFile = await baseOpen(zipPath);
  const entries = createQueue<yauzl.Entry>(() => zipFile.readEntry());

  try {
    zipFile.once('error', e => {
      entries.error(e);
    });

    zipFile.on('entry', (e: yauzl.Entry) => {
      entries.push(e);
    });

    zipFile.on('end', () => {
      entries.end();
    });

    for await (const entry of entries) {
      yield {
        comment: entry.comment,
        compressedSize: entry.compressedSize,
        lastModified: entry.getLastModDate(),
        path: entry.fileName,
        open: makeOpenEntry(zipFile, entry),
        uncompressedSize: entry.uncompressedSize,
      };
    }
  } finally {
    zipFile.close();
  }
}

function baseOpen(zipPath: string): Promise<yauzl.ZipFile> {
  return new Promise<yauzl.ZipFile>((resolve, reject) => {
    yauzl.open(
      zipPath,
      {
        autoClose: false,
        lazyEntries: true,
      },
      (err, zip) => {
        if (err) {
          return reject(err);
        }
        if (!zip) {
          return reject(new Error('unexpected null zip in callback'));
        }
        resolve(zip);
      },
    );
  });
}

function makeOpenEntry(zip: yauzl.ZipFile, entry: yauzl.Entry) {
  return async function openEntry(): Promise<Readable> {
    const entryStream = await new Promise<Readable>((resolve, reject) => {
      zip.openReadStream(entry, (err, stream) => {
        if (err) {
          return reject(err);
        }
        if (!stream) {
          return reject(new Error('unexpected null stream in callback'));
        }
        resolve(stream);
      });
    });

    const echo = new EchoStream();
    entryStream.pipe(echo);
    return echo;
  };
}

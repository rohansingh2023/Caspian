import { createReadStream } from "fs";

async function* ReadBinFileToAsyncGenerator(
  filePath: string
): AsyncGenerator<Record<string, string>, void, unknown> {
  const readStream = createReadStream(filePath);

  let buffer = Buffer.alloc(0);

  // Read the file in chunks
  for await (const chunk of readStream) {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 4) {
      // At least 4 bytes are needed to read the length
      // Read the length of the next record (4 bytes)
      const length = buffer.readUInt32LE(0); // Read the length in little-endian format

      if (buffer.length >= 4 + length) {
        // If we have enough data to read the entire record
        const recordBuffer = buffer.slice(4, 4 + length); // Extract the record data buffer
        const recordJson = recordBuffer.toString("utf-8"); // Convert to string
        const record: Record<string, string> = JSON.parse(recordJson); // Parse JSON into Record<string, string>

        yield record; // Yield the record

        // Remove the processed data from the buffer
        buffer = buffer.slice(4 + length);
      } else {
        // If there's not enough data, keep reading more
        break;
      }
    }
  }
}

export default ReadBinFileToAsyncGenerator
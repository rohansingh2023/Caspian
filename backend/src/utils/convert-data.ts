import { createWriteStream } from "fs";

export async function writeAsyncGeneratorToBinFile(
  generator: AsyncGenerator<Record<string, string>, any, any>,
  filePath: string
): Promise<void> {
  const writeStream = createWriteStream(filePath);

  // Function to write serialized Record<string, string> as a buffer
  const writeRecord = (record: Record<string, string>) => {
    // Serialize the record to a JSON string, then convert to a Buffer
    const json = JSON.stringify(record);
    const buffer = Buffer.from(json, "utf-8");

    // Create a buffer for the length of the data (4 bytes for a 32-bit integer)
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(buffer.length, 0); // Write the length of the buffer in little-endian format

    // Write the length of the buffer first (so we can read it correctly later)
    writeStream.write(lengthBuffer);
    // Write the actual buffer (the serialized JSON data)
    writeStream.write(buffer);
  };

  try {
    for await (const record of generator) {
      writeRecord(record);
    }
  } finally {
    writeStream.end();
  }
}

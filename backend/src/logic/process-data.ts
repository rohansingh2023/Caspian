import { createReadStream } from "fs";
import { createInterface } from "readline";

const ProcessData = async function* (
  path: string
): AsyncGenerator<Record<string, string>> {
  const fileStream = createReadStream(path, {
    encoding: "utf8",
    highWaterMark: 64 * 1024, // 64KB chunks
  });

  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let isFirstLine = true;

  try {
    for await (const line of rl) {
      if (isFirstLine) {
        headers = line.split(",").map(header => header.trim());
        isFirstLine = false;
        continue;
      }

      if (!line.trim()) {
        continue;
      }

      const values = line.split(",");
      const rowData: Record<string, string> = {};
      
      headers.forEach((header: string, index: number) => {
        rowData[header] = values[index]?.trim() || "";
      });

      yield rowData;
    }
  } catch (error) {
    console.error("Error processing CSV:", error);
  } finally {
    fileStream.destroy();
  }
};

export default ProcessData;
import * as fs from "fs";
import { PreProcessData } from "./preprocess-data";
import { SingleBar } from "cli-progress";

interface Row {
  [key: string]: string | number;
}

interface InvertedIndexData {
  vocabulary: Set<string>;
  invertedIndex: Record<string, number[]>;
}

export class InvertedIndex {
  private readonly WORD_LENGTH_BYTES = 4;
  private readonly ROW_COUNT_BYTES = 4;
  private readonly ROW_INDEX_BYTES = 4;
  private readonly MAX_WORD_LENGTH = 1024; // Maximum allowed word length

  constructor(
    private readonly inputFile: string,
    private readonly outputFile: string,
    private readonly stopwords: Set<string>,
    private readonly preProcessData: PreProcessData
  ) {}

  public async buildIndex(
    rows: Row[],
    textColumns: string[]
  ): Promise<InvertedIndexData> {
    const vocabulary = new Set<string>();
    const invertedIndex: Record<string, number[]> = {};

    // Process rows in chunks for better memory management
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      this.processRowChunk(chunk, textColumns, vocabulary, invertedIndex, i);
    }

    return { vocabulary, invertedIndex };
  }

  private processRowChunk(
    chunk: Row[],
    textColumns: string[],
    vocabulary: Set<string>,
    invertedIndex: Record<string, number[]>,
    offset: number
  ): void {
    chunk.forEach((row, index) => {
      const rowIndex = offset + index + 1; // 1-based indexing
      textColumns.forEach((col) => {
        if (typeof row[col] === "string") {
          const words = this.preProcessData.preprocessText(row[col] as string);
          words.forEach((word) => {
            vocabulary.add(word);
            if (!invertedIndex[word]) {
              invertedIndex[word] = [];
            }
            if (!invertedIndex[word].includes(rowIndex)) {
              invertedIndex[word].push(rowIndex);
            }
          });
        }
      });
    });
  }

  public async saveIndex(
    invertedIndex: Record<string, number[]>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const writeStream = fs.createWriteStream(this.outputFile);

        // Write header with version and metadata
        const header = Buffer.alloc(8);
        header.writeUInt32LE(1, 0); // Version number
        header.writeUInt32LE(Object.keys(invertedIndex).length, 4); // Number of words
        writeStream.write(header);

        // Write index data
        for (const [word, rows] of Object.entries(invertedIndex)) {
          const wordBuffer = Buffer.from(word, "utf-8");
          const wordLength = wordBuffer.length;

          if (wordLength > this.MAX_WORD_LENGTH) {
            console.warn(`Skipping word exceeding maximum length: ${word}`);
            continue;
          }

          // Write word length and word
          const lengthBuffer = Buffer.alloc(this.WORD_LENGTH_BYTES);
          lengthBuffer.writeUInt32LE(wordLength, 0);
          writeStream.write(lengthBuffer);
          writeStream.write(wordBuffer);

          // Write row count and rows
          const rowCountBuffer = Buffer.alloc(this.ROW_COUNT_BYTES);
          rowCountBuffer.writeUInt32LE(rows.length, 0);
          writeStream.write(rowCountBuffer);

          const rowsBuffer = Buffer.alloc(rows.length * this.ROW_INDEX_BYTES);
          rows.forEach((row, index) => {
            rowsBuffer.writeUInt32LE(row, index * this.ROW_INDEX_BYTES);
          });
          writeStream.write(rowsBuffer);
        }

        writeStream.end();
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  public async readIndex(): Promise<Record<string, number[]>> {
    return new Promise((resolve, reject) => {
      try {
        const invertedIndex: Record<string, number[]> = {};
        const fileBuffer = fs.readFileSync(this.outputFile);
        let position = 0;

        // Read header
        const version = fileBuffer.readUInt32LE(position);
        position += 4;
        const wordCount = fileBuffer.readUInt32LE(position);
        position += 4;

        // Create progress bar
        const progressBar = new SingleBar({
          format: "Reading Index |{bar}| {percentage}% | {value}/{total} words",
          barCompleteChar: "█",
          barIncompleteChar: "░",
        });

        console.log(`Reading index version ${version} with ${wordCount} words`);

        progressBar.start(wordCount, 0);
        let wordsProcessed = 0;

        while (position < fileBuffer.length) {
          // Read word length
          const wordLength = fileBuffer.readUInt32LE(position);
          position += this.WORD_LENGTH_BYTES;

          if (wordLength <= 0 || wordLength > this.MAX_WORD_LENGTH) {
            progressBar.stop();
            throw new Error(`Invalid word length: ${wordLength}`);
          }

          // Read word
          const word = fileBuffer
            .slice(position, position + wordLength)
            .toString("utf-8");
          position += wordLength;

          // Read row count
          const rowCount = fileBuffer.readUInt32LE(position);
          position += this.ROW_COUNT_BYTES;

          // Read rows
          const rows: number[] = [];
          for (let i = 0; i < rowCount; i++) {
            rows.push(fileBuffer.readUInt32LE(position));
            position += this.ROW_INDEX_BYTES;
          }

          invertedIndex[word] = rows;
          wordsProcessed++;
          progressBar.update(wordsProcessed);
        }

        progressBar.stop();
        resolve(invertedIndex);
      } catch (error) {
        reject(error);
      }
    });
  }
}

import { PreProcessData } from "../algos/InvertedIndex/preprocess-data";
import fs from "fs/promises";

interface Row {
  [key: string]: string | number;
}

export class CreateVocabulary {
  vocabulary: Set<string>;
  preProcess: PreProcessData;

  constructor(preProcess: PreProcessData) {
    this.vocabulary = new Set<string>();
    this.preProcess = preProcess;
  }

  public async buildVocab(
    rows: Row[],
    textColumns: string[]
  ): Promise<Set<string>> {
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      this.processRowChunk(chunk, textColumns);
    }

    return this.vocabulary;
  }

  private processRowChunk(chunk: Row[], textColumns: string[]): void {
    chunk.forEach((row, _) => {
      textColumns.forEach((col) => {
        if (typeof row[col] === "string") {
          const words = this.preProcess.preprocessText(row[col] as string);
          words.forEach((word) => {
            this.vocabulary.add(word);
          });
        }
      });
    });
  }

   async saveVocabToBinary(
    vocabulary: Set<string>,
    filePath: string
  ): Promise<void> {
    try {
      const vocabArray = Array.from(vocabulary);
      const vocabJson = JSON.stringify(vocabArray);
      const vocabBuffer = Buffer.from(vocabJson);
      await fs.writeFile(filePath, vocabBuffer);
      console.log(`Vocabulary saved successfully to ${filePath}`);
    } catch (error) {
      console.error("Error saving vocabulary:", error);
      throw error;
    }
  }

   async readVocabFromBinary(filePath: string): Promise<Set<string>> {
    try {
      const vocabBuffer = await fs.readFile(filePath);
      const vocabArray = JSON.parse(vocabBuffer.toString());
      const vocabulary = new Set<string>(vocabArray);
      console.log(`Vocabulary loaded successfully from ${filePath}`);
      return vocabulary;
    } catch (error) {
      console.error("Error loading vocabulary:", error);
      throw error;
    }
  }
}


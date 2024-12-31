import * as fs from "fs";
import Papa from "papaparse";

interface Row {
    [key: string]: string | number;
}

/**
 * Preprocess incoming .csv file
 */
export class PreProcessData{
    stopwords: Set<string>;
    filePath: string;

    /**
     * Preprocess incoming .csv file
     * @param {Set<string>} stopwords 
     * @param {string} filePath 
     */
    constructor(stopwords:Set<string>, filePath: string){
        this.stopwords = stopwords;
        this.filePath = filePath
    }

    removeStopwords(words: string[]): string[] {
      return words.filter((word) => !this.stopwords.has(word));
    }
    
    async readCSV(filePath: string): Promise<Row[]> {
      return new Promise((resolve, reject) => {
        const results: Row[] = [];
        const fileStream = fs.createReadStream(filePath, "utf8");
        Papa.parse(fileStream, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (result: any) => {
            resolve(result.data);
          },
          error: (err) => {
            reject(err);
          },
        });
      });
    }
    
    preprocessText(text: string): string[] {
      // Convert text to lowercase, split by spaces, and remove stopwords
      const words = text.toLowerCase().split(/\W+/).filter(Boolean); // Split by non-word characters
      const filteredWords = this.removeStopwords(words);
      return filteredWords;
    }
}
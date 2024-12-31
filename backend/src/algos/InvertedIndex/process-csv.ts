import {
  INPUTFILEPATH,
  OUTPUTFILEPATH,
  STOPWORDS,
  TRIEDSOUTPUTPATH,
} from "../../utils/constants";
import { Trie } from "../Tries";
import { InvertedIndex } from "./inverted-index";
import { PreProcessData } from "./preprocess-data";

const preProcessData = new PreProcessData(STOPWORDS, INPUTFILEPATH);
const invertIndex = new InvertedIndex(
  INPUTFILEPATH,
  OUTPUTFILEPATH,
  STOPWORDS,
  preProcessData
);

const trie = new Trie()

async function processCSV(filePath: string, outputFile: string) {
  try {
    // Step 1: Read CSV file
    const rows = await preProcessData.readCSV(filePath);

    // Step 2: Specify which columns are text columns
    const textColumns = [
      "title",
      "company_name",
      "location",
      "via",
      "description",
      "extensions",
      "job_id",
      "thumbnail",
      "posted_at",
      "schedule_type",
      "search_location",
      "description_tokens",
    ]; // List of text columns you want to process

    // Step 3: Build vocabulary and inverted index
    const { vocabulary, invertedIndex } = await invertIndex.buildIndex(
      rows,
      textColumns
    );

    console.log("Vocabulary built successfully");

    trie.buildFromSet(vocabulary)

    await trie.saveTrieToBinary(TRIEDSOUTPUTPATH)

    // Step 4: Save inverted index to a custom binary format file
    // await invertIndex.saveIndex(invertedIndex);

    console.log("Vocabulary size:", vocabulary.size);
    console.log("Inverted index has been saved to:", outputFile);
  } catch (err) {
    console.error("Error processing the CSV file:", err);
  }
}

processCSV(INPUTFILEPATH, OUTPUTFILEPATH);

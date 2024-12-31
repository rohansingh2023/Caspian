import {
  INPUTFILEPATH,
  OUTPUTFILEPATH,
  STOPWORDS,
} from "../../utils/constants";
import { InvertedIndex } from "./inverted-index";
import { PreProcessData } from "./preprocess-data";

const preProcessData = new PreProcessData(STOPWORDS, INPUTFILEPATH);
const invertIndex = new InvertedIndex(
  INPUTFILEPATH,
  OUTPUTFILEPATH,
  STOPWORDS,
  preProcessData
);

async function readOnvertIndex() {
  try {
    const inverted_index = await invertIndex.readIndex();
    console.log(inverted_index["data"]);
  } catch (error) {
    console.log(error);
  }
}

readOnvertIndex();

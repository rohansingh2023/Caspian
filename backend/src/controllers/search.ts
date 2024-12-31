import { Request, Response } from "express";
import { PreProcessData } from "../algos/InvertedIndex/preprocess-data";
import { DATAOUTPUTFILEPATH, INPUTFILEPATH, OUTPUTFILEPATH, STOPWORDS } from "../utils/constants";
import { InvertedIndex } from "../algos/InvertedIndex/inverted-index";
import { ReadBinFileToAsyncGenerator, SearchAlgo } from "../logic";

const preProcessData = new PreProcessData(STOPWORDS, INPUTFILEPATH);
const invertIndex = new InvertedIndex(
  INPUTFILEPATH,
  OUTPUTFILEPATH,
  STOPWORDS,
  preProcessData
); 

export const SearchController = async (req: Request, res: Response) => {
  try {
    /** Process Data */
    console.time("ProcessData")
    const parsedData = ReadBinFileToAsyncGenerator(DATAOUTPUTFILEPATH)
    console.timeEnd("ProcessData")
 
    /** Create Index */
    console.time("CreateIndex")
    const index = await invertIndex.readIndex(); 
    console.timeEnd("CreateIndex")
    
    /** Search Algorithm */
    console.time("SearchAlgo")
    const searchResult = await SearchAlgo(parsedData, req, res, index);
    console.timeEnd("SearchAlgo")

    res.status(200).json(searchResult);
  } catch (error) {
    res.status(500).json(error);
  }
};


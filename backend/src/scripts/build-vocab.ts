import { PreProcessData } from "../algos/InvertedIndex/preprocess-data";
import { INPUTFILEPATH, STOPWORDS, VOCABOUTPUTPATH } from "../utils/constants";
import { CreateVocabulary } from "../utils/create-vocab";

async function main() {
    try {
      const preProcessData = new PreProcessData(STOPWORDS, INPUTFILEPATH);
      const createVocab = new CreateVocabulary(preProcessData);
      const rows = await preProcessData.readCSV(INPUTFILEPATH);
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
      ];
      console.time("BuildVocab")
      const vocab = await createVocab.buildVocab(rows, textColumns)
      console.timeEnd("BuildVocab")
      console.time("SaveVocab")
      await createVocab.saveVocabToBinary(vocab, VOCABOUTPUTPATH)
      console.timeEnd("SaveVocab")
      console.log(await createVocab.readVocabFromBinary(VOCABOUTPUTPATH))
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  
  main()
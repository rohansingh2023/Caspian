import { PreProcessData } from "../algos/InvertedIndex/preprocess-data";
import { Trie } from "../algos/Tries";
import { INPUTFILEPATH, STOPWORDS, TRIEDSOUTPUTPATH, VOCABOUTPUTPATH } from "../utils/constants";
import { CreateVocabulary } from "../utils/create-vocab";

async function main() {
  try {
    const preProcessData = new PreProcessData(STOPWORDS, INPUTFILEPATH);
    const createVocab = new CreateVocabulary(preProcessData);
    // Sample words set
    const words = await createVocab.readVocabFromBinary(VOCABOUTPUTPATH);
    // const words = new Set<string>([...vocab].slice(0, 30000));

    // // Create and build trie
    const trie = new Trie();
    console.time("BuildTrie");
    trie.buildFromSet(words);
    console.timeEnd("BuildTrie");

    // Save to binary file
    console.time("SaveTrieToBinary");
    await trie.saveTrieToBinary(TRIEDSOUTPUTPATH, trie.root);
    console.timeEnd("SaveTrieToBinary");

    // Load from binary file
    console.time("LoadTrie");
    const loadedTrie = await Trie.loadTrieFromBinary(
      TRIEDSOUTPUTPATH
    );
    console.timeEnd("LoadTrie");

    // Test autocomplete
    console.time("AutoComplete")
    console.log('Autocomplete for "data":', loadedTrie.searchAutoComplete("data"));
    console.timeEnd("AutoComplete")
  } catch (error) {
    console.log(error);
    throw error;
  }
}

main();

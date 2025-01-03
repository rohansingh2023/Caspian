import { INPUTFILEPATH, STOPWORDS, VOCABOUTPUTPATH } from "../../utils/constants";
import { PreProcessData } from "../InvertedIndex/preprocess-data";
import Trie from "./tries";
import { CreateVocabulary } from "../../utils/create-vocab";

async function main() {
  const preProcessData = new PreProcessData(STOPWORDS, INPUTFILEPATH);
  const createVocab = new CreateVocabulary(preProcessData);
  // Sample words set
  const vocab = await createVocab.readVocabFromBinary(VOCABOUTPUTPATH);
  const words = new Set<string>([...vocab].slice(0,100000))

  // // Create and build trie
  const trie = new Trie();
  trie.buildFromSet(words);
  console.log(
    trie.root
  );

  // // Save to binary file
  // await trie.saveTrieToBinary("indexes/trie.bin");

  // Load from binary file
  // const loadedTrie = await Trie.loadTrieFromBinary("data-structures/tries/trie.bin_part_1.bin");
  // console.log(loadedTrie.root)

  // Test autocomplete
  console.log('Autocomplete for "eng":', trie.searchAutoComplete("eng"));
  // console.log('Autocomplete for "wo":', trie.searchAutoComplete("wo"));
}

main();

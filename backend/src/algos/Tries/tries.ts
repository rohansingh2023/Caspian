import { TrieNode } from "./node";
import fs from "fs/promises";

class Trie {
  root: TrieNode = new TrieNode();

  insert(word: string) {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
    node.frequency += 1;
  }

  // built trie from set of words (Batch wise)
  buildFromSet(words: Set<string>, batchSize: number = 10000) {
    let batchOfWords: string[] = []
    for (const word of words) {
        batchOfWords.push(word)
        if(batchOfWords.length >= batchSize){
            batchOfWords.forEach(w => this.insert(w))
            batchOfWords = []
        }
    }
    // Process remaining words
    batchOfWords.forEach(w=> this.insert(w))
  }

  searchAutoComplete(prefix: string): string[] {
    let node = this.root;
    const completions: string[] = [];
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return completions;
      }
      node = node.children.get(char)!;
    }
    this._dfs(node, prefix, completions);
    return completions.sort((a, b) => this._compareFrequency(a, b));
  }

  private _dfs(node: TrieNode, prefix: string, completions: string[]) {
    if (node.isEndOfWord) {
      completions.push(prefix);
    }
    for (let [char, child] of node.children) {
      this._dfs(child, prefix + char, completions);
    }
  }

  private _compareFrequency(wordA: string, wordB: string): number {
    return wordA.localeCompare(wordB);
  }

  // Serialize trie to buffer
  async saveTrieToBinary(filePath: string) {
    try {
      const searilaizedFile = this.root.toJSON(); // Can convert to any serializable format
      const buffer = Buffer.from(JSON.stringify(searilaizedFile));
      await fs.writeFile(filePath, buffer);
      console.log(`Trie saved to ${filePath}`);
    } catch (error) {
      console.error("Error saving trie:", error);
      throw error;
    }
  }

  // Load trie from binary file
  static async loadTrieFromBinary(filePath: string): Promise<Trie> {
    try {
      const buffer = await fs.readFile(filePath);
      const data = JSON.parse(buffer.toString());
      const trie = new Trie();
      trie.root = TrieNode.fromJSON(data);
      return trie;
    } catch (error) {
      console.error("Error loading trie:", error);
      throw error;
    }
  }
}

export default Trie
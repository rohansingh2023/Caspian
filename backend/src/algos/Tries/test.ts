import fs from "fs/promises";

class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  frequency: number = 0;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }

  // Convert TrieNode to a serializable format
  toJSON(): any {
    const serializedChildren: { [key: string]: any } = {};
    this.children.forEach((node, char) => {
      serializedChildren[char] = node.toJSON();
    });

    return {
      children: serializedChildren,
      isEndOfWord: this.isEndOfWord,
    };
  }

  // Recreate TrieNode from serialized format
  static fromJSON(data: any): TrieNode {
    const node = new TrieNode();
    node.isEndOfWord = data.isEndOfWord;

    Object.entries(data.children).forEach(([char, childData]) => {
      node.children.set(char, TrieNode.fromJSON(childData as any));
    });

    return node;
  }
}

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

  // built trie from set of words
  buildFromSet(words: Set<string>) {
    for (const word of words) {
      this.insert(word);
    }
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

// const trie = new Trie();
// trie.insert("rohan");
// trie.insert("roshan");
// trie.insert("ronit");
// trie.insert("rahul");
// trie.insert("racky");
// trie.insert("ashi");
// trie.insert("alia");
// trie.insert("shanaya");
// trie.insert("shanky");

// console.log(trie.searchAutoComplete("sh"));

async function main() {
  // Sample words set
  const words = new Set(["hello", "help", "world", "work", "wonder"]);

  // Create and build trie
  const trie = new Trie();
  trie.buildFromSet(words);

  // Save to binary file
  await trie.saveTrieToBinary("indexes/trie.bin");

  // Load from binary file
  const loadedTrie = await Trie.loadTrieFromBinary("indexes/trie.bin");

  // Test autocomplete
  console.log('Autocomplete for "he":', loadedTrie.searchAutoComplete("he"));
  console.log('Autocomplete for "wo":', loadedTrie.searchAutoComplete("wo"));
}

main()
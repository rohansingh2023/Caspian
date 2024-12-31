export class TrieNode {
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

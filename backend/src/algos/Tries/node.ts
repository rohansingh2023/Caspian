export class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  frequency: number = 0;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }

  // Convert TrieNode to a serializable format
  // toJSON(): any {
  //   // Use a flat structure to avoid recursion
  //   const result: any = { nodes: {} };
  //   const queue: { node: TrieNode; path: string }[] = [
  //     { node: this, path: "" },
  //   ];

  //   while (queue.length > 0) {
  //     const { node, path } = queue.shift()!;

  //     // Store node data
  //     result.nodes[path] = {
  //       isEndOfWord: node.isEndOfWord,
  //       children: Array.from(node.children.keys()),
  //     };

  //     // Add children to queue
  //     for (const [char, childNode] of node.children) {
  //       queue.push({
  //         node: childNode,
  //         path: path + char,
  //       });
  //     }
  //   }

  //   return result;
  // }

  // // Iterative deserialization
  // static fromJSON(data: any): TrieNode {
  //   const root = new TrieNode();

  //   // Process each path in the flat structure
  //   Object.entries(data.nodes).forEach(([path, nodeData]: [string, any]) => {
  //     let current = root;

  //     // Recreate path to this node
  //     for (let i = 0; i < path.length; i++) {
  //       const char = path[i];
  //       if (!current.children.has(char)) {
  //         current.children.set(char, new TrieNode());
  //       }
  //       current = current.children.get(char)!;
  //     }

  //     // Set node properties
  //     current.isEndOfWord = nodeData.isEndOfWord;
  //   });

  //   return root;
  // }
  toJSON(): any {
    const nodes: any[] = [];
    const stack: [TrieNode, number][] = [[this, 0]];

    while (stack.length > 0) {
      const [node, id] = stack.pop()!;

      // Create minimal node data
      const childrenIds: [string, number][] = [];
      let nextId = nodes.length + stack.length + 1;

      for (const [char, childNode] of node.children) {
        childrenIds.push([char, nextId]);
        stack.push([childNode, nextId++]);
      }

      // Store only necessary data
      nodes.push([
        id, // Node ID
        node.isEndOfWord, // End marker
        childrenIds, // Child references
      ]);
    }

    return nodes;
  }

  // Optimized deserialization
  static fromJSON(data: any[]): TrieNode {
    // Pre-allocate all nodes
    const nodes = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
      nodes[i] = new TrieNode();
    }

    // Single pass to connect nodes
    for (const [id, isEnd, children] of data) {
      const node = nodes[id];
      node.isEndOfWord = isEnd;

      for (const [char, childId] of children) {
        node.children.set(char, nodes[childId]);
      }
    }

    return nodes[0];
  }
}

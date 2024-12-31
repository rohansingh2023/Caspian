import { Request, Response } from "express";

const SearchAlgo = async (
  data: AsyncGenerator<Record<string, string>>,
  req: Request,
  res: Response,
  index: Record<string, number[]>
): Promise<Record<string, string>[]> => {
  const searchTerm = ((req.query.searchValue as string) || "").toLowerCase();
  const recordIndices = index[searchTerm] || [];
  const matchingRecords = await getRecordsByIndices(data, recordIndices);
  return matchingRecords;
};

async function getRecordsByIndices(
  generator: AsyncGenerator<Record<string, string>, void, unknown>,
  indices: number[]
): Promise<Record<string, string>[]> {
  const sortedIndices = [...indices].sort((a, b) => a - b);
  const maxIndex = Math.max(...indices);
  const result: Record<string, string>[] = new Array(indices.length);
  let currentIndex = 0;

  for await (const record of generator) {
    if (sortedIndices.includes(currentIndex)) {
      // Store the record at its original index position in result array
      const resultIndex = indices.indexOf(currentIndex);
      result[resultIndex] = record;
    }

    currentIndex++;

    // Optimization: break if we've passed the maximum index we need
    if (currentIndex > maxIndex) {
      break;
    }
  }

  return result.filter(Boolean); // Remove any unfound records
}

export default SearchAlgo
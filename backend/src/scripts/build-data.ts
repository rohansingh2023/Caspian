import { ProcessData } from "../logic";
import { DATAOUTPUTFILEPATH, INPUTFILEPATH } from "../utils/constants";
import { writeAsyncGeneratorToBinFile } from "../utils/convert-data";

const generator = ProcessData(INPUTFILEPATH);
writeAsyncGeneratorToBinFile(generator, DATAOUTPUTFILEPATH)
  .then(() => console.log('Data written successfully to data-test.bin'))
  .catch((err) => console.error('Error writing data:', err));
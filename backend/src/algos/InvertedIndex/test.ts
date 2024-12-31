import fs from 'fs';
import csv from 'csv-parser';
import stopwords from 'stopwords-en';
import zlib from 'zlib';
import cliProgress from 'cli-progress'; // For progress bars

interface JobRecord {
    title: string;
    company_name: string;
    location: string;
    via: string;
    description: string;
    extensions: string;
    job_id: number;
    thumbnail: string;
    posted_at: number;
    schedule_type: string;
    search_location: string;
    description_tokens: number;
}

interface InvertedIndex {
    [word: string]: number[];
}

interface TextProcessingOptions {
    removeNumbers: boolean;
    removePunctuation: boolean;
    convertToLowercase: boolean;
    removeEmails: boolean;
    removeUrls: boolean;
    minWordLength: number;
    maxWordLength: number;
    customStopwords: string[];
    stemming: boolean;
    lemmatization: boolean;
}

class TextProcessor {
    private vocabulary: Set<string> = new Set();
    private invertedIndex: InvertedIndex = {};
    private batchSize: number;
    private currentBatch: { [word: string]: number[] } = {};
    private batchCount: number = 0;
    private progressBar: any;
    private totalRows: number = 0;
    private processedRows: number = 0;

    private textColumns: (keyof JobRecord)[] = [
        'title',
        'company_name',
        'location',
        'via',
        'description',
        'extensions'
    ];

    constructor(batchSize: number = 10000) {
        this.batchSize = batchSize;
    }

    // Enhanced tokenization with more preprocessing options
    private tokenize(text: string, options: TextProcessingOptions): string[] {
        let processedText = text;

        if (options.convertToLowercase) {
            processedText = processedText.toLowerCase();
        }

        if (options.removeUrls) {
            processedText = processedText.replace(/https?:\/\/\S+/g, '');
        }

        if (options.removeEmails) {
            processedText = processedText.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '');
        }

        if (options.removePunctuation) {
            processedText = processedText.replace(/[^\w\s]/g, '');
        }

        if (options.removeNumbers) {
            processedText = processedText.replace(/\d+/g, '');
        }

        const words = processedText.split(/\s+/)
            .filter(word => {
                if (!word) return false;
                if (word.length < options.minWordLength || word.length > options.maxWordLength) return false;
                if (stopwords.includes(word) || options.customStopwords.includes(word)) return false;
                return true;
            });

        if (options.stemming) {
            // Basic stemming (you might want to use a proper stemming library)
            return words.map(word => this.basicStem(word));
        }

        return words;
    }

    // Basic stemming function (simplified Porter stemmer rules)
    private basicStem(word: string): string {
        if (word.endsWith('ing')) return word.slice(0, -3);
        if (word.endsWith('ed')) return word.slice(0, -2);
        if (word.endsWith('s')) return word.slice(0, -1);
        return word;
    }

    // Process a batch of records
    private async processBatch(): Promise<void> {
        for (const [word, rows] of Object.entries(this.currentBatch)) {
            this.vocabulary.add(word);
            if (!this.invertedIndex[word]) {
                this.invertedIndex[word] = [];
            }
            this.invertedIndex[word].push(...rows);
        }
        this.currentBatch = {};
        
        // Write batch to temporary file to save memory
        await this.writeBatchToDisk(this.batchCount);
        this.batchCount++;
    }

    private async writeBatchToDisk(batchNumber: number): Promise<void> {
        const batchData = JSON.stringify(this.invertedIndex);
        const compressed = await new Promise<Buffer>((resolve, reject) => {
            zlib.gzip(batchData, (err, buffer) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });
        
        await fs.promises.writeFile(`temp_batch_${batchNumber}.bin`, compressed);
        this.invertedIndex = {}; // Clear memory
    }

    // Process a single record with enhanced options
    private processRecord(record: JobRecord, rowIndex: number, options: TextProcessingOptions) {
        this.textColumns.forEach(column => {
            const text = record[column];
            if (typeof text === 'string') {
                const tokens = this.tokenize(text, options);
                
                tokens.forEach(token => {
                    if (!this.currentBatch[token]) {
                        this.currentBatch[token] = [];
                    }
                    if (!this.currentBatch[token].includes(rowIndex)) {
                        this.currentBatch[token].push(rowIndex);
                    }
                });
            }
        });

        this.processedRows++;
        if (this.progressBar) {
            this.progressBar.update(this.processedRows);
        }

        // Process batch if it reaches the batch size
        if (Object.keys(this.currentBatch).length >= this.batchSize) {
            return this.processBatch();
        }
    }

    // Count total rows for progress reporting
    private async countTotalRows(filePath: string): Promise<number> {
        return new Promise((resolve) => {
            let count = 0;
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', () => count++)
                .on('end', () => resolve(count));
        });
    }

    // Process the CSV file with progress reporting and batch processing
    public async processCSV(
        filePath: string, 
        options: TextProcessingOptions = {
            removeNumbers: true,
            removePunctuation: true,
            convertToLowercase: true,
            removeEmails: true,
            removeUrls: true,
            minWordLength: 2,
            maxWordLength: 30,
            customStopwords: [],
            stemming: false,
            lemmatization: false
        }
    ): Promise<void> {
        // Initialize progress bar
        this.totalRows = await this.countTotalRows(filePath);
        this.progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        this.progressBar.start(this.totalRows, 0);

        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', async (record: JobRecord) => {
                    try {
                        await this.processRecord(record, this.processedRows, options);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('end', async () => {
                    try {
                        // Process final batch
                        if (Object.keys(this.currentBatch).length > 0) {
                            await this.processBatch();
                        }
                        this.progressBar.stop();
                        console.log(`\nProcessed ${this.processedRows} records in ${this.batchCount} batches`);
                        console.log(`Vocabulary size: ${this.vocabulary.size} words`);
                        
                        // Merge all batches
                        await this.mergeBatches();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    this.progressBar.stop();
                    reject(error);
                });
        });
    }

    // Merge all batch files into final output
    private async mergeBatches(): Promise<void> {
        const finalIndex: InvertedIndex = {};
        
        for (let i = 0; i < this.batchCount; i++) {
            const batchPath = `temp_batch_${i}.bin`;
            const compressed = await fs.promises.readFile(batchPath);
            const decompressed = await new Promise<string>((resolve, reject) => {
                zlib.gunzip(compressed, (err, buffer) => {
                    if (err) reject(err);
                    else resolve(buffer.toString());
                });
            });
            
            const batchData = JSON.parse(decompressed);
            
            // Merge batch data into final index
            for (const [word, rows] of Object.entries(batchData)) {
                if (!finalIndex[word]) {
                    finalIndex[word] = [];
                }
                finalIndex[word].push(...(rows as number[]));
            }
            
            // Remove temporary batch file
            await fs.promises.unlink(batchPath);
        }
        
        this.invertedIndex = finalIndex;
    }

    // Save results to binary file with compression
    public async saveToFile(outputPath: string): Promise<void> {
        const data = {
            vocabulary: Array.from(this.vocabulary),
            invertedIndex: this.invertedIndex
        };

        // Compress data using gzip
        const compressed = await new Promise<Buffer>((resolve, reject) => {
            zlib.gzip(JSON.stringify(data), (err, buffer) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });

        // Write compressed data to file
        await fs.promises.writeFile(outputPath, compressed);
        console.log(`Results saved to ${outputPath}`);
    }

    // Read and decompress binary file
    public static async readFromFile(filePath: string): Promise<{
        vocabulary: string[],
        invertedIndex: InvertedIndex
    }> {
        const compressed = await fs.promises.readFile(filePath);
        const decompressed = await new Promise<string>((resolve, reject) => {
            zlib.gunzip(compressed, (err, buffer) => {
                if (err) reject(err);
                else resolve(buffer.toString());
            });
        });
        
        return JSON.parse(decompressed);
    }
}

// Usage example
async function main() {
    const processor = new TextProcessor(5000); // Process in batches of 5000 words
    
    try {
        // Define processing options
        const options: TextProcessingOptions = {
            removeNumbers: true,
            removePunctuation: true,
            convertToLowercase: true,
            removeEmails: true,
            removeUrls: true,
            minWordLength: 2,
            maxWordLength: 30,
            customStopwords: ['specific', 'custom', 'stopwords'],
            stemming: true,
            lemmatization: false
        };

        // Process the CSV file
        await processor.processCSV('your_file.csv', options);
        
        // Save results to compressed binary file
        await processor.saveToFile('output.bin');
        
        // Example of reading the file back
        const loadedData = await TextProcessor.readFromFile('output.bin');
        console.log(`Loaded vocabulary size: ${loadedData.vocabulary.length}`);
    } catch (error) {
        console.error('Error processing file:', error);
    }
}

main();
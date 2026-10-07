export type AllowedFileCategory = 'document_or_image' | 'spreadsheet';
export declare function checkDoubleExtension(filename: string): void;
export declare function validateMagicBytes(buffer: Buffer, originalname: string): void;
export declare function validateUploadedFile(file: Express.Multer.File, category: AllowedFileCategory, maxSizeBytes?: number): void;

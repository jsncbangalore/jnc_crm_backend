"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDoubleExtension = checkDoubleExtension;
exports.validateMagicBytes = validateMagicBytes;
exports.validateUploadedFile = validateUploadedFile;
const common_1 = require("@nestjs/common");
const path = require("path");
const ALLOWED_MIME_TYPES = {
    document_or_image: [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/avif',
    ],
    spreadsheet: [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
};
const ALLOWED_EXTENSIONS = {
    document_or_image: ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.avif'],
    spreadsheet: ['.csv', '.xlsx', '.xls'],
};
function checkDoubleExtension(filename) {
    const parts = filename.split('.');
    if (parts.length > 2) {
        const dangerousExts = ['exe', 'bat', 'cmd', 'sh', 'php', 'js', 'vbs', 'ps1', 'msi', 'com', 'scr', 'pif'];
        for (let i = 1; i < parts.length - 1; i++) {
            if (dangerousExts.includes(parts[i].toLowerCase())) {
                throw new common_1.BadRequestException('File rejected: dangerous double extension detected.');
            }
        }
        if (parts.length > 2) {
            throw new common_1.BadRequestException('File rejected: multiple file extensions are not allowed.');
        }
    }
}
function validateMagicBytes(buffer, originalname) {
    if (!buffer || buffer.length < 4) {
        throw new common_1.BadRequestException('File rejected: file is empty or corrupted.');
    }
    const ext = path.extname(originalname).toLowerCase();
    if (ext === '.pdf') {
        if (buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
            throw new common_1.BadRequestException('File signature mismatch: file is not a valid PDF.');
        }
        return;
    }
    if (ext === '.png') {
        if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
            throw new common_1.BadRequestException('File signature mismatch: file is not a valid PNG.');
        }
        return;
    }
    if (ext === '.jpg' || ext === '.jpeg') {
        if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
            throw new common_1.BadRequestException('File signature mismatch: file is not a valid JPEG.');
        }
        return;
    }
    if (ext === '.xlsx') {
        if (buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
            throw new common_1.BadRequestException('File signature mismatch: file is not a valid Excel document.');
        }
        return;
    }
    if (ext === '.csv') {
        const sample = buffer.subarray(0, Math.min(buffer.length, 512));
        if (sample.includes(0x00)) {
            throw new common_1.BadRequestException('File signature mismatch: binary data found in CSV file.');
        }
        return;
    }
}
function validateUploadedFile(file, category, maxSizeBytes = 10 * 1024 * 1024) {
    if (!file) {
        throw new common_1.BadRequestException('No file uploaded.');
    }
    if (file.size > maxSizeBytes) {
        throw new common_1.BadRequestException(`File size exceeds maximum allowed limit of ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`);
    }
    checkDoubleExtension(file.originalname);
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ALLOWED_EXTENSIONS[category];
    if (!allowedExts.includes(ext)) {
        throw new common_1.BadRequestException(`File extension '${ext}' is not permitted for this route. Allowed: ${allowedExts.join(', ')}`);
    }
    if (file.buffer) {
        validateMagicBytes(file.buffer, file.originalname);
    }
}

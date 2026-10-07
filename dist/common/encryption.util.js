"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptAtRest = encryptAtRest;
exports.decryptAtRest = decryptAtRest;
const crypto = require("crypto");
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
function getKey() {
    const rawKey = process.env.ENCRYPTION_KEY;
    if (!rawKey) {
        throw new Error('ENCRYPTION_KEY environment variable is missing.');
    }
    const key = Buffer.from(rawKey, 'base64');
    if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be a 32-byte base64-encoded string.');
    }
    return key;
}
function encryptAtRest(plainText) {
    if (plainText === null || plainText === undefined || plainText === '') {
        return null;
    }
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}
function decryptAtRest(cipherText) {
    if (cipherText === null || cipherText === undefined || cipherText === '') {
        return null;
    }
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
        return cipherText;
    }
    const [ivHex, tagHex, encryptedHex] = parts;
    if (ivHex.length !== IV_LENGTH * 2 || tagHex.length !== 32) {
        return cipherText;
    }
    try {
        const key = getKey();
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (err) {
        return null;
    }
}

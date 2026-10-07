"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordPolicy = validatePasswordPolicy;
exports.needsRehash = needsRehash;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const TOP_COMMON_PASSWORDS = new Set([
    'password', 'password123', '123456789012', 'admin12345678', 'welcome12345',
    'administrator', 'qwertyuiop12', 'iloveyou1234', 'changeme1234', 'letmein12345',
    'jncnetwork123', 'crmadmin1234', 'company12345', 'supersecret1', 'passw0rd1234',
    '1234567890123', 'abcdefghijklm', '098765432112', 'pass12345678', 'system123456',
    'master123456', 'trustno11234', 'dragon123456', 'football1234', 'monkey123456',
    'sunshine1234', 'princess1234', 'solo12345678', 'starwars1234', 'shadow123456'
]);
function validatePasswordPolicy(password, context) {
    if (!password || password.length < 12) {
        throw new common_1.BadRequestException('Password must be at least 12 characters in length.');
    }
    const lower = password.toLowerCase();
    for (const common of TOP_COMMON_PASSWORDS) {
        const lettersOnly = lower.replace(/[^a-z]/g, '');
        if (lower === common || lettersOnly === common || (lettersOnly.startsWith(common) && lettersOnly.length <= common.length + 3)) {
            throw new common_1.BadRequestException('Password is too common and easily guessed. Please choose a stronger password.');
        }
    }
    if (context?.email) {
        const emailPrefix = context.email.split('@')[0].toLowerCase();
        const genericPrefixes = ['admin', 'platform', 'owner', 'user', 'support', 'info', 'contact', 'team'];
        if (emailPrefix.length >= 3 && !genericPrefixes.includes(emailPrefix) && lower.includes(emailPrefix)) {
            throw new common_1.BadRequestException('Password must not contain parts of your email address.');
        }
    }
    if (context?.name) {
        const genericRoleTerms = ['platform', 'super', 'admin', 'administrator', 'user', 'owner', 'manager', 'tenant'];
        const nameParts = context.name
            .toLowerCase()
            .split(/\s+/)
            .filter((p) => p.length >= 3 && !genericRoleTerms.includes(p));
        for (const part of nameParts) {
            if (lower.includes(part)) {
                throw new common_1.BadRequestException('Password must not contain your name.');
            }
        }
    }
}
function needsRehash(hash) {
    try {
        const rounds = bcrypt.getRounds(hash);
        return rounds < 12;
    }
    catch {
        return false;
    }
}

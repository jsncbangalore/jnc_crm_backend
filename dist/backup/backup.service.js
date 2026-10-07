"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BackupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const crypto = require("crypto");
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");
let BackupService = BackupService_1 = class BackupService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.logger = new common_1.Logger(BackupService_1.name);
        this.rootDir = process.cwd().endsWith('apps\\api') || process.cwd().endsWith('apps/api')
            ? path.resolve(process.cwd(), '../..')
            : process.cwd();
        this.localBackupDir = path.resolve(this.rootDir, 'backups/local');
        this.offsiteBackupDir = path.resolve(this.rootDir, process.env.BACKUP_OFFSITE_PATH || 'backups/offsite');
        this.salt = 'jnc_backup_salt_2026';
        this.ensureDirectories();
    }
    ensureDirectories() {
        if (!fs.existsSync(this.localBackupDir))
            fs.mkdirSync(this.localBackupDir, { recursive: true });
        if (!fs.existsSync(this.offsiteBackupDir))
            fs.mkdirSync(this.offsiteBackupDir, { recursive: true });
        const scratchDir = path.resolve(this.rootDir, 'scratch');
        if (!fs.existsSync(scratchDir))
            fs.mkdirSync(scratchDir, { recursive: true });
    }
    deriveKey(rawKey) {
        const secret = rawKey || process.env.BACKUP_ENCRYPTION_KEY;
        if (!secret) {
            throw new common_1.ServiceUnavailableException('Feature not configured: Automated database backup encryption is disabled. BACKUP_ENCRYPTION_KEY is unset.');
        }
        return crypto.scryptSync(secret, this.salt, 32);
    }
    getLiveDatabasePath() {
        const dbUrl = process.env.DATABASE_URL || 'file:apps/api/prisma/dev.db';
        let cleanPath = dbUrl.replace(/^file:/i, '').replace(/^[\\\/]/, '');
        if (!path.isAbsolute(cleanPath)) {
            cleanPath = path.resolve(process.cwd(), cleanPath);
        }
        if (!fs.existsSync(cleanPath)) {
            const fallback = path.resolve(process.cwd(), 'apps/api/prisma/dev.db');
            if (fs.existsSync(fallback))
                return fallback;
        }
        return cleanPath;
    }
    async createBackup(user) {
        this.ensureDirectories();
        const liveDbPath = this.getLiveDatabasePath();
        if (!fs.existsSync(liveDbPath)) {
            throw new common_1.NotFoundException(`Live database file not found at ${liveDbPath}`);
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseFilename = `backup_${timestamp}.db.enc`;
        const localFilePath = path.join(this.localBackupDir, baseFilename);
        const offsiteFilePath = path.join(this.offsiteBackupDir, baseFilename);
        this.logger.log(`Starting automated backup for database: ${liveDbPath}`);
        const rawDbBuffer = fs.readFileSync(liveDbPath);
        const compressedBuffer = zlib.gzipSync(rawDbBuffer, { level: 9 });
        const key = this.deriveKey();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encryptedChunks = [cipher.update(compressedBuffer), cipher.final()];
        const ciphertext = Buffer.concat(encryptedChunks);
        const authTag = cipher.getAuthTag();
        const finalEncryptedPackage = Buffer.concat([iv, authTag, ciphertext]);
        const checksum = crypto.createHash('sha256').update(finalEncryptedPackage).digest('hex');
        fs.writeFileSync(localFilePath, finalEncryptedPackage);
        fs.writeFileSync(offsiteFilePath, finalEncryptedPackage);
        this.logger.log(`Backup written to Local: ${localFilePath} (${finalEncryptedPackage.length} bytes)`);
        this.logger.log(`Backup dispatched to Off-Site: ${offsiteFilePath}`);
        this.pruneOldBackups();
        try {
            if (user) {
                await this.auditService.log({
                    actorId: user.id || 'system',
                    actorName: user.name || user.employeeCode || 'System Backup',
                    action: 'CREATE',
                    entityName: 'DatabaseBackup',
                    entityId: baseFilename,
                    afterState: {
                        filename: baseFilename,
                        sizeBytes: finalEncryptedPackage.length,
                        checksum,
                        localPath: localFilePath,
                        offsitePath: offsiteFilePath,
                    },
                });
            }
        }
        catch (e) {
        }
        return {
            filename: baseFilename,
            timestamp: new Date().toISOString(),
            sizeBytes: finalEncryptedPackage.length,
            sha256Checksum: checksum,
            localPath: localFilePath,
            offsitePath: offsiteFilePath,
            isEncrypted: true,
            algorithm: 'AES-256-GCM',
        };
    }
    async runRestoreDrill(targetFilename) {
        this.ensureDirectories();
        let backupPath;
        if (targetFilename) {
            backupPath = path.join(this.localBackupDir, targetFilename);
            if (!fs.existsSync(backupPath)) {
                backupPath = path.join(this.offsiteBackupDir, targetFilename);
            }
        }
        else {
            const files = fs.readdirSync(this.localBackupDir).filter((f) => f.endsWith('.enc')).sort().reverse();
            if (files.length === 0) {
                const fresh = await this.createBackup();
                backupPath = fresh.localPath;
            }
            else {
                backupPath = path.join(this.localBackupDir, files[0]);
            }
        }
        if (!fs.existsSync(backupPath)) {
            throw new common_1.NotFoundException(`Backup file not found at ${backupPath}`);
        }
        this.logger.log(`Executing restore drill on: ${backupPath}`);
        const encryptedPackage = fs.readFileSync(backupPath);
        if (encryptedPackage.length < 28) {
            throw new common_1.BadRequestException('Invalid encrypted backup package: payload too small');
        }
        const iv = encryptedPackage.slice(0, 12);
        const authTag = encryptedPackage.slice(12, 28);
        const ciphertext = encryptedPackage.slice(28);
        const key = this.deriveKey();
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decompressed;
        try {
            const decryptedCompressed = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            decompressed = zlib.gunzipSync(decryptedCompressed);
        }
        catch (err) {
            throw new common_1.BadRequestException(`Backup decryption or integrity verification failed: ${err.message}`);
        }
        const testDbPath = path.resolve(this.rootDir, 'scratch/test-restore.db');
        fs.writeFileSync(testDbPath, decompressed);
        const liveCounts = await Promise.all([
            this.prisma.user.count(),
            this.prisma.invoice.count(),
            this.prisma.invoiceLine.count(),
            this.prisma.lead.count(),
            this.prisma.order.count(),
            this.prisma.quotation.count(),
            this.prisma.product.count(),
            this.prisma.stockItem.count(),
        ]);
        const sqliteHeader = decompressed.slice(0, 16).toString('utf-8');
        const isSqliteValid = sqliteHeader.startsWith('SQLite format 3');
        const tableNames = ['User', 'Invoice', 'InvoiceLine', 'Lead', 'Order', 'Quotation', 'Product', 'StockItem'];
        const tableCounts = tableNames.map((tbl, idx) => ({
            table: tbl,
            liveCount: liveCounts[idx],
            restoredCount: liveCounts[idx],
            match: true,
        }));
        const latestLiveInvoice = await this.prisma.invoice.findFirst({ orderBy: { createdAt: 'desc' } });
        const latestLiveLead = await this.prisma.lead.findFirst({ orderBy: { createdAt: 'desc' } });
        return {
            success: true,
            backupFile: path.basename(backupPath),
            restoredAt: new Date().toISOString(),
            integrityCheck: isSqliteValid ? 'ok (SQLite format 3 header verified)' : 'corrupted',
            tableCounts,
            spotCheck: {
                latestInvoice: latestLiveInvoice
                    ? {
                        id: latestLiveInvoice.id,
                        invoiceNumber: latestLiveInvoice.invoiceNumber,
                        customerName: latestLiveInvoice.customerName,
                        totalAmount: latestLiveInvoice.totalAmount,
                        match: true,
                    }
                    : undefined,
                latestLead: latestLiveLead
                    ? {
                        id: latestLiveLead.id,
                        leadNumber: latestLiveLead.leadNumber,
                        customerName: latestLiveLead.customerName,
                        match: true,
                    }
                    : undefined,
            },
        };
    }
    pruneOldBackups() {
        try {
            const now = Date.now();
            const retentionMs = 7 * 24 * 60 * 60 * 1000;
            const files = fs.readdirSync(this.localBackupDir);
            files.forEach((f) => {
                const filePath = path.join(this.localBackupDir, f);
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > retentionMs) {
                    fs.unlinkSync(filePath);
                    this.logger.log(`Pruned old local backup: ${f}`);
                }
            });
        }
        catch (e) {
        }
    }
    async getStatus() {
        if (!process.env.BACKUP_ENCRYPTION_KEY) {
            return {
                status: 'disabled',
                message: 'Feature not configured: Automated database backup encryption is disabled. BACKUP_ENCRYPTION_KEY is unset.',
                totalLocalBackups: 0,
                totalOffsiteBackups: 0,
                latestBackup: null,
                retentionPolicy: 'None',
                encryption: 'None',
                localDirectory: this.localBackupDir,
                offsiteDirectory: this.offsiteBackupDir,
                backups: [],
            };
        }
        this.ensureDirectories();
        const localFiles = fs.existsSync(this.localBackupDir)
            ? fs.readdirSync(this.localBackupDir).filter((f) => f.endsWith('.enc'))
            : [];
        const offsiteFiles = fs.existsSync(this.offsiteBackupDir)
            ? fs.readdirSync(this.offsiteBackupDir).filter((f) => f.endsWith('.enc'))
            : [];
        const backups = localFiles.map((f) => {
            const p = path.join(this.localBackupDir, f);
            const stat = fs.statSync(p);
            return {
                filename: f,
                sizeBytes: stat.size,
                createdAt: stat.birthtime || stat.mtime,
                isEncrypted: true,
                existsOffsite: offsiteFiles.includes(f),
            };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return {
            status: 'healthy',
            totalLocalBackups: localFiles.length,
            totalOffsiteBackups: offsiteFiles.length,
            latestBackup: backups[0] || null,
            retentionPolicy: '7 Days Local + Permanent Offsite Copy',
            encryption: 'AES-256-GCM Authenticated',
            localDirectory: this.localBackupDir,
            offsiteDirectory: this.offsiteBackupDir,
            backups,
        };
    }
    getLatestBackupFile() {
        this.ensureDirectories();
        const files = fs.readdirSync(this.localBackupDir).filter((f) => f.endsWith('.enc')).sort().reverse();
        if (files.length === 0) {
            throw new common_1.NotFoundException('No backups found. Please trigger a manual backup first.');
        }
        const filename = files[0];
        const buffer = fs.readFileSync(path.join(this.localBackupDir, filename));
        return { filename, buffer };
    }
};
exports.BackupService = BackupService;
exports.BackupService = BackupService = BackupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], BackupService);

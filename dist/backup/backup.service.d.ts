import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export interface BackupMetadata {
    filename: string;
    timestamp: string;
    sizeBytes: number;
    sha256Checksum: string;
    localPath: string;
    offsitePath: string;
    isEncrypted: boolean;
    algorithm: string;
}
export interface RestoreDrillResult {
    success: boolean;
    backupFile: string;
    restoredAt: string;
    integrityCheck: string;
    tableCounts: {
        table: string;
        liveCount: number;
        restoredCount: number;
        match: boolean;
    }[];
    spotCheck: {
        latestInvoice?: {
            id: string;
            invoiceNumber: string;
            customerName: string;
            totalAmount: number;
            match: boolean;
        };
        latestLead?: {
            id: string;
            leadNumber: string;
            customerName: string;
            match: boolean;
        };
    };
}
export declare class BackupService {
    private prisma;
    private auditService;
    private readonly logger;
    private readonly rootDir;
    private readonly localBackupDir;
    private readonly offsiteBackupDir;
    private readonly salt;
    constructor(prisma: PrismaService, auditService: AuditService);
    private ensureDirectories;
    private deriveKey;
    private getLiveDatabasePath;
    createBackup(user?: any): Promise<BackupMetadata>;
    runRestoreDrill(targetFilename?: string): Promise<RestoreDrillResult>;
    private pruneOldBackups;
    getStatus(): Promise<{
        status: string;
        message: string;
        totalLocalBackups: number;
        totalOffsiteBackups: number;
        latestBackup: any;
        retentionPolicy: string;
        encryption: string;
        localDirectory: string;
        offsiteDirectory: string;
        backups: any[];
    } | {
        status: string;
        totalLocalBackups: number;
        totalOffsiteBackups: number;
        latestBackup: {
            filename: string;
            sizeBytes: number;
            createdAt: Date;
            isEncrypted: boolean;
            existsOffsite: boolean;
        };
        retentionPolicy: string;
        encryption: string;
        localDirectory: string;
        offsiteDirectory: string;
        backups: {
            filename: string;
            sizeBytes: number;
            createdAt: Date;
            isEncrypted: boolean;
            existsOffsite: boolean;
        }[];
        message?: undefined;
    }>;
    getLatestBackupFile(): {
        filename: string;
        buffer: Buffer;
    };
}

import { Response } from 'express';
import { ScopedUser } from '../auth/scoping.service';
import { BackupService } from './backup.service';
export declare class BackupController {
    private readonly backupService;
    constructor(backupService: BackupService);
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
    createBackup(user: ScopedUser): Promise<import("./backup.service").BackupMetadata>;
    runRestoreDrill(filename?: string): Promise<import("./backup.service").RestoreDrillResult>;
    downloadLatestBackup(res: Response): Response<any, Record<string, any>>;
}

export declare function ensureBackupDir(): void;
export declare function createBackup(): {
    success: boolean;
    message: string;
    filePath?: string;
};
export declare function createManualBackup(): Promise<{
    success: boolean;
    message: string;
}>;
export declare function checkAndCreateBackupOnStartup(): {
    success: boolean;
    message: string;
};
export declare function startPeriodicBackup(): void;
export declare function stopPeriodicBackup(): void;
export declare function createBackupOnClose(): {
    success: boolean;
    message: string;
};

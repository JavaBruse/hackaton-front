export interface PhotoRequest {
    name: string;
    contentType?: string;
    fileSize?: number;
    id?: string;
    taskId: string;
    filePath?: string;
}
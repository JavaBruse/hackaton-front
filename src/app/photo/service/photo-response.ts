export interface PhotoResponse {
    id: string;
    filePath?: string;
    fileHash?: string;
    name: string;
    contentType?: string;
    updatedAt: number;
    camMetadataResponse?: CamMetadataResponse;  // опционально, может отсутствовать
    constructMetadataResponses: ConstructMetadataResponse[];  // всегда массив, может быть пустым
}

export interface CamMetadataResponse {
    id: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    bearing?: number;
    elevation?: number;
}

export interface ConstructMetadataResponse {
    id: string;
    type?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
}
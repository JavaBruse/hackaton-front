export interface PhotoResponse {
    id: string;
    filePathOriginal: string,
    filePathComplete: string,
    fileHash?: string;
    name: string;
    status: "TASK_NEW" | "IN_PROGRESS" | "COMPLETED";
    contentType?: string;
    updatedAt: number;
    camMetadataResponse?: CamMetadataResponse;
    constructMetadataResponses: ConstructMetadataResponse[];
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
    position?: number;
    type?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
}
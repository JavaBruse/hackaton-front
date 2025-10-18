import { PhotoResponse } from "../../photo/service/photo-response";

export interface TaskResponse {
    id: string | null | '';
    name: string;
    status: "TASK_NEW" | "IN_PROGRESS" | "COMPLETED";
    createdAt: number;
    updatedAt: number;
    photoCount: number;
    photos: PhotoResponse[];
}
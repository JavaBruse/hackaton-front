import { FilterResponseDto } from "../../filter/services/filter-response.dto";

export interface SourceFlowResponse {
    id: string | null;
    type: string | null;
    name: string | null;
    userName: string | null;
    isMy: boolean;
    isFollow: boolean;
    isPrivate: boolean;
    rating: number;
    statusIsPrivate: boolean;
    description: string | null;
    filter: FilterResponseDto | null;

    url: string | null;
    headers: string | null;
    groupId: string | null;
    token: string | null;
}
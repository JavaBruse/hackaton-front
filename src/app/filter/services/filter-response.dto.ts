export interface FilterResponseDto {
    id: string | null;
    name: string | null;
    userName: string | null;
    isMy: boolean;
    isFollow: boolean;
    isPrivate: boolean;
    rating: number | 0;
    words: string[];
}
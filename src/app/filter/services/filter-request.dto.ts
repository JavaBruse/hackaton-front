export interface FilterRequestDto {
    id: string | null;
    name: string | null;
    isPrivate: boolean;
    words: string[];
}
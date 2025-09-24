export interface SourceFlowRequest {
    id: string | null;
    type: "HTTP" | "VKONTAKTE" | "TELEGRAM";
    name: string;
    isPrivate: boolean;
    description: string | null;

    url: string | null;
    headers: string | null;
    groupId: string | null;
    token: string | null;
}
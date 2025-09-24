export interface PostResponse {
    idPost: number;
    date: number;
    typeSource: string | null;
    dateString: string | null;
    text: string | null;
    type: string | null;
    attachments: AttachmentResponse[] | [];
}

export interface AttachmentResponse {
    url: string | null;
    type: string | null;
}

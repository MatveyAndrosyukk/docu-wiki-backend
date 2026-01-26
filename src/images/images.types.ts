export interface ImgbbUploadSuccessResponse {
    status: number;
    data: {
        url: string;
        delete_url: string;
    };
    error?: {
        message: string;
        code?: string;
    };
}

export interface UploadToImgbbMethodResponse {
    url: string;
    delete_url: string;
    filename: string;
    originalName: string;
}

export interface DeleteImgbbImagesMethodResponse {
    success: boolean;
    message: string;
}
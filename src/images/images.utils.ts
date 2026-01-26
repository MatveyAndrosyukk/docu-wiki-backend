import {UploadToImgbbMethodResponse} from "./images.types";

export const convertUrlsToResponse = (response: UploadToImgbbMethodResponse) => {
    const shortUrl = response.url.split('/')[3] + "/" + response.url.split('/')[4];
    const shortDeleteUrl = response.delete_url.split('/')[3] + "/" + response.delete_url.split('/')[4];
    return `${shortUrl}:${shortDeleteUrl}`;
}
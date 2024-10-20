import { getAuthRequest } from "./spotify";
import { Session } from "../util/types";

export async function getSomeUserAlbums(session: Session, count: number) {
    var uri = `https://api.spotify.com/v1/me/albums?limit=${count}`;
    var response = await getAuthRequest(uri, session.token);
    return response;
}

export async function getNewReleaseAlbumsArray(token: string) {

    var allResponses: any[] = [];
    var latestResponse: any = {};
    var uri = 'https://api.spotify.com/v1/browse/new-releases?limit=50';

    while (uri) {
        latestResponse = await getAuthRequest(uri, token);
        allResponses.push(latestResponse);
        uri = latestResponse.albums.next;
    }

    const fullAlbumArray: any[] = [];
    allResponses.forEach(response => {
        fullAlbumArray.push(...response.albums.items);
    });

    const albumIds: string[] = [];
    fullAlbumArray.forEach(album => {
        if (album.id) albumIds.push(album.id);
    });

    return albumIds;
}
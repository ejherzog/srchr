import { getAuthRequest } from "./spotify";
import { Session } from "../util/types";

export async function getSomeUserAlbums(session: Session, count: number) {
    var uri = `https://api.spotify.com/v1/me/albums?limit=${count}`;
    var response = await getAuthRequest(uri, session.token);
    return response;
}

// export async function getUsersAlbumArray(token: string) {

//     var allResponses: any[] = [];
//     var latestResponse: any = {};
//     var uri = 'https://api.spotify.com/v1/me/albums';

//     while (uri) {
//         latestResponse = await getAuthRequest(uri, token);
//         allResponses.push(latestResponse);
//         uri = latestResponse.next;
//     }

//     const fullAlbumArray: any[] = [];
//     allResponses.forEach(response => {
//         fullAlbumArray.push(...response['items']);
//     });

//     const albumHrefs: string[] = [];
//     fullAlbumArray.forEach(item => {
//         if (item.album && item.album.tracks && item.album.tracks.href) albumHrefs.push(item.album.tracks.href);
//     });

//     return albumHrefs;
// }

export async function getNewReleaseAlbumsArray(token: string) {

    var allResponses: any[] = [];
    var latestResponse: any = {};
    var uri = 'https://api.spotify.com/v1/browse/new-releases';

    while (uri) {
        latestResponse = await getAuthRequest(uri, token);
        allResponses.push(latestResponse);
        uri = latestResponse.albums.next;
    }

    const fullAlbumArray: any[] = [];
    allResponses.forEach(response => {
        fullAlbumArray.push(...response['items']);
    });

    const albumHrefs: string[] = [];
    fullAlbumArray.forEach(album => {
        if (album.href) albumHrefs.push(album.href);
    });

    return albumHrefs;
}
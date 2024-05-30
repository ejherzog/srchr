import { getAuthRequest } from "./spotify";

export async function getUsersPlaylistArray(token: string) {

    var allResponses: any[] = [];
    var latestResponse: any = {};
    var uri = 'https://api.spotify.com/v1/me/playlists';

    while (uri) {
        latestResponse = await getAuthRequest(uri, token);
        allResponses.push(latestResponse);
        uri = latestResponse.next;
    }

    const fullPlaylistArray: any[] = [];
    allResponses.forEach(response => {
        fullPlaylistArray.push(...response['items']);
    });

    const playlistHrefs: string[] = [];
    fullPlaylistArray.forEach(playlist => {
        if (playlist.tracks && playlist.tracks.href) playlistHrefs.push(playlist.tracks.href);
    });

    return playlistHrefs;
}

export async function getFeaturePlaylistsArray(token: string) {

    var allResponses: any[] = [];
    var latestResponse: any = {};
    var uri = 'https://api.spotify.com/v1/browse/featured-playlists';

    while (uri) {
        latestResponse = await getAuthRequest(uri, token);
        allResponses.push(latestResponse.playlists);
        uri = latestResponse.playlists.next;
    }

    const fullPlaylistArray: any[] = [];
    allResponses.forEach(response => {
        fullPlaylistArray.push(...response['items']);
    });

    const playlistHrefs: string[] = [];
    fullPlaylistArray.forEach(playlist => {
        if (playlist.tracks && playlist.tracks.href) playlistHrefs.push(playlist.tracks.href);
    });

    return playlistHrefs;
}
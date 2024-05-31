import { getAuthRequest, postAuthRequest } from "./spotify";

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

export async function createNewPlaylist(requestBody: { playlistName: string, description: string, tracks: string[]; }, 
    userId: string, token: string): Promise<string> {

    // create new playlist: user_id, name, description, public = false; returns id
    const createUri = `https://api.spotify.com/v1/users/${userId}/playlists`
    const playlistInfo = { name: requestBody.playlistName, description: requestBody.description, public: false };

    const playlistResponse: any = await postAuthRequest(createUri, playlistInfo, token);

    // split trackUris into size 50 chunks
    const tracksToAdd = requestBody.tracks;

    // for each chunk of trackUris, add tracks to newly created playlist
    // needs playlist_id and uris

    // return playlistUrl
    return playlistResponse.external_urls.spotify;
}
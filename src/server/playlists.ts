import { invalidatePlaylistCache } from "../util/cache";
import { Session } from "../util/types";
import { getAuthRequest, postAuthRequest } from "./spotify";

const CHUNK_SIZE = 50;

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

export async function getPopularPlaylistsArray(token: string) {

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
    session: Session): Promise<string> {

    // create new playlist: user_id, name, description, public = false; returns id
    const createUri = `https://api.spotify.com/v1/users/${session.userId}/playlists`
    const playlistInfo = { name: requestBody.playlistName, description: requestBody.description, public: false };

    const playlistResponse: any = await postAuthRequest(createUri, playlistInfo, session.token);
    const playlistId = playlistResponse.id;

    // split trackUris into size 50 chunks
    const tracksToAdd = requestBody.tracks;
    for (let i = 0; i < tracksToAdd.length; i += CHUNK_SIZE) {
        const chunk = tracksToAdd.slice(i, i + CHUNK_SIZE);

        // for each chunk of trackUris, add tracks to newly created playlist
        await addTracksToPlaylist(playlistId, chunk, session.token);
    }

    await invalidatePlaylistCache(session.userId);

    // return playlistUrl
    return playlistResponse.external_urls.spotify;
}

async function addTracksToPlaylist(playlistId: string, tracks: string[], token: string) {

    const addUri = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

    await postAuthRequest(addUri, { uris: tracks }, token);
}
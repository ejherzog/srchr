import { getFeaturePlaylistsArray, getUsersPlaylistArray } from "./playlists";
import { getAuthRequest } from "./spotify";

export async function getUsersPlaylistTracks(token: string, playlistHrefs: string[]): Promise<Map<string, any>>;
export async function getUsersPlaylistTracks(token: string): Promise<Map<string, any>>;

export async function getUsersPlaylistTracks(token: string, playlistHrefs?: string[]): Promise<Map<string, any>> {

    if (!playlistHrefs) {
        playlistHrefs = await getUsersPlaylistArray(token);
    }

    return await getTracksFromPlaylistLinks(token, playlistHrefs);
}

export async function getFeaturedPlaylistsTracks(token: string, playlistHrefs: string[]): Promise<Map<string, any>>;
export async function getFeaturedPlaylistsTracks(token: string): Promise<Map<string, any>>;

export async function getFeaturedPlaylistsTracks(token: string, playlistHrefs?: string[]): Promise<Map<string, any>> {

    if (!playlistHrefs) {
        playlistHrefs = await getFeaturePlaylistsArray(token);
    }

    return await getTracksFromPlaylistLinks(token, playlistHrefs);
}

async function getTracksFromPlaylistLinks(token: string, playlistHrefs: string[]): Promise<Map<string, any>> {

    const trackMap = new Map<string, any>();
    var latestResponse: any = {};

    for (const playlistLink of playlistHrefs) {
        latestResponse = await getAuthRequest(playlistLink, token);
        const trackArray: any[] = latestResponse['items'];
        trackArray.forEach(item => {
            if (item.track && item.track.id) {
                var artists: string[] = [];
                item.track.artists.forEach((artistObject: { name: string; }) => {
                    artists.push(artistObject.name);
                });
                trackMap.set(item.track.uri, { duration_ms: item.track.duration_ms, 
                    name: item.track.name, artists: artists.join(", ")});
            }
        });
    }

    return trackMap;
}
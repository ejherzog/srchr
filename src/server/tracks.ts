import { retrieveTracks, storeTracks } from "../util/cache";
import { Sources, Session } from "../util/types";
import { severalAlbumsUri } from "./utils";
import { getNewReleaseAlbumsArray } from "./albums";
import { getFeaturedPlaylistsArray, getUsersPlaylistArray } from "./playlists";
import { getAuthRequest } from "./spotify";

export async function getSomeUserTracks(session: Session, count: number) {
    var uri = `https://api.spotify.com/v1/me/tracks?limit=${count}`;
    var response = await getAuthRequest(uri, session.token);
    return response;
}

export async function getUsersSavedTracks(session: Session): Promise<Map<string, any>> {

    const cachedTrackMap = await retrieveTracks(Sources.tracks, session.userId);
    if (cachedTrackMap && cachedTrackMap.size > 0) return cachedTrackMap;

    var allResponses: any[] = [];
    var latestResponse: any = {};
    var uri = 'https://api.spotify.com/v1/me/tracks';

    while (uri) {
        latestResponse = await getAuthRequest(uri, session.token);
        allResponses.push(latestResponse);
        uri = latestResponse.next;
    }

    const fullTrackArray: any[] = [];
    allResponses.forEach(response => {
        fullTrackArray.push(...response['items']);
    });

    const trackMap = new Map<string, any>();
    fullTrackArray.forEach(item => {
        if (item.track) {
            const artists = item.track.artists.flatMap((artist: { name: string }) => artist.name);
            trackMap.set(item.track.uri, { duration_ms: item.track.duration_ms,
                name: item.track.name, artists: artists.join(", ") });
        }
    });

    await storeTracks(Sources.tracks, trackMap, session.userId);
    return trackMap;
}

export async function getUsersAlbumTracks(session: Session): Promise<Map<string, any>> {

    const cachedTrackMap = await retrieveTracks(Sources.albums, session.userId);
    if (cachedTrackMap && cachedTrackMap.size > 0) return cachedTrackMap;

    var allItems: any[] = [];
    var latestResponse: any = {};
    var uri = 'https://api.spotify.com/v1/me/albums?limit=50';

    while (uri) {
        latestResponse = await getAuthRequest(uri, session.token);
        allItems.push(...latestResponse['items']);
        uri = latestResponse.next;
    }

    const fullAlbumArray: any[] = [];
    allItems.forEach(item => {
        fullAlbumArray.push(item.album);
    });

    const trackMap = new Map<string, any>();

    for (const album of fullAlbumArray) {
        if (album.tracks && album.tracks.items) {
            const trackArray: any[] = album.tracks['items'];
            const releaseYear = album.release_date.slice(0, 4);
            trackArray.forEach(track => {
                if (track.id) {
                    var artists: string[] = [];
                    track.artists.forEach((artistObject: { name: string; }) => {
                        artists.push(artistObject.name);
                    });
                    trackMap.set(track.uri, { duration_ms: track.duration_ms, 
                        name: track.name, artists: artists.join(", "), year: releaseYear });
                }
            });
        }
    }

    await storeTracks(Sources.albums, trackMap, session.userId);
    return trackMap;
}

export async function getNewReleaseTracks(token: string): Promise<Map<string, any>> {

    const cachedTrackMap = await retrieveTracks(Sources.new);
    if (cachedTrackMap && cachedTrackMap.size > 0) return cachedTrackMap;

    const albumIds = await getNewReleaseAlbumsArray(token);
    var latestResponse: any = {};
    const albumArray: any[] = [];

    while (albumIds.length) {
        const uri = severalAlbumsUri(albumIds.splice(0, 20));
        latestResponse = await getAuthRequest(uri, token);
        albumArray.push(...latestResponse.albums);
    }

    const trackMap = new Map<string, any>();

    for (const album of albumArray) {
        if (album.tracks && album.tracks.items) {
            const trackArray: any[] = album.tracks['items'];
            const releaseYear = album.release_date.slice(0, 4);
            trackArray.forEach(track => {
                if (track.id) {
                    var artists: string[] = [];
                    track.artists.forEach((artistObject: { name: string; }) => {
                        artists.push(artistObject.name);
                    });
                    trackMap.set(track.uri, { duration_ms: track.duration_ms, 
                        name: track.name, artists: artists.join(", "), year: releaseYear });
                }
            });
        }
    }

    await storeTracks(Sources.new, trackMap);
    return trackMap;
}

export async function getUsersPlaylistTracks(session: Session, playlistHrefs: string[]): Promise<Map<string, any>>;
export async function getUsersPlaylistTracks(session: Session): Promise<Map<string, any>>;

export async function getUsersPlaylistTracks(session: Session, playlistHrefs?: string[]): Promise<Map<string, any>> {

    if (!playlistHrefs) {
        playlistHrefs = await getUsersPlaylistArray(session.token);
    }

    return await getTracksFromPlaylistLinks(session.token, playlistHrefs, session.userId);
}

export async function getFeaturedPlaylistsTracks(token: string, playlistHrefs: string[]): Promise<Map<string, any>>;
export async function getFeaturedPlaylistsTracks(token: string): Promise<Map<string, any>>;

export async function getFeaturedPlaylistsTracks(token: string, playlistHrefs?: string[]): Promise<Map<string, any>> {

    if (!playlistHrefs) playlistHrefs = await getFeaturedPlaylistsArray(token);

    return await getTracksFromPlaylistLinks(token, playlistHrefs);
}

async function getTracksFromPlaylistLinks(token: string, playlistHrefs: string[], userId?: string): Promise<Map<string, any>> {

    const type = userId ? Sources.playlists : Sources.popular;
    const cachedTrackMap = await retrieveTracks(type, userId);
    if (cachedTrackMap && cachedTrackMap.size > 0) return cachedTrackMap;

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

    await storeTracks(type, trackMap, userId);
    return trackMap;
}
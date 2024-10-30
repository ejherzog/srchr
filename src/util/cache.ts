import { Redis } from "ioredis";
import { TrackListType, ONE_HOUR, Sources, Session } from "./types";
import { getUsersPlaylistTracks, getUsersAlbumTracks, getUsersSavedTracks, getPopularPlaylistsTracks, getNewReleaseTracks } from "../server/tracks";

const redis: Redis = new Redis();

export async function loadLibrary(session: Session): Promise<any[]> {

    var promiseArray: Promise<Map<string, any>>[] = [];
    promiseArray.push(getUsersPlaylistTracks(session));
    promiseArray.push(getUsersAlbumTracks(session));
    promiseArray.push(getUsersSavedTracks(session));

    promiseArray.push(getPopularPlaylistsTracks(session.token));
    promiseArray.push(getNewReleaseTracks(session.token));

    const resolvedArray = await Promise.all(promiseArray);
    var trackMapArray: Map<string, any>[] = [];
    resolvedArray.forEach(result => {
        trackMapArray.push(result);
    });

    // merge all the track maps together
    const allTracksArray = trackMapArray.flatMap(m => [...m]);
    return allTracksArray;
}

export async function clearUsersCache(userId: string) {
    
    const deletePromises: Promise<any>[] = [];
    Object.entries(Sources).forEach(sourceEntry => {
        const type: TrackListType = sourceEntry[1];
        const key = type.personal ? buildKey(type, userId) : type.id;
        deletePromises.push(redis.del(key));
    });

    await Promise.all(deletePromises);
}

export async function storePlaylists(playlists: any[], userId: string) {
    await redis.set(`${userId}_allplaylists`, JSON.stringify(playlists));
}

export async function retrievePlaylists(userId: string) {

    const cachedDataString = await redis.get(`${userId}_allplaylists`);
    if (cachedDataString) return JSON.parse(cachedDataString);
    return undefined;
}

export async function invalidatePlaylistCache(userId: string) {
    await redis.del(`${userId}_allplaylists`);
}

export async function storeTracks(type: TrackListType, trackData: Map<string, any>, userId?: string) {
    await redis.set(buildKey(type, userId), JSON.stringify(trackData, replacer), "EX", ONE_HOUR);
}

export async function retrieveTracks(type: TrackListType, userId?: string): Promise<Map<string, any> | undefined> {

    const cachedDataString = await redis.get(buildKey(type, userId));
    if (cachedDataString) return JSON.parse(cachedDataString, reviver);
    return undefined;
}

function buildKey(type: TrackListType, userId?: string) {
    const key = userId ? `${userId}_${type.id}` : type.id;
    return key;
}

function replacer(key: string, value: any) {

    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    }
    return value;
}

function reviver(key: string, value: any) {

    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}
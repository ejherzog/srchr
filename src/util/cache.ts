import { Redis } from "ioredis";
import { TrackListType, ONE_HOUR } from "./types";

const redis: Redis = new Redis();

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
import { Redis } from "ioredis";

const redis: Redis = new Redis();

export async function storeTracks(type: ListType, trackData: Map<string, any>, userId?: string) {

    console.log("attempting to use replacer thing");
    const value = JSON.stringify(trackData, replacer);
    console.log("storing in cache");
    await redis.set(buildKey(type, userId), value);
}

export async function retrieveTracks(type: ListType, userId?: string): Promise<Map<string, any> | undefined> {

    const cachedDataString = await redis.get(buildKey(type, userId));

    if (cachedDataString) {
        console.log("cache hit");
        return JSON.parse(cachedDataString, reviver);
    }
    return undefined;
}

export enum ListType {
    PopularPlaylists = 'popular',
    NewReleases = 'new_releases',
    UserPlaylists = 'playlists',
    UserAlbums = 'albums',
    UserSongs = 'songs'
}

function buildKey(type: ListType, userId?: string) {
    const key = userId ? `${userId}:${type}` : type;
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
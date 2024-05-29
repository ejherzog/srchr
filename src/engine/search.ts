import { getFeaturedPlaylistTracks, getUserPlaylists } from "./spotify";

export async function durationSearch(token: string, comparison: string,
    include: string[], minutes: string, seconds: string) {

    // validate input and translate to search criteria
    const duration = (parseInt(seconds) + (60 * parseInt(minutes))) * 1000;

    // build track list (remove dedupes if possible)
    var allTracks: any[] = await getFeaturedPlaylistTracks(token);

    // search through tracks

    // return list of tracks matching specifications
    return [];
}
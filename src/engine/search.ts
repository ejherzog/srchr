import { getFeaturedPlaylistsTracks, getNewReleaseTracks, getUsersAlbumTracks, getUsersPlaylistTracks, getUsersSavedTracks } from "./tracks";
import { getDisplayDuration } from "./utils";

export async function durationSearch(token: string, comparison: string,
    include: string[], minutes: string, seconds: string) {

    // validate input and translate to search criteria
    // TODO: there needs to be tolerance for milliseconds versus what appears in the UI
    const duration = (parseInt(seconds) + (60 * parseInt(minutes))) * 1000;

    const allTracksMap = await getTracksToInclude(include, token);
    // search through tracks
    var matches: any[] = [];

    allTracksMap.forEach((info, uri, trackMap) => {
        if (fitsDurationCriteria(info.duration_ms, comparison, duration)) {
            matches.push({ uri, name: info.name, artists: info.artists, 
                duration: getDisplayDuration(info.duration_ms) });
        }
    });

    // return list of tracks matching specifications
    return matches.sort((a, b) => a.name.localeCompare(b.name));
}

async function getTracksToInclude(include: string[], token: string): Promise<Map<string, any>> {

    // build track list based on what user wants to include
    var promiseArray: Promise<Map<string, any>>[] = [];
    if (include.includes('featured')) promiseArray.push(getFeaturedPlaylistsTracks(token));
    if (include.includes('playlists')) promiseArray.push(getUsersPlaylistTracks(token));
    if (include.includes('albums')) promiseArray.push(getUsersAlbumTracks(token));
    if (include.includes('tracks')) promiseArray.push(getUsersSavedTracks(token));
    if (include.includes('new')) promiseArray.push(getNewReleaseTracks(token));

    const resolvedArray = await Promise.all(promiseArray);
    var trackMapArray: Map<string, any>[] = [];
    resolvedArray.forEach(result => {
        trackMapArray.push(result);
    });

    // merge all the track maps together
    const allTracksArray = trackMapArray.flatMap(m => [...m]);
    return new Map(allTracksArray);
}

function fitsDurationCriteria(trackDuration: number, comparison: string, desiredDuration: number): boolean {

    switch(comparison) {
        case 'less':
            return trackDuration <= desiredDuration;
        case 'more':
            return trackDuration >= desiredDuration;
        case 'exact':
        default:
            return trackDuration == desiredDuration;
    }
}
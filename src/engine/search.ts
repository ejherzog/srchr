import { getFeaturedPlaylistsTracks, getNewReleaseTracks, getUsersAlbumTracks, getUsersPlaylistTracks, getUsersSavedTracks } from "./tracks";
import { getDisplayDuration } from "./utils";

export async function durationSearch(token: string, comparison: string,
    include: string[], minutes: string, seconds: string) {

    // validate input and translate to search criteria
    const duration = (parseInt(seconds) + (60 * parseInt(minutes))) * 1000;

    const allTracksMap = await getTracksToInclude(include, token);
    // search through tracks
    var matches: any[] = [];

    const display = comparison == 'exact' ? getDisplayDuration(duration) : undefined;
    allTracksMap.forEach((info, uri, trackMap) => {
        if (fitsDurationCriteria(info.duration_ms, comparison, duration, display)) {
            matches.push({ uri, name: info.name, artists: info.artists, 
                duration: getDisplayDuration(info.duration_ms) });
        }
    });

    // return list of tracks matching specifications
    return matches.sort((a, b) => a.name.localeCompare(b.name));
}

export async function titleSearch(token: string, where: string, what: string, include: string) {
    return [];
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

function fitsDurationCriteria(trackDuration: number, comparison: string, 
    desiredDuration: number, desiredDisplay: string | undefined): boolean {

    switch(comparison) {
        case 'less':
            return trackDuration <= desiredDuration;
        case 'more':
            return trackDuration >= desiredDuration;
        case 'exact':
        default:
            // don't use exact milliseconds, use displayed mm:ss instead for "equal" durations
            return getDisplayDuration(trackDuration) == desiredDisplay;
    }
}
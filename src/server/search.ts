import { Session } from "../util/types";
import { getPopularPlaylistsTracks, getNewReleaseTracks, getUsersAlbumTracks, getUsersPlaylistTracks, getUsersSavedTracks } from "./tracks";
import { getDisplayDuration } from "./utils";

export async function durationSearch(session: Session, comparison: string,
    include: string[], minutes: string, seconds: string) {

    // validate input and translate to search criteria
    const duration = (parseInt(seconds) + (60 * parseInt(minutes))) * 1000;

    const allTracksMap = await getTracksToInclude(include, session);
    // search through tracks
    var matches: any[] = [];

    const display = comparison == 'exact' ? getDisplayDuration(duration) : undefined;
    allTracksMap.forEach((info, uri, trackMap) => {
        if (fitsDurationCriteria(info.duration_ms, comparison, duration, display)) {
            matches.push({ uri, name: info.name, artists: info.artists, 
                duration: getDisplayDuration(info.duration_ms), year: info.year });
        }
    });

    // return list of tracks matching specifications
    return matches.sort((a, b) => a.name.localeCompare(b.name));
}

export async function titleSearch(session: Session, where: string, what: string, include: string[]) {

    const searchTerm = what.toLowerCase();
    const allTracksMap = await getTracksToInclude(include, session);

    var matches: any[] = [];

    allTracksMap.forEach((info, uri, trackMap) => {
        if (matchesTitleCriteria(info.name, where, searchTerm)) {
            matches.push({ uri, name: info.name, artists: info.artists,
                duration: getDisplayDuration(info.duration_ms), year: info.year });
        }
    });

    return matches.sort((a, b) => a.name.localeCompare(b.name));
}

export async function yearSearch(session: Session, include: string[], startYear: number, endYear?: number) {

    const allTracksMap = await getTracksToInclude(include, session);
    
    var matches: any[] = [];

    allTracksMap.forEach((info, uri) => {
        if (matchesYearCriteria(info.year, startYear, endYear)) {
            matches.push({ uri, name: info.name, artists: info.artists,
                duration: getDisplayDuration(info.duration_ms), year: info.year });
        }
    });

    return matches.sort((a, b) => a.name.localeCompare(b.name));
}


async function getTracksToInclude(include: string[], session: Session): Promise<Map<string, any>> {

    // build track list based on what user wants to include
    var promiseArray: Promise<Map<string, any>>[] = [];
    if (include.includes('playlists')) promiseArray.push(getUsersPlaylistTracks(session));
    if (include.includes('albums')) promiseArray.push(getUsersAlbumTracks(session));
    if (include.includes('tracks')) promiseArray.push(getUsersSavedTracks(session));

    if (include.includes('popular')) promiseArray.push(getPopularPlaylistsTracks(session.token));
    if (include.includes('new')) promiseArray.push(getNewReleaseTracks(session.token));

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

function matchesTitleCriteria(trackTitle: string, where: string, searchTerm: string): boolean {

    switch(where) {
        case 'starts':
            return trackTitle.toLowerCase().startsWith(searchTerm);
        case 'ends':
            return trackTitle.toLowerCase().endsWith(searchTerm);
        case 'contains':
        default:
            return trackTitle.toLowerCase().includes(searchTerm);
    }
}

function matchesYearCriteria(trackYear: number, startYear: number, endYear?: number) {

    if (endYear) {
        return trackYear <= endYear && trackYear >= startYear;
    }
    return trackYear === startYear;
}
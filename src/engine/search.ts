import { getFeaturedPlaylistsTracks } from "./tracks";

export async function durationSearch(token: string, comparison: string,
    include: string[], minutes: string, seconds: string) {

    // validate input and translate to search criteria
    const duration = (parseInt(seconds) + (60 * parseInt(minutes))) * 1000;

    // build track list (remove dedupes if possible)
    const trackMap: Map<string, any> = await getFeaturedPlaylistsTracks(token);

    // search through tracks
    var matches: any[] = [];

    trackMap.forEach((info, id, trackMap) => {
        if (fitsCriteria(info.duration_ms, comparison, duration)) {
            matches.push({ id, ...info });
        }
    });

    // return list of tracks matching specifications
    return matches.sort((a, b) => a.duration_ms - b.duration_ms);
}

function fitsCriteria(trackDuration: number, comparison: string, desiredDuration: number): boolean {

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
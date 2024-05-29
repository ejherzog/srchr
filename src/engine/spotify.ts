import ky, { Input, Options } from "ky";
import { formatDescription } from "./utils";

// export async function initializePublicSession(): Promise<string> {

//     const tokenParams = new URLSearchParams();
//     tokenParams.append('grant_type', 'client_credentials');
//     tokenParams.append('client_id', process.env.SPOTIFY_CLIENT_ID!);
//     tokenParams.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET!);

//     const tokenResponse: any = await ky.post('https://accounts.spotify.com/api/token', {body: tokenParams}).json();

//     return tokenResponse['access_token'];
// }

// export async function getPopularPlaylists(limit: number, token: string) {

//     const params = new URLSearchParams();
//     params.append('locale', 'en_US');
//     params.append('limit', limit <= 10 ? `${limit}` : '10');
//     params.append('offset', '0');

//     const response = await ky.post('https://api.spotify.com/v1/browse/featured-playlists',
//         { body: params, headers: {
//             'Authorization': `Bearer ${token}`
//         }}
//     ).json();

//     console.log(response);
// }

export async function getUserDisplayName(token: string) {

    const userResponse: any = await ky.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${token}`}
    }).json();

    return userResponse['display_name'];
}

export async function getUserPlaylists(token: string) {

    const responses: any[] = await getAllAuthRequest('https://api.spotify.com/v1/me/playlists', token);

    const rawData: any[] = [];
    responses.forEach(response => {
        rawData.push(...response['items']);
    });

    const playlists: any[] = [];
    rawData.forEach(item => {
        playlists.push({
            name: item.name,
            trackCount: item.tracks.total,
            description: formatDescription(item.description as string)
        })
    });

    return playlists;
}

// export async function getUsersSavedTracks(token: string) {

//     const responses: any[] = await getAllAuthRequest('https://api.spotify.com/v1/me/tracks', token);

//     console.log(responses);

//     return [];
// }

export async function getFeaturedPlaylistTracks(token: string) {

    var allResponses: any[] = [];
    var response: any = {};
    var uri = 'https://api.spotify.com/v1/browse/featured-playlists';

    while (uri) {
        response = await getAuthRequest(uri, token);
        allResponses.push(response);
        uri = response.playlists.next;
    }

    console.log(allResponses);

    const rawData: any[] = [];
    allResponses.forEach(response => {
        rawData.push(...response['playlists']['items']['tracks']);
    });

    console.log(rawData);

    const trackHrefs: string[] = [];
    rawData.forEach(track => {
        if (track.href) trackHrefs.push(track.href);
    });

    console.log(trackHrefs);

    return [];
}

async function getAuthRequest(uri: Input, token: string) {
    return await getRequest(uri, { headers: { 'Authorization': `Bearer ${token}`}});
}

async function getRequest(uri: Input, options?: Options | undefined) {
    return await ky.get(uri, options).json();
}

async function getAllAuthRequest(uri: Input, token: string) {

    var allResponses: any[] = [];
    var response: any = {};

    do {
        response = await getAuthRequest(uri, token);
        allResponses.push(response);
        uri = response.next;
    } while (uri);

    return allResponses;
}
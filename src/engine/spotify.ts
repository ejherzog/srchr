import ky, { Input, Options } from "ky";
import { formatDescription } from "./utils";
import { User } from "../middleware/session";

// import { retrieveUserInfo, cacheUserInfo } from "../cache/redis";

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

// }

export async function getUserDisplayName(token: string): Promise<string> {
    const userInfo = await getUserInfo(token);
    return userInfo.displayName;
}

export async function getUserInfo(token: string): Promise<User> {

    console.log(token);
    const userResponse: any = await ky.get('https://api.spotify.com/v1/me', 
        { headers: { 'Authorization': `Bearer ${token}`} }).json();
    
    console.log(userResponse);
    return new User(userResponse['display_name'], userResponse['id']);
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
        });
    });

    return playlists;
}

export async function getFeaturedPlaylistTracks(token: string) {

    var allResponses: any[] = [];
    var response: any = {};
    var uri = 'https://api.spotify.com/v1/browse/featured-playlists';

    while (uri) {
        response = await getAuthRequest(uri, token);
        allResponses.push(response);
        uri = response.playlists.next;
    }

    const playlists: any[] = [];
    allResponses.forEach(response => {
        playlists.push(...response['playlists']['items']);
    });

    const trackHrefs: string[] = [];
    playlists.forEach(track => {
        if (track.href) trackHrefs.push(track.href);
    });

    return [];
}

export async function postAuthRequest(uri: Input, body: any, token: string) {
    try {
        return await postRequest(uri, { 
            json: body,
            headers: { 'Authorization': `Bearer ${token}`}
        });
    } catch (error: any) {
        console.log(error.response.body);
    }
}

export async function getAuthRequest(uri: Input, token: string) {
    return await getRequest(uri, { headers: { 'Authorization': `Bearer ${token}`}});
}

async function getRequest(uri: Input, options?: Options | undefined) {
    return await ky.get(uri, options).json();
}

async function postRequest(uri: Input, options?: Options | undefined) {
    return await ky.post(uri, options).json();
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
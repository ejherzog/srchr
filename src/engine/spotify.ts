import ky, { Input, Options } from "ky";
import { formatDescription } from "./utils";
import { User } from "../middleware/session";

export async function getUserInfo(token: string): Promise<User> {

    const userResponse: any = await ky.get('https://api.spotify.com/v1/me', 
        { headers: { 'Authorization': `Bearer ${token}`} }).json();
    
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
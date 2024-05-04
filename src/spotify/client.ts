import ky from "ky";

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

    const playlistResponse: any = await ky.get('https://api.spotify.com/v1/me/playlists', {
        headers: { 'Authorization': `Bearer ${token}`}
    }).json();

    const rawData: any[] = playlistResponse['items'];
    const playlists: any[] = [];

    rawData.forEach(item => {
        playlists.push({
            name: item.name,
            trackCount: item.tracks.total,
            description: item.description
        })
    });

    return playlists;
}
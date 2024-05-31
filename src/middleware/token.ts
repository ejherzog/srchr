import { Request, Response } from "express";
import querystring from "node:querystring";
import { v4 as uuidv4, validate } from "uuid";
import ky from "ky";

const ONE_HOUR = 3600000;

export function getTokenCookie(req: Request) {
    return req.cookies['user-token'];
}

// export function checkUserToken(req: Request, res: Response, next: NextFunction) {

//     console.log(req.cookies);
//     var userToken: string;
//     var cookie = req.cookies['user-token'];
//     if (cookie) {
//         userToken = cookie;
//         console.log(req.cookies);
//         console.log(userToken);
//         res.cookie('user-token', userToken, { expires: new Date(Date.now() + 3600), httpOnly: true, sameSite: 'strict' });
//     }
//     next();
// }

export function userLogin(req: Request, res: Response) {

    if (req.cookies['user-token'] === undefined) {
        var state = uuidv4();
        var scope = 'user-read-private user-read-email playlist-read-private user-library-read playlist-modify-private playlist-modify-public';
    
        res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: process.env.SPOTIFY_CLIENT_ID,
            scope: scope,
            redirect_uri: `http://localhost:${process.env.PORT}/auth`,
            state: state
        }));
    } else {
        console.log("Already logged in");
        res.redirect('/logged_in');
    }
}

export async function authenticate(req: Request, res: Response) {

    const state = req.query.state as string;
    if (validate(state)) {
        const code = req.query.code as string;
        const accessToken = await getAccessToken(code);
        setCookie(res, accessToken.token, accessToken.expires_in);
        res.redirect('/playlists');
    } else {
        res.redirect('/about');
    }
}

async function getAccessToken(code: string) {

    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', `http://localhost:${process.env.PORT}/auth`);

    const tokenResponse: any = await ky.post('https://accounts.spotify.com/api/token', 
        {
            body: tokenParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID! + ':' + process.env.SPOTIFY_CLIENT_SECRET!).toString('base64'))
            }
        }).json();

    return {
        token: tokenResponse['access_token'],
        expires_in: parseInt(tokenResponse['expires_in']) * 1000
    };
}

function setCookie(res: Response, token: string, expires_in?: number) {
    const timeToAdd = expires_in || ONE_HOUR;
    res.cookie('user-token', token, { expires: new Date(Date.now() + timeToAdd), httpOnly: true, sameSite: 'lax' });
}
import { Request, Response } from "express";
import { Redis } from "ioredis";
import querystring from "node:querystring";
import { v4 as uuidv4, validate } from "uuid";
import ky from "ky";
import { getUserInfo } from "../server/spotify";
import { SessionInfo, Session, Token, User } from "./types";

const redis: Redis = new Redis();

export async function getSessionInfo(req: Request, res: Response): Promise<SessionInfo> {
    if (req.cookies['session-id']) {
        const cachedSession = await redis.get(req.cookies['session-id']);
        if (cachedSession) {
            return new SessionInfo(JSON.parse(cachedSession));
        } else {
            // there is a session ID cookie, but no cached session data
            res.clearCookie(req.cookies['session-id']);
        }
    }
    // there is no session ID cookie set
    return new SessionInfo();
}

export async function userLogin(req: Request, res: Response) {

    const sessionInfo = await getSessionInfo(req, res);

    if (!sessionInfo.isLoggedIn) {
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
        res.redirect('/library');
    }
}

export async function userLogout(req: Request, res: Response) {
    res.clearCookie(req.cookies['session-id']);
    await redis.del(req.cookies['session-id']);
}

export async function authenticate(req: Request, res: Response) {

    const state = req.query.state as string;
    if (validate(state)) {
        const code = req.query.code as string;
        const accessToken = await getAccessToken(code);

        await createSession(res, accessToken);
        res.redirect('/library');
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

    return new Token(tokenResponse['access_token'], parseInt(tokenResponse['expires_in']));
}

async function createSession(res: Response, token: Token) {

    const sessionId = crypto.randomUUID();
    res.cookie('session-id', sessionId, { 
        expires: new Date(Date.now() + (token.expiresIn * 1000)), 
        httpOnly: true, 
        sameSite: 'lax'
    });

    const user: User = await getUserInfo(token.token);
    
    const session = new Session(sessionId, token, user);
    await redis.set(sessionId, JSON.stringify(session), "EX", token.expiresIn);
}
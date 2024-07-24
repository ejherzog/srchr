import { Request, Response } from "express";
import { Redis } from "ioredis";
import querystring from "node:querystring";
import { v4 as uuidv4, validate } from "uuid";
import ky from "ky";
import { getUserInfo } from "../engine/spotify";

const redis: Redis = new Redis();

export async function getSessionInfo(req: Request, res: Response): Promise<SessionInfo> {
    if (req.cookies['session-id']) {
        const cachedSession = await redis.get(req.cookies['session-id']);
        console.log("WHY IS THERE NO CACHED DATA?");
        console.log(cachedSession);
        if (cachedSession) {
            return new SessionInfo(JSON.parse(cachedSession));
        } else {
            // there is a session ID cookie, but no cached session data
            console.log("delete cookie?");
            console.log(req.cookies['session-id']);
            res.clearCookie(req.cookies['session-id']);
            return new SessionInfo();
        }
    }
    // there is no session ID cookie set
    return new SessionInfo();
}

export async function userLogin(req: Request, res: Response) {

    const sessionInfo = await getSessionInfo(req, res);

    if (!sessionInfo.isLoggedIn) {
        console.log("confirmed not logged in");
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
        res.redirect('/playlists');
    }
}

export async function userLogout(req: Request, res: Response) {
    res.clearCookie(req.cookies['session-id']);
    await redis.del(req.cookies['session-id']);
}

export async function authenticate(req: Request, res: Response) {

    console.log("got auth redirect");
    const state = req.query.state as string;
    if (validate(state)) {
        const code = req.query.code as string;
        const accessToken = await getAccessToken(code);

        await createSession(res, accessToken);
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

    return new Token(tokenResponse['access_token'], parseInt(tokenResponse['expires_in']));
}

async function createSession(res: Response, token: Token) {

    const sessionId = crypto.randomUUID();
    res.cookie('session-id', sessionId, { 
        expires: new Date(Date.now() + (token.expiresIn * 1000)), 
        httpOnly: true, 
        sameSite: 'lax'
    });

    console.log("new session ID");
    console.log(sessionId);
    const user = await getUserInfo(token.token);
    console.log(user);
    const session = new Session(sessionId, token, user);
    console.log(session);

    await redis.set(sessionId, JSON.stringify(session), "EX", token.expiresIn);

    console.log("cached");
    console.log(await redis.get(sessionId));
}

const ONE_HOUR = 3600000;

export class Token {
    token: string;
    expiresIn: number;

    constructor(token: string, expires_in?: number) {
        this.token = token;
        this.expiresIn = expires_in ?? ONE_HOUR;
    }
}

export class User {
    displayName: string;
    userId: string;

    constructor(displayName: string, userId: string) {
        this.displayName = displayName;
        this.userId = userId;
    }
}

export class Session {
    sessionId: string;
    token: string;
    tokenExpiry: number;
    displayName: string;
    userId: string;

    constructor(sessionId: string, accessToken: Token, user: User) {
        this.sessionId = sessionId;
        this.token = accessToken.token;
        this.tokenExpiry = accessToken.expiresIn;
        this.displayName = user.displayName;
        this.userId = user.userId;
    }
}

export class SessionInfo {
    isLoggedIn: boolean = false;
    session?: Session;

    constructor(session?: Session) {
        if (session) {
            this.isLoggedIn = true;
            this.session = session;
        }
    }
}
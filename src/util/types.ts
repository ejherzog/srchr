export const ONE_HOUR = 3600000;

export class TrackListType {
    id: string;
    displayText: string;
    personal: boolean;

    constructor(id: string, displayText: string, personal?: boolean) {
        this.id = id;
        this.displayText = displayText;
        this.personal = personal ?? false;
    }
}

export const Sources = {
    playlists: new TrackListType('playlists', 'My Playlists', true),
    albums: new TrackListType('albums', 'My Saved Albums', true),
    tracks: new TrackListType('tracks', 'My Saved Tracks (Liked Songs)', true),
    popular: new TrackListType('popular', 'Popular Playlists'),
    new: new TrackListType('new', 'New Releases'),
} as const;

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

    get displayData() {
        return { 
            isLoggedIn: this.isLoggedIn, 
            displayName: this.session?.displayName 
        };
    }
}
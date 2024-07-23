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
    token: Token;
    user?: User;

    constructor(sessionId: string, token: Token, user?: User) {
        this.sessionId = sessionId;
        this.token = token;
        this.user = user;
    }
}
export interface IUser {
    googleId?: string;
    twitterId?: string;
    githubId?: string;
    username: string;
}

export interface IMongoDBUser {
    googleId?: string;
    twitterId?: string;
    githubId?: string;
    username: string;
    _v: number;
    _id: string;
}
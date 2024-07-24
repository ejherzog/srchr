import express, { Express, Request, Response } from "express";
import cors from "cors";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser";
import { authenticate, getSessionInfo, Session, userLogin, userLogout } from "./middleware/session";
import { getUserPlaylists } from "./engine/spotify";
import { sortByTitle } from "./engine/utils";
import { durationSearch, titleSearch } from "./engine/search";
import { createNewPlaylist } from "./engine/playlists";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.get('/', async (req: Request, res: Response) => {
    const sessionInfo = await getSessionInfo(req, res);
    console.log(sessionInfo);
    res.render('index', sessionInfo);
});

app.get('/login', async (req: Request, res: Response) => {
    console.log("trying to log in");
    await userLogin(req, res);
});

app.get('/logout', (req: Request, res: Response) => {
    console.log("logging out");
    userLogout(req, res);
    res.redirect('/');
});

app.get('/auth', async (req: Request, res: Response) => {
    await authenticate(req, res);
});

app.get('/playlists', async (req: Request, res: Response) => {
    const sessionInfo = await getSessionInfo(req, res);
    console.log(sessionInfo);
    if (!sessionInfo.isLoggedIn) res.redirect('/');

    const playlistData = await getUserPlaylists(sessionInfo.session!.token);
    res.render('playlists', {
        ...sessionInfo,
        playlists: sortByTitle(playlistData)
    });
});

app.get('/search', async (req: Request, res: Response) => {
    const sessionInfo = await getSessionInfo(req, res);
    if (!sessionInfo.isLoggedIn) res.redirect('/');

    res.render('search', sessionInfo);
});

app.post('/title', async (req: Request, res: Response) => {
    const sessionInfo = await getSessionInfo(req, res);
    if (!sessionInfo.isLoggedIn) res.redirect('/');
        
    const tracks = await titleSearch(sessionInfo.session!.token, 
        req.body.where, req.body.what, req.body.include);
    res.render('results', {
        ...sessionInfo,
        tracks: tracks
    });
});

app.post('/duration', async (req: Request, res: Response) => {
    const sessionInfo = await getSessionInfo(req, res);
    if (!sessionInfo.isLoggedIn) res.redirect('/');
        
    const tracks = await durationSearch(sessionInfo.session!.token, 
        req.body.comparison, req.body.include, req.body.min, req.body.sec);
    res.render('results', {
        ...sessionInfo,
        tracks: tracks
    });
});

app.post('/create', async (req: Request, res: Response) => {
    const sessionInfo = await getSessionInfo(req, res);
    if (!sessionInfo.isLoggedIn) res.redirect('/');

    const playlistUrl = await createNewPlaylist(req.body, 
        sessionInfo.session!.userId, sessionInfo.session!.token);
    res.render('success', {
        ...sessionInfo,
        playlistName: req.body.playlistName, 
        playlistUrl
    });
});

app.use(express.static(__dirname + '/public'));

app.listen(process.env.PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${process.env.PORT}`);
});
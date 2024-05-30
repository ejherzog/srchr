import express, { Express, Request, Response } from "express";
import cors from "cors";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser";
import { authenticate, getTokenCookie, userLogin } from "./middleware/token";
import { getUserDisplayName, getUserPlaylists } from "./engine/spotify";
import { sortByTitle } from "./engine/utils";
import { durationSearch } from "./engine/search";
import { getUsersPlaylistTracks } from "./engine/tracks";

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
    res.render('index', {
        name: await nameIfLoggedIn(req)
    });
});

app.get('/login', (req: Request, res: Response) => {
    userLogin(req, res);
});

app.get('/auth', async (req: Request, res: Response) => {
    await authenticate(req, res);
});

// app.get('/logged_in', async (req: Request, res: Response) => {
//     const token = getTokenCookie(req);
//     const displayName = await getUserDisplayName(token);
//     const playlistData = await getUserPlaylists(token);
//     console.log(playlistData);
//     res.render('logged_in', {
//         name: displayName
//     });
// });

app.get('/playlists', async (req: Request, res: Response) => {
    const token = getTokenCookie(req);
    const displayName = await getUserDisplayName(token);
    const playlistData = await getUserPlaylists(token);
    res.render('playlists', {
        name: displayName,
        playlists: sortByTitle(playlistData)
    });
});

app.get('/search', async (req: Request, res: Response) => {
    const token = getTokenCookie(req);
    const displayName = await getUserDisplayName(token);
    res.render('search', {
        name: displayName
    });
});

app.get('/about', async (req: Request, res: Response) => {
    res.render('about', {
        name: await nameIfLoggedIn(req)
    });
});

app.post('/title', async (req: Request, res: Response) => {
    const token = getTokenCookie(req);
    const displayName = await getUserDisplayName(token);
    res.redirect('/results');
    res.render('results', {
        name: displayName
    });
});

app.post('/duration', async (req: Request, res: Response) => {
    const token = getTokenCookie(req);
    const displayName = await getUserDisplayName(token);
    const tracks = await durationSearch(token, req.body.comparison,
        req.body.include, req.body.min, req.body.sec
    );
    res.render('results', {
        name: displayName,
        tracks: tracks
    });
});

app.use(express.static(__dirname + '/public'));

app.listen(process.env.PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${process.env.PORT}`);
});

async function nameIfLoggedIn(req: Request) {

    var token = req.cookies['user-token'];
    if (token) {
        return await getUserDisplayName(token);
    } else {
        return undefined;
    }
}
import express, { Express, Request, Response } from "express";
import cors from "cors";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser";
import { authenticate, getTokenCookie, userLogin } from "./middleware/token";
import { getUserInfo, getUserPlaylists } from "./engine/spotify";
import { sortByTitle } from "./engine/utils";
import { durationSearch } from "./engine/search";
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
    const user = await nameIfLoggedIn(req);
    res.render('index', {
        name: user?.displayName
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
//     const user = await getUserInfo(token);
//     const playlistData = await getUserPlaylists(token);
//     console.log(playlistData);
//     res.render('logged_in', {
//         name: displayName
//     });
// });

app.get('/playlists', async (req: Request, res: Response) => {
    const token = getTokenCookie(req);
    const user = await getUserInfo(token);
    const playlistData = await getUserPlaylists(token);
    res.render('playlists', {
        name: user.displayName,
        playlists: sortByTitle(playlistData)
    });
});

app.get('/search', async (req: Request, res: Response) => {
    const token = getTokenCookie(req);
    const user = await getUserInfo(token);
    res.render('search', {
        name: user.displayName
    });
});

app.get('/about', async (req: Request, res: Response) => {
    res.render('about', {
        name: await nameIfLoggedIn(req)
    });
});

app.post('/title', async (req: Request, res: Response) => {
    const token = getTokenCookie(req);
    const user = await getUserInfo(token);
    res.redirect('/results');
    res.render('results', {
        name: user.displayName
    });
});

app.post('/duration', async (req: Request, res: Response) => {
    const token = getTokenCookie(req);
    const user = await getUserInfo(token);
    const tracks = await durationSearch(token, req.body.comparison,
        req.body.include, req.body.min, req.body.sec
    );
    res.render('results', {
        name: user.displayName,
        tracks: tracks
    });
});

app.post('/create', async (req: Request, res: Response) => {
    const token = getTokenCookie(req);
    const user = await getUserInfo(token);
    const playlistUrl = await createNewPlaylist(req.body, user.userId, token);
    res.render('success', {
        name: user.displayName,
        playlistName: req.body.playlistName, 
        playlistUrl
    });
});

app.use(express.static(__dirname + '/public'));

app.listen(process.env.PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${process.env.PORT}`);
});

async function nameIfLoggedIn(req: Request) {

    var token = req.cookies['user-token'];
    if (token) {
        return await getUserInfo(token);
    } else {
        return undefined;
    }
}
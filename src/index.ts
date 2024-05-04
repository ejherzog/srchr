import express, { Express, Request, Response } from "express";
import cors from "cors";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser";
import { authenticate, getTokenCookie, userLogin } from "./middleware/token";
import { getUserDisplayName } from "./spotify/client";

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
    res.render('index');
});

app.get('/login', (req: Request, res: Response) => {
    userLogin(req, res);
});

app.get('/auth', async (req: Request, res: Response) => {
    await authenticate(req, res);
});

app.get('/logged_in', async (req: Request, res: Response) => {
    const displayName = await getUserDisplayName(getTokenCookie(req));
    res.render('logged_in', {
        name: displayName
    });
});

app.get('/about', (req: Request, res: Response) => {
    res.render('about');
});

app.use(express.static(__dirname + '/public'));

app.listen(process.env.PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${process.env.PORT}`);
});
# 🎵 SONG SEARCHER 🔍

This web app is a tool for building themed playlists in Spotify.

Once users authorize Song Searcher to access their Spotify data, they can search through their song library by title or duration. (Searching by other criteria is on the roadmap!)
Users can then create a new playlist with any or all of the songs in the search results. (Another roadmap item is adding songs to an existing playlist.)

Use Case:
Suppose a user wants to create a playlist of songs that are no more than 2 minutes long. Spotify offers no way to search by duration. Manually going through your own library of playlists, albums, and liked songs takes _a lot_ of time. (Yes, I tried it maunally...)

Song Searcher sifts through a user's library (as well as popular Spotify playlists and new releases, if desired) to find songs by duration for you. Without any cached data, searching for playlists under 2 minutes in length takes 1-2 minutes. With cached song library data, the process takes mere seconds.

---
Built with:
- TypeScript
- ExpressJS
- EmbeddedJS (ejs)
- NodeJS
- Redis

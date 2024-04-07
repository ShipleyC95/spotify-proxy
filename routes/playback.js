import axios from "axios";

export default class Playback {
  constructor(auth) {
    this.auth = auth;
    this.playBackClient = axios.create({
      baseURL: "https://api.spotify.com/v1/",
      headers: {
        "Content-Type": "application/json"
      }
    });

    this.playBackClient.interceptors.request.use(async (config) => {
      if (this.auth.TokenExpired()) {
        await this.auth.RefreshToken({ send: () => { } })
      }
      config.headers.Authorization = `Bearer ${this.auth.GetToken()}`
      return config;
    });
  }

  async PlayAlbum(req, res) {
    const { name, title } = req.params;
    try {
      const query = new URLSearchParams({
        q: `artist:${name} album:${title}`,
        type: "album"
      }).toString();

      const { data } = await this.playBackClient.get("search?" + query);
      const allAlbumResults = await this.playBackClient.get("albums?ids=" + data.albums.items.map(x => x.id).join(","));

      const sortedAlbums = allAlbumResults.data.albums.sort((a, b) => {
        new Date(a.release_date) - new Date(b.release_date); //Oldest first
      });

      const albumUri = sortedAlbums.find(album =>
        album.tracks.items.some(track => track.explicit))?.uri //Favour explicit album versions
        ?? sortedAlbums[0].uri; //If none of the albums have explicit tracks, use the first one.

      await this.playBackClient.put("me/player/play", {
        context_uri: albumUri
      });

      res.set("Content-Type", "text/html")
      res.send(`<h1>Playing "${sortedAlbums[0].name}" (${new Date(sortedAlbums[0].release_date).getFullYear()}) by ${sortedAlbums[0].artists.map(art => art.name)}</h1>
        <img src="${sortedAlbums[0].images[0].url}">
      `)
    } catch (error) {
      console.error(error)
      res.status(500).send(error);
    }
  }

  async GetDevices(res) {
    try {
      const { data } = await this.playBackClient.get("me/player/devices");
      res.send(data.devices);
    } catch (error) {
      console.error(error);
      res.status(500).send("An error occurred")
    }
  }
}
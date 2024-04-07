import express from "express";
import Auth from "./routes/auth.js";
import { config } from "dotenv"
import Playback from "./routes/playback.js";

const app = express();

const api = () => {
  config();
  
  const PORT = process.env.PORT;

  const auth = new Auth();
  const playback = new Playback(auth);

  app.get('/login', (_, res) => auth.Login(res));

  app.get('/callback', async (req, res) => auth.Callback(req, res));

  app.get("/refresh_token", async (_, res) => auth.RefreshToken(res));

  app.get("/status", (_, res) => auth.CheckStatus(res))

  app.get("/artist/:name/album/:title", async (req, res) => playback.PlayAlbum(req, res));

  app.get("/devices", async (_, res) => playback.GetDevices(res))

  app.listen()

  app.listen(PORT, () => {
    console.log(`Starting Spotify Proxy on ${PORT}`);
  })
}

export default api();
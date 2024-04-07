import axios from "axios";
import { GenerateRandomString } from "../utils/index.js";
import queryString from "query-string";

class Auth {
  constructor() {
    this.client_id = process.env.CLIENT_ID;
    this.client_secret = process.env.CLIENT_SECRET;
    this.redirect_uri = `http://localhost:${process.env.PORT}/callback`;

    this.spotifyClient = axios.create({
      baseURL: "https://accounts.spotify.com/api/",
      headers: {
        'Authorization': 'Basic ' + (Buffer.from(this.client_id + ':' + this.client_secret).toString('base64')),
        'Content-Type': "application/x-www-form-urlencoded"
      }
    });
  }

  Login(res) {
    const state = GenerateRandomString(16);
    const scope = process.env.SCOPES;

    res.redirect('https://accounts.spotify.com/authorize?' + new URLSearchParams({
      response_type: 'code',
      client_id: this.client_id,
      scope,
      redirect_uri: this.redirect_uri,
      state
    }).toString());
  }

  async Callback(req, res) {
    const { code, state } = req.query;
    if (!state) {
      res.redirect('/#' +
        new URLSearchParams({
          error: 'state_mismatch'
        }).toString()
      );
    }

    const body = {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: this.redirect_uri
    }

    try {
      const { data } = await this.spotifyClient.post("token", queryString.stringify(body));

      this.access_token = data.access_token;
      this.refresh_token = data.refresh_token;
      this.expires_in = data.expires_in
      this.tokenTime = new Date();

      res.send();
    } catch (error) {
      console.log(error);
      res.status(500).send(error)
    }
  }

  async RefreshToken(res) {
    const body = {
      grant_type: "refresh_token",
      refresh_token: this.refresh_token
    }

    const { data, status } = this.spotifyClient.post("token", queryString.stringify(body))

    if (status === 200) {
      this.access_token = data.access_token;
      this.tokenTime = new Date();
    }

    res.send();
  }

  TokenExpired() {
    return (Math.abs(new Date() - this.tokenTime) / 1000 > 3600)
  }

  CheckStatus(res) {
    res.send({
      has_token: !!this.access_token,
      token_expired: this.TokenExpired(),
      token_time: this.tokenTime,
      expiry: this.expires_in
    })
  }

  GetToken() {
    return this.access_token;
  }
}

export default Auth;
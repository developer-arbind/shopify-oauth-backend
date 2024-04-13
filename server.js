import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import OauthShopify from "./src/oauth.js";
const app = express();

const serv = http.createServer(app);

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());


const shopifyToken = new OauthShopify({
    sharedSecret: process.env.SHAREDKEY,
    redirectUri: 'http://localhost:5173/',
    apiKey: process.env.APIKEY
  });

  app.get("/connect/:hostname",async (req, res) => {
    console.log("hostname: ", req.params.hostname);
    const url = shopifyToken.generateAuthUrl(req.params.hostname);
    res.send(url);
}); 

app.post("/exchange-access-token", async (req, res) => {
    const {hmac, state, code, shop, timestamp} = req.body;
     const hostname = shop;
      
      shopifyToken
        .getAccessToken(hostname, code)
        .then((data) => {
            console.log(data);

            return res.status(200).json({
               message: "200 success",
                 data
            })
        })
            .catch((err) => res.status(401).json({
                error: "unauth"
            }));    
      
});



serv.listen(8001, () => {
    console.log("server running on 8001")
})
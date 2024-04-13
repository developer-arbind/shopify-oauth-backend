// const crypto = require('crypto');
// const https = require('https');
// const url = require('url');
import crypto from "crypto"; 
import https from "https";
import url from "url";

class OauthShopify {
  constructor(options) {
    if (!options || !options.sharedSecret || !options.redirectUri || !options.apiKey) {
      throw new Error('invalid options or you missed something');
    }

    this.accessMode = 'accessMode' in options ? options.accessMode : '';
    this.scopes = 'scopes' in options ? options.scopes : 'read_content';
    this.timeout = 'timeout' in options ? options.timeout : 60000;
    this.sharedSecret = options.sharedSecret;
    this.redirectUri = options.redirectUri;
    this.apiKey = options.apiKey;
    this.agent = options.agent;
  }

  generateNonce() {
    return crypto.randomBytes(16).toString('hex');
  }

  generateAuthUrl(shop, scopes, nonce, accessMode) {
    scopes = scopes || this.scopes;
    accessMode = accessMode || this.accessMode;

    const query = {
      scope: Array.isArray(scopes) ? scopes.join(',') : scopes,
      state: nonce || this.generateNonce(),
      redirect_uri: this.redirectUri,
      client_id: this.apiKey
    };

    if (accessMode) {
      query['grant_options[]'] = accessMode;
    }

    return url.format({
      pathname: '/admin/oauth/authorize',
      hostname: shop.endsWith('.myshopify.com') ? shop : `${shop}.myshopify.com`,
      protocol: 'https:',
      query
    });
  }


  getAccessToken(shop, code) {
    const self = this;
    return new Promise(function (resolve, reject) {
      const data = JSON.stringify({
        client_secret: self.sharedSecret,
        client_id: self.apiKey,
        code
      });

      const request = https.request({
        headers: {
          'Content-Length': Buffer.byteLength(data),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        path: '/admin/oauth/access_token',
        hostname: shop,
        method: 'POST',
        agent: self.agent
      });

      let timer = setTimeout(function () {
        request.abort();
        timer = null;
        reject(new Error('Request timed out'));
      }, self.timeout);

      request.on('response', function (response) {
        const status = response.statusCode;
        let body = '';

        response.setEncoding('utf8');
        response.on('data', function (chunk) {
          body += chunk;
        });
        response.on('end', function () {
          let error;

          if (!timer) return;

          clearTimeout(timer);

          if (status !== 200) {
            error = new Error('Failed to get Shopify access token');
            error.responseBody = body;
            error.statusCode = status;
            return reject(error);
          }

          try {
            body = JSON.parse(body);
          } catch (e) {
            error = new Error('Failed to parse the response body');
            error.responseBody = body;
            error.statusCode = status;
            return reject(error);
          }

          resolve(body);
        });
      });

      request.on('error', function (err) {
        if (!timer) return;

        clearTimeout(timer);
        reject(err);
      });

      request.end(data);
    });
  }
}


export default OauthShopify;
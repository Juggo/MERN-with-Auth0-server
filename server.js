const express = require('express');
const app = express();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const cors = require('cors');
const morgan = require('morgan');


const mongoose = require('mongoose');
const Messages = require('./model/messages');
const Provider = require('./model/providers');


require('dotenv').config();

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
  throw 'Make sure you have AUTH0_DOMAIN, and AUTH0_AUDIENCE in your Heroku app or .env file'
}

var port = process.env.PORT || 3001;

//db config - FIX ON DEPLOYMENT!!!! - to process.env.MONGODB_URI
mongoose.connect('mongodb://heroku_03604v9b:o7btoqu9qp8ljpcmqu946rk61g@ds139342.mlab.com:39342/heroku_03604v9b');

app.use(cors());
app.use(morgan('API Request (port 3001): :method :url :status :response-time ms - :res[content-length]'));

const checkJwt = jwt({
  // Dynamically provide a signing key based on the kid in the header and the singing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

const checkScopes = jwtAuthz([ 'read:messages' ]);

app.get('/api/providers', function(req, res) {
    Provider.find(function(err, providers) {
        if (err)
                res.send(err);
                //responds with a json object of our database comments.
                res.json(providers)
        });
    
//  res.json({ message: "Hello from a public endpoint! You don't need to be authenticated to see this." });
})
.post(function(req, res) {
    var provider = new Provider();
    //body parser lets us use the req.body
    provider.name = req.body.name;
    provider.email = req.body.email;
    provider.save(function(err) {
        if (err)
            res.send(err);
        res.json({ message: 'Provider successfully added!' });
    });
});

app.listen(port);
console.log('Server listening on http://localhost:3001. The React app will be built and served at http://localhost:3000.');

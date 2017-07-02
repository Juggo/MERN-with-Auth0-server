const express = require('express');
const app = express();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const cors = require('cors');
const morgan = require('morgan');

const bodyParser = require('body-parser');
const router = express.Router();
const mongoose = require('mongoose');
const Provider = require('./model/providers');


require('dotenv').config();

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
  throw 'Make sure you have AUTH0_DOMAIN, and AUTH0_AUDIENCE in your Heroku app or .env file'
}

var port = process.env.PORT || 3001;

//db config - FIX ON DEPLOYMENT!!!! - to process.env.MONGODB_URI
mongoose.connect(process.env.MONGODB_URI);

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


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//To prevent errors from Cross Origin Resource Sharing, we will set 
//our headers to allow CORS with middleware like so:
app.use(function(req, res, next) {
 res.setHeader('Access-Control-Allow-Origin', '*');
 res.setHeader('Access-Control-Allow-Credentials', 'true');
 res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
 res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');

//and remove cacheing so we get the most recent comments
 res.setHeader('Cache-Control', 'no-cache');
 next();
});

router.get('/', function(req, res) {
 res.json({ message: 'API Initialized!'});
});

// USE AGAINST NOSQL INJECTION
//
//escape() converts the string into ascii code. $ne is converted into %24ne.
//
//var privateKey = escape(req.params.privateKey);
//
//App.findOne({ privateKey: privateKey }, function (err, app) {
//  //do something here
//}

//adding the /comments route to our /api router
router.route('/providers')
.get(checkJwt, checkScopes, function(req, res) {
    Provider.find(function(err, providers) {
        if (err)
                res.send(err);
                //responds with a json object of our database comments.
                res.json(providers)
        });
    
//  res.json({ message: "Hello from a public endpoint! You don't need to be authenticated to see this." });
}).post(checkJwt, checkScopes, function(req, res) {
    var provider = new Provider();
    //body parser lets us use the req.body
    provider.name = req.body.name;
    provider.img = req.body.img;
    provider.description = req.body.description;
    provider.info = req.body.info;
    provider.website = req.body.website;
    provider.address = req.body.address;
    provider.save(function(err) {
        if (err)
            res.send(err);
        res.json({ message: 'Provider successfully added!' });
    });
});

//Adding a route to a specific provider based on the database ID
router.route('/providers/:provider_id')
    //The put method gives us provider based on 
    //the ID passed to the route
.get(checkJwt, checkScopes, function(req, res) {
    Provider.findById(escape(req.params.provider_id), function(err, provider) {
        if (err)
            res.send(err);
        
        //responds with a json object of our database provider.
        res.json(provider)
    });
});

app.use('/api', router);

app.listen(port);
console.log('Server listening on http://localhost:3001. The React app will be built and served at http://localhost:3000.');

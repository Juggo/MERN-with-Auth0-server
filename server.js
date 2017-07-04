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
const Review = require('./model/reviews');


//var request = require("request");
//var manToken = '';
//var options = { method: 'POST',
//  url: 
//  headers: { 'content-type': 'application/json' },
//  body: 
//   { grant_type: 'client_credentials',
//     client_id: 
//     client_secret: 
//     audience: 
//  json: true };
//
//request(options, function (error, response, body) {
//  if (error) throw new Error(error);
//  
//  manToken = response;
//  console.log(body);
//});
//
//var ManagementClient = require('auth0').ManagementClient;
//var management = new ManagementClient({
//  token: response.accessToken,
//  domain: process.env.AUTH0_DOMAIN
//});
//
//var AuthenticationClient = require('auth0').AuthenticationClient;
//
//var auth0 = new AuthenticationClient({
//  domain: process.env.AUTH0_DOMAIN,
//  clientId: 
//  clientSecret: 
//});
//
//auth0.clientCredentialsGrant({
//  audience: 'https://' + process.env.AUTH0_DOMAIN + '/api/v2/',
//  scope: 'read:users'
//}, function (err, response) {
//  if (err) {
//    // Handle error.
//  }
//  console.log(response.access_token);
//});
//
//auth0.getUsers(function (err, users) {
//  if (err) {
//    // handle error.
//  }
//  console.log(users);
//  res.json({users});
//});


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
                res.json(providers);
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
router.route('/provider/:provider_id')
    //The put method gives us provider based on 
    //the ID passed to the route
.get(checkJwt, checkScopes, function(req, res) {
    Provider.findById(escape(req.params.provider_id), function(err, provider) {
        if (err)
            res.send(err);
        
        //responds with a json object of our database provider.
        res.json(provider);
    });
}).put(checkJwt, checkScopes, function(req, res) {
    Provider.findById(escape(req.params.provider_id), function(err, provider) {
        if (err)
            res.send(err);

        //If nothing was changed we will not alter the field.
        (req.body.name) ? provider.name = req.body.name : null;
        (req.body.img) ? provider.img = req.body.img : null;
        (req.body.description) ? provider.description = req.body.description : null;
        (req.body.info) ? provider.info = req.body.info : null;
        (req.body.website) ? provider.website = req.body.website : null;
        (req.body.address) ? provider.address = req.body.address : null;
        (req.body.rating) ? provider.rating = req.body.rating : null;
        //save provider
        provider.save(function(err) {
            if (err)
                res.send(err);
            res.json({ message: 'Provider has been updated' });
        });
    });
});

//It is significantly faster to use find() + limit() because findOne() will always read + return the document if it exists. 
router.route('/reviews/:provider_id')
.get(checkJwt, checkScopes, function(req, res) {
    Review.find({provider_id: escape(req.params.provider_id)}, function(err, review) {
        if (err)
            res.send(err);
        
        res.json(review)
    });
}).post(checkJwt, checkScopes, function(req, res) {
    var review = new Review();
    //body parser lets us use the req.body
    review.user_id = req.body.user_id;
    review.provider_id = req.body.provider_id;
    review.providerRating = req.body.providerRating;
    review.serviceType = req.body.serviceType;
    review.serviceRating = req.body.serviceRating;
    review.comment = req.body.comment;
    review.satisfaction = req.body.satisfaction;
    review.save(function(err) {
        if (err)
            res.send(err);
        res.json({ message: 'Review successfully added!' });
    });
});

router.route('/reviews-aggregate/:provider_id')
.get(checkJwt, checkScopes, function(req, res) {
    Review.aggregate( [ 
        { $match: { provider_id: escape(req.params.provider_id) } },
        
        { $group: { 
                _id: "$provider_id",
                count: { $sum: 1 },
                communication: { $sum: "$providerRating.communication" },
                management: { $sum: "$providerRating.management" },
                integrity: { $sum: "$providerRating.integrity" },
                reliability: { $sum: "$providerRating.reliability" },
                availability: { $sum: "$providerRating.availability" },
                timeliness: { $sum: "$serviceRating.timeliness" },
                quality: { $sum: "$serviceRating.quality" },
                costs: { $sum: "$serviceRating.costs" } 
            }
        },
        { $project: { 
                totalAverage: { $divide: [ { $sum: ["$communication", "$management", "$integrity", "$reliability", 
                    "$availability", "$timeliness", "$quality", "$costs"] }, { $multiply: [8, { $min: "$count" }] } ] } }
        }
    ],
        function(err, review) {
            if (err)
                res.send(err);

            res.json(review);
        });
});

app.use('/api', router);

app.listen(port);
console.log('Server listening on http://localhost:3001. The React app will be built and served at http://localhost:3000.');

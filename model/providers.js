'use strict';
//import dependency
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//create new instance of the mongoose.schema. the schema takes an 
//object that shows the shape of your database entries.
var ProvidersSchema = new Schema({
    name: String,
    img: String,
    info: String,
    website: String,
    address: {
        street: String,
        city: String,
        postalCode: String,
        country: String
    }
});

//export our module to use in server.js
module.exports = mongoose.model('Providers', ProvidersSchema);
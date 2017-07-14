'use strict';
//import dependency
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//create new instance of the mongoose.schema. the schema takes an 
//object that shows the shape of your database entries.
var ReviewsSchema = new Schema({
    user_id: String,
    provider_id: { type: Schema.Types.ObjectId, ref: 'Providers' },
    createdAt: { type : Date, default: Date.now },
    updatedAt: { type : Date, default: Date.now },
    providerRating: {
        communication: Number,
        management: Number,
        integrity: Number,
        reliability: Number,
        availability: Number
    },
    serviceType: String,
    serviceRating: {
        timeliness: Number,
        quality: Number,
        costs: Number
    },
    comment: String,
    satisfaction: Number
});

//export our module to use in server.js
module.exports = mongoose.model('Reviews', ReviewsSchema);
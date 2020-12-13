const mongoose = require('mongoose');
const Schema = mongoose.Schema;

require('mongoose-currency').loadType(mongoose);
const Currency = mongoose.Types.Currency;
//const attendanceLog = require('./attendance');

const memberSchema = new mongoose.Schema({
    
    name: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true,
        unique: true},
    password:{ 
        type: String,
        required: true,
        default: "123456"},
    email:{
        type: String,
        required: true,
        unique: true
    },
    officeLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'locationSchema'
        //make sure it is an office
    },
    salary:{
        type: Currency,
        required: true
    },
    prompt:{
        type: Boolean,
        default: true
        //change to false if user changed password on the first time
    },
    gender: String,
    dayOff: String
});

module.exports = mongoose.model('Member', memberSchema);
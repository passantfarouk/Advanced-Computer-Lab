const { timeStamp } = require('console');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeletedToken = new mongoose.Schema({
    
    token : String 
});

module.exports = mongoose.model('Attendance', DeletedToken);
module.exports.DeletedToken = DeletedToken;
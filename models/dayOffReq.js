const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const academicMemberSchemaModel = require('./academicMember');
const academicMemberSchema = academicMemberSchemaModel.academicMemberSchema;

const dayOffReqSchema = new mongoose.Schema({

    requestID:{
        type: Number
    },
    memberID:{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'academicMemberSchema',
        required: true},

    requestedDay: {
        type: String,
        required: true},

    status:{
        type: String,
        default: "Pending"
    },
    comment: String
    
});

module.exports = mongoose.model('DayOffReq', dayOffReqSchema);
module.exports.dayOffReqSchema = dayOffReqSchema;
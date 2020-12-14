const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const memberSchema = require('./members');

const ReplacementSchema  = new mongoose.Schema({
    StaffID:{    // the staff who sent the request 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'memberSchema'
    },

   ReplacementID :{            //this represents the TA that will replace the Ta whos sent the request
    type :Number
   }, 
   found :{
       type : Boolean,
   }

    
});

module.exports = mongoose.model('ReplacementSchema', ReplacementSchema);
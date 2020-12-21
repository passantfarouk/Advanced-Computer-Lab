const express = require('express');
const { timeStamp } = require('console');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const jwt_decode = require('jwt-decode'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const key = 'shawerma';
const members = require('../models/members')
const location = require('../models/location')
const AM = require('../models/academicMember')
const DeletedToken = require("../models/DeletedTokens")
const attendance = require("../models/attendance");
const e = require('express');
const missing = require('../models/missing');


const MemberRouter = express.Router();
MemberRouter.use(bodyParser.json());

MemberRouter.route('/login')
.post(async(req,res,next) =>{
    try {
        const {email,password}=req.body;
        if(!email|| !password){
            return res.status(400).json({msg:"please enter email or password"})
        }
        const existingUser = await members.findOne({email:email});
        if(!existingUser)
        {
            return res.status(400).json({msg:"Not found Member."})
        }
        const isMatched = await bcrypt.compare(password,existingUser.password);
        if(!isMatched){
            return res.status(400).json({msg:"inavalid password"})
        }
        const token = jwt.sign({id:existingUser.id},key);
       
        res.header("auth-token",token);
        res.send("Logged in sucssefully ")

    }
    catch(error){
        res.status(500).json({error:error.message})
    }

    //verify that the needed credentials are given
    //verify that there is a user with the email given in the body
    //if found verify that the password is correct using bcrypt
    //if this is the first login prompt the user to change password
    //use the prompt col in the member table
});

MemberRouter.route('/logout')
.get(async(req,res,next) =>{
 try{
    const token  = req.header('auth-token');
    const t = new DeletedToken({token : token})
    await t.save()
   res.send("Logged out.")
 }
 catch(error){
    res.status(500).json({error:error.message})
}
    //verify that the needed credentials are given
    //I think delete the token
});

MemberRouter.route('/viewProfile')
.get(async(req,res,next) =>{
    try{
    const token  = req.header('auth-token');
    const DecodeToken = jwt_decode(token);
    const id = DecodeToken.id;
    const existingUser = await members.findOne({id:id});
    const deletedtoken = await DeletedToken.findOne({token:token});
   if(deletedtoken){
        res.send("Sorry you are logged out .")
    }
     else{
    if(!existingUser){
        res.send("not Authenticated")
    }
    if(id.includes('ac')){
    const academicMember = await AM.findOne({Memberid :existingUser._id});
     const OfficeID = existingUser.officeLocation;
     const OfficeName = await location.findOne({_id:OfficeID});
     const course = academicMember.course;
    res.json({
        Member :{
            name :existingUser.name,
            email:existingUser.email,
            faculty :academicMember.faculty,
            department: academicMember.department,
            dayOff:existingUser.dayOff,
            Office : OfficeName.name,
            course : course
        }
    })
    //res.send(course)
}
else{
res.json({
    Member :{
        name :existingUser.name,
        email:existingUser.email,
        Office : OfficeName.name
    }
});
}
     }
    }
    catch(error){
        res.status(500).json({error:error.message})
    }
});

MemberRouter.route('/updateProfile')
.post(async(req,res,next) =>{
    try{
    const {NewSecondaryEmail,NewPhonenumber, NewOfficehours} = req.body;
    const token  = req.header('auth-token');
    const DecodeToken = jwt_decode(token);
    const id = DecodeToken.id;
    const existingUser = await members.findOne({id:id});
    const deletedtoken = await DeletedToken.findOne({token:token});
if(deletedtoken){
    res.send("Sorry you are logged out .")
}
else{
    if(!existingUser){
        res.send("Not authenticated");
    }
    if(NewSecondaryEmail){
    members.updateOne({id:id},{SecondayMail:NewSecondaryEmail} , function(err, res) {
        if (err) throw err;
        console.log("document updated 1");
      });
    }
      if(NewPhonenumber){
      members.updateOne({id:id},{phoneNumber:NewPhonenumber} , function(err, res) {
        if (err) throw err;
        console.log("document updated 2");
      });
    }
      if(id.includes('ac')){
          if(NewOfficehours){
            AM.updateOne({Memberid:existingUser._id},{officeHourse:NewOfficehours} , function(err, res) {
                if (err) throw err;
                console.log("document updated 2");
              });
  
          }
      }
      res.send("Updated Successfully .")
    }
    }
    catch(error){
        res.status(500).json({error:error.message})

    }
    //authenticate
    //refuse to update name or id
    //check member type;
    //if academic member refuse to update salary, faculty and department.
});

MemberRouter.route('/resetPassword')
.post(async(req,res,next) =>{
    try{
    const token  = req.header('auth-token');
    const DecodeToken = jwt_decode(token);
    const id = DecodeToken.id;
    const existingUser = await members.findOne({id:id});
    const deletedtoken = await DeletedToken.findOne({token:token});
if(deletedtoken){
    res.send("Sorry you are logged out .")
}
else{
    //console.log("hello")
    const NewPassword = req.body.NewPassword;
    if(NewPassword.length < 7 ){
       res.send("Password must be atleast 8 characters ")
    }
    const salt = await bcrypt.genSalt();
    const hasedPassword = await bcrypt.hash(NewPassword,salt);
    if(!existingUser){
    res.send("not authenticated ");
    }
    members.updateOne({id:id},{password:hasedPassword} , function(err, res) {
        if (err) throw err;
        console.log("document updated");
      });
      members.updateOne({id:id},{prompt:false} , function(err, res) {
        if (err) throw err;
        console.log("document updated");
      });
      res.send("Password Updated sucssefully.")
    }
    }
    catch(error){
        res.status(500).json({error:error.message})
    }

});


MemberRouter.route('/signIn')
.get(async(req,res,next) =>{
    try{
    const token  = req.header('auth-token');
    const DecodeToken = jwt_decode(token);
    const id = DecodeToken.id;
    const existingUser = await members.findOne({id:id});
    const today = new Date()
    const attended = new attendance({
        Memberid : existingUser._id ,
        signIn : today
    })
    await attended.save()
    res.send("Welcome to the guc.")
  
    }
    catch(error){
        res.status(500).json({error:error.message})
    }
    //does he has to be logged in?
    //authenticate
    //add a record in the attendace collection with the id from params with a new date created once signed in
});

MemberRouter.route('/signOut')
.get(async(req,res,next) =>{
    try{
    const token  = req.header('auth-token');
    const DecodeToken = jwt_decode(token);
    const id = DecodeToken.id;
    const existingUser = await members.findOne({id:id});
    var existingID = await attendance.find({Memberid:existingUser._id});
    console.log(existingID)
    const SignOutDate  = new Date();
    let i = 0 ;
    console.log(existingID.length)
    for(i=0 ; i < existingID.length;i++){
      //  console.log("here")
    var correspondingSignIn=existingID[i].signIn
   // console.log(correspondingSignIn);
    var correspondingSignInDay=correspondingSignIn.getDay()
    var correspondingSignInMonth=correspondingSignIn.getMonth()
    var correspondingSignOutDay=SignOutDate.getDay()
    var correspondingSignOutMonth=SignOutDate.getMonth()
    var MemberID = existingID[i].Memberid;
    //console.log(correspondingSignInDay,correspondingSignInMonth,correspondingSignOutDay,correspondingSignOutMonth,existingID[i].signOut,i)

    if(correspondingSignInDay === correspondingSignOutDay && correspondingSignInMonth===correspondingSignOutMonth && (existingID[i].signOut===undefined)){
        var existingObjectID = await attendance.find({Memberid:existingUser._id ,signOut:undefined });

       // console.log(correspondingSignInDay,correspondingSignInMonth,correspondingSignOutDay,correspondingSignOutMonth,existingID[i].signOut,i)

        //console.log("d5lt " + i)
        attendance.updateOne({_id:existingObjectID},{signOut:SignOutDate} , function(err, res) {
            if (err) throw err;
           // console.log("document updated 2");
          });
    }
}
   res.send("Good Bye!")              
      }
      catch(error){
          res.status(500).json({error:error.message})
      }
    //does he has to be logged in?
    //authenticate
    //update the last record in the attendace collection with the id from params with an empty signOut
    // with a new date created once signed out
    //update the hours remaining and missing in the log table
    //update the remaining days if the number of hours spent satisfies the day
});

MemberRouter.route('/viewAllAttendance')
.get(async(req,res,next) =>{
    try{
    const token  = req.header('auth-token');
    const DecodeToken = jwt_decode(token);
    const id = DecodeToken.id;
    const deletedtoken = await DeletedToken.findOne({token:token});
if(deletedtoken){
    res.send("Sorry you are logged out .")
}
    else{
    const existingUser = await members.findOne({id:id});
    const AttendanceRecord = await attendance.find({Memberid:existingUser._id})
    console.log(AttendanceRecord)
    res.json({
           
        AttendanceRecord

       
    })
    }

        // const token  = req.header('auth-token');
        // const DecodeToken = jwt_decode(token);
        // const id = DecodeToken.id;
        // const token  = req.header('auth-token');
        // const existingUser = await members.findOne({id:id});
        // const existingID = await attendance.findOne({_id:existingUser._id});


    }
    catch(error){
        res.status(500).json({error:error.message})
    }

    //authenticate
    //get all the records with the id from params 
});

MemberRouter.route('/viewAttendanceByMonth')
.get(async(req,res,next) =>{
    try{
        const Month = req.body;const token  = req.header('auth-token');
        const DecodeToken = jwt_decode(token);
        const id = DecodeToken.id;
        const existingUser = await members.findOne({id:id});
        const deletedtoken = await DeletedToken.findOne({token:token});
        const allMonths =['January','February','March', 'April','May','June', 'July', 'August','September', 'October', 'November','December' ];
        const wantedIndex = allMonths.indexOf(Month);
        console.log(wantedIndex)
        if(deletedtoken){
            res.send("sorry you are logged out .")
        }
        else{
    const existingUser = await members.findOne({id:id});
    const AttendanceRecord = await attendance.find({Memberid:existingUser._id})
    var WantedRecords = new Array();
    for(i=0 ; i<AttendanceRecord.length;i++ ){
      if(AttendanceRecord[i].signOut.getMonth()==wantedIndex)  {
        AttendanceRecord.push(AttendanceRecord[i])
      }
        }
        res.json({
           AttendanceRecord
        })   
     }
        
    }
    catch(error){
        res.status(500).json({error:error.message})


    }
    //authenticate
    //get all the records with the id from params and month is equal to mID
});

MemberRouter.route('/viewMissingDays')
.get(async(req,res,next) =>{
    //authenticate
    try{
     const token  = req.header('auth-token');
     const DecodeToken = jwt_decode(token);
     const id = DecodeToken.id;
     const existingUser = await members.findOne({id:id});
     const AllDays =['Sunday','Monday','Tuesday', 'Wednesday','Thursday','Friday', 'Saturday'];
     const deletedtoken = await DeletedToken.findOne({token:token});

      const StartDay = 11;
      if(!existingUser){
        res.send("Not authenticated ")
        return
    }
    if(deletedtoken){
        res.send('you are logged out.')
    }
    //get all the records with the id from token
    var GetAttendeddays = await  attendance.find({"Memberid": existingUser._id});

     // suppose all months are 30 day and they all have 4 fridays and 4 days Off
     //Leaves handle the missing days when requests are accepted 
     //so the missing days in the missing table should be updated by then

     var theDayMustAttend = 22;
     var uniqueDays = 0;
    
     if(!existingUser){
        res.send("Not authenticated ")
        return
    }
    if(deletedtoken){
        res.send('you are logged out.')
    }
    else{
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const startDate = newDate(currentYear, currentMonth, 11);
        const finishDate = newDate(currentYear, currentMonth+1, 10);
        //filter again the attendane to start from the desired month
        var monthAttendance = [];
        for (let j = 0 ; j < GetAttendeddays.length ; j++){
            if ((GetAttendeddays[j].getTime() >= startDate.getTime())&&(GetAttendeddays[j].getTime() <= finishDate.getTime())){
                monthAttendance.push(GetAttendeddays[j]);
            }else if(GetAttendeddays[j].getTime() <= finishDate.getTime()){
                break;
                //to avoid getting not needed data
            }
        }
        //compute the number of days attended
        var current;
        for(i=0 ;i < monthAttendance.length ; i ++){
            if(monthAttendance[i].signIn != undefined && monthAttendance[i].signOut != undefined){
                if(i == 0){
                    current = monthAttendance[i].signIn;
                    uniqueDays++;
                }else if(current.getTime() != (monthAttendance[i].signIn).getTime){
                    current = monthAttendance[i].signIn;
                    uniqueDays++;
                }
                //else this is the same day but different sign in time
            }    
        }
        //subtract the number of days that should be attended by the number of actually attended
        var diff = theDayMustAttend - uniqueDays
        //if the difference is positive then the missing days should increase
        //if the difference is negative then he attended more days than should so give him balance gad3na
        //update the missing table
        const miss = await missing.findOne({"Memberid": existingUser._id});
        if (!miss){
            //this is his first time
            const nMiss = new missing({
                Memberid: existingUser._id,
                missingDays: diff,
                remainingDays: 264 - uniqueDays
            });
            await missing.save();
            console.log("new missing added");
        }else{
            var preM = miss.missingDays + diff;
            const rem = miss.remainingDays - uniqueDays;
            await missing.findOneAndUpdate({"Memberid": existingUser._id}, {"missingDays": preM , "remainingDays": rem});
            console.log("missing updated");
        }
        res.send("missing days: " + preM);  
    }
}
catch(error){
    res.status(500).json({error:error.message})
}

    
});


MemberRouter.route('/viewHours')
.get((req,res,next) =>{
    //authenticate
    //get all the records with the id from params
    //compute the number of hours missing shown in negative /extra shown in positive
});

module.exports = MemberRouter;

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const jwt = require('jsonwebtoken');
const jwt_decode = require('jwt-decode');
const bcrypt = require('bcryptjs');
const key = 'shawerma';
const validator = require('validator');
const academicMember = require('../models/academicMember');
const department = require('../models/department');
const member = require('../models/members');
const courses = require('../models/course');
const members = require('../models/members');
const slot = require('../models/slot');
const dayOffReq = require('../models/dayOffReq');
const location = require('../models/location');
const course = require('../models/course');
const Leaves = require('../models/Leaves');
const missing = require('../models/missing');
const DeletedToken = require("../models/DeletedTokens");
const replacementrequest = require('../models/replacementrequest');
const compensationslot = require('../models/CompensationSlot');

const HodRouter = express.Router();

HodRouter.use(bodyParser.json());
HodRouter.use(express.json())

HodRouter.route('/assignInstructor')
    .post(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            // const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});
            if (typeof (req.body.id) == "string" && typeof (req.body.code) == "string") {
                const insID = req.body.id
                const c = req.body.code
                const ufound = await academicMember.findOne(
                    {
                        Memberid: found._id
                    });
                const m = await members.findOne(
                    {
                        id: insID
                    });
                if (m == null) {
                    return res.json({msg:"Instructor does not exist"});
                }
                const a = await academicMember.findOne(
                    {
                        Memberid: m._id
                    });
                if (!currentid.includes("ac")) {
                    return res.json({msg:"not authorized"});
                }
                if (ufound.type != "HeadOfDepartment") {
                    return res.json({msg:"not authorized"});
                }
                if (a.department != ufound.department) {
                    return res.json({msg:"The instructor is not in your department"});
                }
                if (a.type == "academic member") {
                    return res.json({msg:"The user is not an instructor"});
                }
                //get the course instructor id from the body
                //get the course code from the body
                //verify that there is an instructor with this id
                //verify that there is a course with this code
                //assign this instructor to the course
                else {

                    const co = await course.findOne(
                        {
                            code: c
                        });
                    if (co == null) {
                        return res.json({msg:"Course does not exist"});
                    }
                    if(a.courses != null){
                    for(j=0;j<a.courses.length;j++){
                        if(a.courses[j].equals(co._id))
                        return res.json({msg:"The instructor is already assigned to this course"});
                    }
                }
                    const courseId = await course.findOne({ code: c });
                    const dep = await department.findOne({ name: ufound.department });
                    var flag = false;
                    if(dep.courses != null){
                    for (i = 0; i < dep.courses.length; i++) {
                        if (dep.courses[i].equals(co._id)) {

                            flag = true;
                            courseId.instructors.push(a._id)
                            await courseId.save();
                            a.courses.push(courseId._id);
                            await a.save();
                            break;
                        }
                    }
                }
                    if (flag == false)
                        return res.json({msg:"This course is not in your department"});
                }
                res.json({msg:"Instructor added successfully"})
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message })
        }
    });

HodRouter.route('/DeleteInstructor/:id/:code')
    .delete(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});
            const ufound = await academicMember.findOne({ Memberid: found._id });

            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }
            //get the course instructor id from the body
            //get the course code from the body
            //verify that there is an instructor with this id
            //verify that there is a course with this code
            //verify that this instructor is assigned to this course
            //delete this assignment
            else {
               // if (typeof (req.params.id) == "string" && typeof (req.params.code) == "string") {
                    const courseIns = req.params.id;
                    const courseCode = req.params.code;
                    
                    const m = await members.findOne({ id: courseIns });
                    if (m == null)
                        return res.json({msg:"This instructor does not exist"});
                    const c = await courses.findOne({ code: courseCode });
                   
                    if (c == null)
                        return res.json({msg:"This course does not exist"});
                    const a = await academicMember.findOne({ Memberid: m._id });
                    if (a.type == "academic member")
                        return res.json({msg:"The user is not an instructor"});
                    if (a.department != ufound.department)
                        return res.json({msg:"The instructor is not in your department"});
                    const d = await department.findOne({ name: ufound.department }, { courses: c._id });
                    if (d == null)
                        return res.json({msg:"The course is not in your department"});
                    for (i = 0; i < c.instructors.length; i++) {
                        if (c.instructors[i].equals(a._id)) {
                            c.instructors.splice(i,1);
                            await c.save();
                            for(j=0;j<a.courses.length;j++){
                                if(a.courses[j].equals(c._id)){
                                  a.courses.splice(j,1);
                                  await a.save();
                                }
                            }
                            
                        }
                        else {
                            if(i == c.instructors.length-1)
                            return res.json({msg:"This instructor is not assigned to this course"});
                        }
                    
                        const s = await slot.find({ _id: a.schedule })
                        if(s!=null){
                        for (k = 0; k < s.length; k++) {
                            if (s != null) {
                                if (s[k].memberID.equals(a._id) && s[k].course.equals(c._id)) {
                                    s[k].memberID = null;
                                    await s[k].save();
                                    if(c.numberOfSlotsAssigned>0){
                                    c.numberOfSlotsAssigned--;
                                    c.coverage = c.numberOfSlotsAssigned / c.numberOfSlotsNeeded;
                                    await c.save();
                                    }
                                    
                                for(j=0;j<a.schedule.length;j++){
                                    if(a.schedule[j].equals(s[k]._id) ){
                                    a.schedule.splice(j,1);
                                    await a.save()
                                }
                            }
                            
                        }
                    }
                    }
                }
                }
                    res.json({msg:"instructor deleted successfully"})
               // }
            }
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });


HodRouter.route('/UpdateInstructor')
    .put(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});
            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }
            //get the course instructor id from the body
            //get the course code from the body
            //verify that there is an instructor with this id
            //verify that there is a course with this code
            //verify that this instructor is assigned to this course
            //update this assignment
            else {
                if (typeof (req.body.id) == "string" && typeof (req.body.codeOld) == "string" && typeof (req.body.codeNew) == "string") {
                    const courseIns = req.body.id;
                    const courseCodeOld = req.body.codeOld;
                    const courseCodeNew = req.body.codeNew;
                   
                    const m = await members.findOne({ id: courseIns });
                    if (m == null)
                        return res.json({msg:"This instructor does not exist"});
                    const c = await courses.findOne({ code: courseCodeOld });
                    if (c == null)
                        return res.json({msg:"The old course does not exist"});
                    const c1 = await courses.findOne({ code: courseCodeNew });
                    if (c1 == null)
                        return res.json({msg:"The new course does not exist"});
                    const a = await academicMember.findOne({ Memberid: m._id })
                    const dep = await department.findOne({ name: ufound.department }, { courses: courseCodeNew });
                    const dep1 = await department.findOne({ name: ufound.department }, { courses: courseCodeOld });

                    if (dep == null)
                        return res.json({msg:"The new course does not belong to your departmwnt"});
                    if (dep1 == null)
                        return res.json({msg:"The old course does not belong to your deparment"});

                    if (a.department != ufound.department) {
                        return res.json({msg:"The instructor does not belong to your deparment"});
                    }
                    // if(a == null)
                    //      return res.status(401).send("The instructor is not assigned to the old course");
                    // if(a2!=null){
                    //     console.log(a2)
                    //     console.log(a)
                    //      return res.status(401).send("The instructor is already assigned to the new course");
                    // }
                    for (i = 0; i < a.courses.length; i++) {
                        if (a.courses[i].equals(c1._id)) {
                            return res.json({msg:"The instructor is already assigned to the new course"})
                        }
                        // if(a == null)
                        //      return res.status(401).send("The instructor is not assigned to the old course");
                        // if(a2!=null){
                        //     console.log(a2)
                        //     console.log(a)
                        //      return res.status(401).send("The instructor is already assigned to the new course");
                        // }
                        for (i = 0; i < a.courses.length; i++) {
                           
                            if (a.courses[i].equals(c1._id)) {
                                return res.josn({msg:"The instructor is already assigned to the new course"})
                            }
                            if (!(a.courses[i].equals(c._id))) {
                               
                                return res.json({msg:"The instructor is not assigned to the old course"})
                            }

                        }
                    
                    for (i = 0; i < c.instructors.length; i++) {
                        if (c.instructors[i].equals(a._id)) {
                            c.instructors.splice(i,1);
                            await c.save();
                            for(j=0;j<a.courses.length;j++){
                                if(a.courses[j].equals(c._id)){
                                  a.courses.splice(j,1);
                                  await a.save();
                                }
                            }
                            c1.instructors.push(a._id);
                                await c1.save();
                            
                        }
                        else {
                            return res.json({msg:"This instructor is not assigned to this course"});
                        }
                    
                        const s = await slot.find({ _id: a.schedule })
                        if(s != null){
                        for (k = 0; k < s.length; k++) {
                            if (s != null) {
                                if (s[k].memberID.equals(a._id) && s[k].course.equals(c._id)) {
                                    s[k].memberID = null;
                                    await s[k].save();
                                    if(c.numberOfSlotsAssigned>0){
                                    c.numberOfSlotsAssigned--;
                                    c.coverage = c.numberOfSlotsAssigned / c.numberOfSlotsNeeded;
                                    await c.save();
                                    }
                                 if(schedule.length !=0)   {
                                for(j=0;j<a.schedule.length;j++){
                                    if(a.schedule[j].equals(s[k]._id) ){
                                    a.schedule.splice(j,1);
                                    await a.save()
                                }
                            }
                        }
                        
                        }
                    }
                }
                    }
                    console.log(c1._id);
                            a.courses.push(c1._id);
                                 await a.save();
                }

                    res.json({msg:"Instructor updated successfully"})
                }
            }
        }
    }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

HodRouter.route('/viewMembersDep')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            console.log(found)
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});
            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }


            //get the department
            //get all academic members profiles in this department
            else {
                const dep = ufound.department;
                const depmembers = await department.findOne(
                    {
                        name: dep
                    });
                var TA;
                var TA1;
                var course = [];
                var c;
                var courseInstructor;
                var courseInstructor1;
                var allStaff = [];
                var loc;
               
                for (i = 0; i < depmembers.teachingAssistants.length; i++) {
                    TA = await academicMember.findOne(
                        {
                            _id: depmembers.teachingAssistants[i]
                        });
                    TA1 = await members.findOne(
                        {
                            _id: TA.Memberid
                        });
                    loc = await location.findOne(
                        {
                            _id: TA1.officeLocation
                        });
                    course = [];
                    for (j = 0; j < TA.courses.length; j++) {
                        c = await courses.findOne({ _id: TA.courses[j] });
                        if (c != null)
                            course.push(c.code)
                    }
                    allStaff.push({"name":TA1.name, "id":TA1.id, "email":TA1.email,"courses": course, "type":TA.type,"faculty": TA.faculty,"department": TA.department,"Office": loc.name, "officeHours":TA.officeHourse, "dayOff":TA1.dayOff});
                }
                for (i = 0; i < depmembers.instructors.length; i++) {
                    courseInstructor1 = await academicMember.findOne(
                        {
                            _id: depmembers.instructors[i]
                        });
                    courseInstructor = await members.findOne(
                        {
                            _id: courseInstructor1.Memberid
                        });
                    loc = await location.findOne(
                        {
                            _id: courseInstructor.officeLocation
                        });
                    course = [];
                    for (j = 0; j < courseInstructor1.courses.length; j++) {
                        c = await courses.findOne(
                            {
                                _id: courseInstructor1.courses[j]
                            });
                        course.push(c.code)
                    }
                    allStaff.push({"name":courseInstructor.name,"id": courseInstructor.id, "email":courseInstructor.email, "courses":course,"type": courseInstructor1.type,"faculty": courseInstructor1.faculty,"department": courseInstructor1.department, "office":loc.name, "officeHours":courseInstructor1.officeHourse, "dayOff":courseInstructor.dayOff});
                }

                res.json(allStaff);
            }
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

HodRouter.route('/viewMembers/:cID')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});
            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }

            //get the department
            //get the course from the params
            //get all academic members profiles in this department teaching this course
            else {
                const dep = ufound.department;
                //const depmembers=await department.findOne({name:dep});
                const courseID = req.params.cID;
                const c = await courses.findOne(
                    {
                        code: courseID
                    });
                if (c == null)
                    return res.json({msg:"This course does not exist"});
                if ((await department.findOne(
                    {
                        name: dep
                    },
                    {
                        courses: c._id
                    })) == null)
                    return res.json({msg:"This course is not in your department"});
                var c1;
                var cTA;
                var ta;
                var ins;
                var ins1;
                var course = [];
                var All = [];
                var loc;
                for (i = 0; i < c.teachingAssistants.length; i++) {
                    ta = await academicMember.findOne(
                        {
                            _id: c.teachingAssistants[i]
                        });

                    if (ta != null) {
                        cTA = await members.findOne(
                            {
                                _id: ta.Memberid
                            });
                        loc = await location.findOne(
                            {
                                _id: cTA.officeLocation
                            })
                        course = [];
                        for (j = 0; j < ta.courses.length; j++) {
                            c1 = await courses.findOne({ _id: ta.courses[j] });
                            if (c1 != null)
                                course.push(c1.code)
                        }
                        All.push({"name":cTA.name, "id":cTA.id, "email":cTA.email, "courses":course, "type":ta.type,"faculty": ta.faculty,"department": ta.department, "office":loc.name, "officeHours":ta.officeHourse, "dayOff":cTA.dayOff});
                    }
                    //All.push([cTA.name,cTA.id,cTA.email,course,ta.type,ta.faculty,ta.department,ta.officeHourse]);
                }
                for (i = 0; i < c.instructors.length; i++) {
                    ins1 = await academicMember.findOne(
                        {
                            _id: c.instructors[i]
                        });
                    if (ins1 != null) {
                        ins = await members.findOne(
                            {
                                _id: ins1.Memberid
                            });
                        loc = await location.findOne(
                            {
                                _id: ins.officeLocation
                            });
                        course = [];
                        for (j = 0; j < ins1.courses.length; j++) {
                            c1 = await courses.findOne({ _id: ins1.courses[j] });
                            if (c1 != null)
                                course.push(c1.code)
                        }
                        All.push({"name":ins.name, "id":ins.id, "email":ins.email,"courses": course, "type":ins1.type,"faculty": ins1.faculty, "department":ins1.department,"office": loc.name, "officeHours":ins1.officeHourse, "dayOff":ins.dayOff});
                    }
                }
                res.json(All);
            }

        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

HodRouter.route('/viewDaysOffAll')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});
            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }

            //get the department
            //get the day off col from the members table for all teachers of this department
            else {
                const dep = ufound.department;
                const depmembers = await department.findOne(
                    {
                        name: dep
                    });
                var depTeachingAssistants = [];
                //var TAs=[];
                var TA;
                var staff;
                var depCourseInstructor = [];
                var courseInstructor = [];
                var courseInstructor1;
                var allStaff = [];
                for (i = 0; i < depmembers.teachingAssistants.length; i++) {
                    depTeachingAssistants.push(depmembers.teachingAssistants[i]);
                    TA = await academicMember.findOne(
                        {
                            _id: depTeachingAssistants[i]
                        });
                    staff = await members.findOne(
                        {
                            _id: TA.Memberid
                        });
                    //  TAs.push(TA);
                    allStaff.push({"name":staff.name,"id": staff.id,"dayOff": staff.dayOff});
                }
                for (j = 0; j < depmembers.instructors.length; j++) {
                    depCourseInstructor.push(depmembers.instructors[j]);
                    courseInstructor1 = await academicMember.findOne(
                        {
                            _id: depCourseInstructor[j]
                        });
                    staff = await members.findOne(
                        {
                            _id: courseInstructor1.Memberid
                        });
                    courseInstructor.push(courseInstructor1);
                    allStaff.push({"name":staff.name, "id":staff.id, "dayOff":staff.dayOff});
                }
                res.json(allStaff);
            }

        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

HodRouter.route('/viewDaysOff/:memID')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});
            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return result.json({msg:"not authorized"});
            }
            const mem = await members.findOne({ id: req.params.memID });
            if (mem == null) {
                return res.json({msg:"This user does not exist"});
            }

            //get the department
            //verify that there is an academic member with this id
            //verify that this member is in the same department
            //get the day off of this member
            if (!req.params.memID.includes("ac")) {
                return res.json({msg:"This user is not an academic staff"});
            }

            const dep = ufound.department;
            const depmembers = await department.findOne({ name: dep });


            var dayoff;

            const amem = await academicMember.findOne({ Memberid: mem._id });
            if (amem.department !== dep) {
                return res.json({msg:"This user is not in your department"});
            }
            else {
                dayoff = mem.dayOff;
            }
            res.json({"name":mem.name,"id": mem.id,"dayOff": dayoff});
        }

        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });


HodRouter.route('/viewDayOffReq')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            // const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});

            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }

            //get the department
            //show all dayoff requests for members in this department
            else {
                const dep = ufound.department;
                const dayoffreq = await dayOffReq.find(
                    {})
                var a;
                var m;
                var all = [];
                for (i = 0; i < dayoffreq.length; i++) {
                    a = await academicMember.findOne({ _id: dayoffreq[i].memberID });
                    if (a != null) {
                        m = await members.findOne({ _id: a.Memberid });
                        if (a.department == dep) {
                            all.push({"name":m.name, "id":m.id, "requestID":dayoffreq[i].requestID, "status":dayoffreq[i].status, "requestedDay":dayoffreq[i].requestedDay, "comment":dayoffreq[i].comment});
                        }
                    }
                }
                res.json(all)
            }

        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

HodRouter.route('/viewLeaveReq')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});

            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }
            //get the department
            //show all leave requests for members in this department
            const d = await department.findOne(
                {
                    name: ufound.department
                });
            var l;
            var a;
            var m;
            var total = [];
            for (i = 0; i < d.teachingAssistants.length; i++) {
                a = await academicMember.findOne({ _id: d.teachingAssistants[i] });
                m = await members.findOne({ _id: a.Memberid });
                l = await Leaves.find({ StaffID: m._id });
                for (j = 0; j < l.length; j++) {
                    if (l[j] != null) {
                        if (l[j].Leavetype == "Accidental") {
                            total.push({"name":m.name, "id":m.id, "requestID":l[j].requestID,"Leavetype":l[j].Leavetype,"numberOfdays":l[j].numberOfdays,"status": l[j].status, "reason":l[j].reason});
                        }
                        if (l[j].Leavetype == "Annual") {
                            total.push({"name":m.name, "id":m.id, "requestID":l[j].requestID,"Leavetype":l[j].Leavetype,"numberOfdays":l[j].numberOfdays, "status":l[j].status, "dateOfLeave":l[j].dateOfLeave, "AnnualBalance":m.AnnualBalance});
                        }
                        if (l[j].Leavetype == "Compensation") {
                            total.push({"name":m.name, "id":m.id,"requestID":l[j].requestID,"Leavetype":l[j].Leavetype, "dateOfabsence":l[j].dateOfabsence, "status":l[j].status, "dateOfcompensation":l[j].dateOfcompensation, "reason":l.reason});
                        }
                        if (l[j].Leavetype == "Maternity") {
                            total.push({"name":m.name,"id": m.id,"requestID":l[j].requestID,"Leavetype":l[j].Leavetype, "document":l[j].document, "status":l[j].status, "dateOfLeave":l[j].dateOfLeave});
                        }
                        if (l[j].Leavetype == "Sick") {
                            total.push({"name":m.name, "id":m.id,"requestID":l[j].requestID,"Leavetype":l[j].Leavetype, "document":l[j].document, "status":l[j].status, "dateOfLeave":l[j].dateOfLeave, "dateOfdocument":l[j].dateOfdocument});
                        }
                    }
                }
            }
            for (i = 0; i < d.instructors.length; i++) {
                a = await academicMember.findOne({ _id: d.instructors[i] });
                m = await members.findOne({ _id: a.Memberid });
                l = await Leaves.find({ StaffID: m._id });
                for (j = 0; j < l.length; j++) {
                    if (l[j] != null) {
                        if (l[j].Leavetype == "Accidental") {
                            total.push({"name":m.name, "id":m.id, "requestID":l[j].requestID,"Leavetype":l[j].Leavetype,"numberOfdays": l[j].numberOfdays, "status":l[j].status, "reason":l[j].reason, "AnnualBalance":m.AnnualBalance});
                        }
                        if (l[j].Leavetype == "Annual") {
                            total.push({"name":m.name,"id": m.id,"requestID":l[j].requestID, "Leavetype":l[j].Leavetype, "numberOfdays":l[j].numberOfdays, "status":l[j].status,"dateOfLeave": l[j].dateOfLeave, "AnnualBalance":m.AnnualBalance});
                        }
                        if (l[j].Leavetype == "Compensation") {
                            total.push({"name":m.name,"id": m.id,"requestID":l[j].requestID,"Leavetype": l[j].Leavetype, "dateOfabsence":l[j].dateOfabsence, "status":l[j].status,"dateOfcompensation": l[j].dateOfcompensation, "reason":l[j].reason});
                        }
                        if (l[j].Leavetype == "Maternity") {
                            total.push({"name":m.name,"id": m.id,"requestID":l[j].requestID, "Leavetype":l[j].Leavetype, "document":l[j].document, "status":l[j].status, "dateOfLeave":l[j].dateOfLeave});
                        }
                        if (l[j].Leavetype == "Sick") {
                            total.push({"name":m.name, "id":m.id,"requestID":l[j].requestID, "Leavetype":l[j].Leavetype, "document":l[j].document,"status": l[j].status, "dateOfLeave":l[j].dateOfLeave, "dateOfdocument":l[j].dateOfdocument});
                        }
                    }
                }
               
            }
            res.json(total);
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

   

    HodRouter.route('/viewAnnualLeaveReq')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});

            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }
            //get the department
            //show all leave requests for members in this department
            const d = await department.findOne(
                {
                    name: ufound.department
                });
            var l;
            var a;
            var m;
            var total = [];
            for (i = 0; i < d.teachingAssistants.length; i++) {
                a = await academicMember.findOne({ _id: d.teachingAssistants[i] });
                m = await members.findOne({ _id: a.Memberid });
                l = await Leaves.find({ StaffID: m._id });
                for (j = 0; j < l.length; j++) {
                    if (l[j] != null) {
                        if (l[j].Leavetype == "Annual") {
                            total.push({"name":m.name, "id":m.id, "requestID":l[j].requestID,"Leavetype":l[j].Leavetype,"numberOfdays":l[j].numberOfdays, "status":l[j].status, "dateOfLeave":l[j].dateOfLeave, "AnnualBalance":m.AnnualBalance});
                        }
                    }
                }
            }
            for (i = 0; i < d.instructors.length; i++) {
                a = await academicMember.findOne({ _id: d.instructors[i] });
                m = await members.findOne({ _id: a.Memberid });
                l = await Leaves.find({ StaffID: m._id });
                for (j = 0; j < l.length; j++) {
                    if (l[j] != null) {
                        if (l[j].Leavetype == "Annual") {
                            total.push({"name":m.name,"id": m.id,"requestID":l[j].requestID, "Leavetype":l[j].Leavetype, "numberOfdays":l[j].numberOfdays, "status":l[j].status,"dateOfLeave": l[j].dateOfLeave, "AnnualBalance":m.AnnualBalance});
                        }
                    }
                }
               
            }
            res.json(total);
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });


    HodRouter.route('/viewAccidentalLeaveReq')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});

            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }
            //get the department
            //show all leave requests for members in this department
            const d = await department.findOne(
                {
                    name: ufound.department
                });
            var l;
            var a;
            var m;
            var total = [];
            for (i = 0; i < d.teachingAssistants.length; i++) {
                a = await academicMember.findOne({ _id: d.teachingAssistants[i] });
                m = await members.findOne({ _id: a.Memberid });
                l = await Leaves.find({ StaffID: m._id });
                for (j = 0; j < l.length; j++) {
                    if (l[j] != null) {
                        if (l[j].Leavetype == "Accidental") {
                            total.push({"name":m.name, "id":m.id, "requestID":l[j].requestID,"Leavetype":l[j].Leavetype,"numberOfdays":l[j].numberOfdays,"status": l[j].status, "reason":l[j].reason, "AnnualBalance":m.AnnualBalance,"HodComment":l[j].HodComment});
                        }
                    }
                }
            }
            for (i = 0; i < d.instructors.length; i++) {
                a = await academicMember.findOne({ _id: d.instructors[i] });
                m = await members.findOne({ _id: a.Memberid });
                l = await Leaves.find({ StaffID: m._id });
                for (j = 0; j < l.length; j++) {
                    if (l[j] != null) {
                        if (l[j].Leavetype == "Accidental") {
                            total.push({"name":m.name, "id":m.id, "requestID":l[j].requestID,"Leavetype":l[j].Leavetype,"numberOfdays": l[j].numberOfdays, "status":l[j].status, "reason":l[j].reason, "AnnualBalance":m.AnnualBalance, "HodComment":l[j].HodComment});
                        }
                    }
                }
               
            }
            res.json(total);
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });
   

    HodRouter.route('/viewCompensationLeaveReq')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});

            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }
            //get the department
            //show all leave requests for members in this department
            const d = await department.findOne(
                {
                    name: ufound.department
                });
            var l;
            var a;
            var m;
            var total = [];
            for (i = 0; i < d.teachingAssistants.length; i++) {
                a = await academicMember.findOne({ _id: d.teachingAssistants[i] });
                m = await members.findOne({ _id: a.Memberid });
                l = await Leaves.find({ StaffID: m._id });
                for (j = 0; j < l.length; j++) {
                    if (l[j] != null) {
                        if (l[j].Leavetype == "Compensation") {
                            total.push({"name":m.name, "id":m.id,"requestID":l[j].requestID,"Leavetype":l[j].Leavetype, "dateOfabsence":l[j].dateOfabsence, "status":l[j].status, "dateOfcompensation":l[j].dateOfcompensation, "reason":l.reason});
                        }
                    }
                }
            }
            for (i = 0; i < d.instructors.length; i++) {
                a = await academicMember.findOne({ _id: d.instructors[i] });
                m = await members.findOne({ _id: a.Memberid });
                l = await Leaves.find({ StaffID: m._id });
                for (j = 0; j < l.length; j++) {
                    if (l[j] != null) {
                        if (l[j].Leavetype == "Compensation") {
                            total.push({"name":m.name,"id": m.id,"requestID":l[j].requestID,"Leavetype": l[j].Leavetype, "dateOfabsence":l[j].dateOfabsence, "status":l[j].status,"dateOfcompensation": l[j].dateOfcompensation, "reason":l[j].reason});
                        }
                    }
                }
               
            }
            res.json(total);
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

    HodRouter.route('/viewMaternityLeaveReq')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});

            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }
            //get the department
            //show all leave requests for members in this department
            const d = await department.findOne(
                {
                    name: ufound.department
                });
            var l;
            var a;
            var m;
            var total = [];
            for (i = 0; i < d.teachingAssistants.length; i++) {
                a = await academicMember.findOne({ _id: d.teachingAssistants[i] });
                m = await members.findOne({ _id: a.Memberid });
                l = await Leaves.find({ StaffID: m._id });
                for (j = 0; j < l.length; j++) {
                    if (l[j] != null) {
                        if (l[j].Leavetype == "Maternity") {
                            total.push({"name":m.name,"id": m.id,"requestID":l[j].requestID,"Leavetype":l[j].Leavetype, "document":l[j].document, "status":l[j].status, "dateOfLeave":l[j].dateOfLeave, "HodComment":l[j].HodComment});
                        }
                    }
                }
            }
            for (i = 0; i < d.instructors.length; i++) {
                a = await academicMember.findOne({ _id: d.instructors[i] });
                m = await members.findOne({ _id: a.Memberid });
                l = await Leaves.find({ StaffID: m._id });
                for (j = 0; j < l.length; j++) {
                    if (l[j] != null) {
                        if (l[j].Leavetype == "Maternity") {
                            total.push({"name":m.name,"id": m.id,"requestID":l[j].requestID, "Leavetype":l[j].Leavetype, "document":l[j].document, "status":l[j].status, "dateOfLeave":l[j].dateOfLeave, "HodComment":l[j].HodComment});
                        }
                    }
                }
               
            }
            res.json(total);
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

    HodRouter.route('/viewSickLeaveReq')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});

            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.josn({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }
            //get the department
            //show all leave requests for members in this department
            const d = await department.findOne(
                {
                    name: ufound.department
                });
            var l;
            var a;
            var m;
            var total = [];
            for (i = 0; i < d.teachingAssistants.length; i++) {
                a = await academicMember.findOne({ _id: d.teachingAssistants[i] });
                m = await members.findOne({ _id: a.Memberid });
                l = await Leaves.find({ StaffID: m._id });
                for (j = 0; j < l.length; j++) {
                    if (l[j] != null) {
                        if (l[j].Leavetype == "Sick") {
                            total.push({"name":m.name, "id":m.id,"requestID":l[j].requestID,"Leavetype":l[j].Leavetype, "document":l[j].document, "status":l[j].status, "dateOfLeave":l[j].dateOfLeave, "dateOfdocument":l[j].dateOfdocument, "HodComment":l[j].HodComment});
                        }
                    }
                }
            }
            for (i = 0; i < d.instructors.length; i++) {
                a = await academicMember.findOne({ _id: d.instructors[i] });
                m = await members.findOne({ _id: a.Memberid });
                l = await Leaves.find({ StaffID: m._id });
                for (j = 0; j < l.length; j++) {
                    if (l[j] != null) {
                        if (l[j].Leavetype == "Sick") {
                            total.push({"name":m.name, "id":m.id,"requestID":l[j].requestID, "Leavetype":l[j].Leavetype, "document":l[j].document,"status": l[j].status, "dateOfLeave":l[j].dateOfLeave, "dateOfdocument":l[j].dateOfdocument, "HodComment":l[j].HodComment});
                        }
                    }
                }
               
            }
            res.json(total);
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });


HodRouter.route('/acceptDayOffReq/:reqID')
    .put(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            // const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});

            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }
            //get the department
            //verify that there is a request with this id
            //change the status to accepted
            //change the dayoff in the member profile
            else {
                const dep = ufound.department;
                const dayoffreq = await dayOffReq.findOne(
                    {
                        requestID: req.params.reqID
                    });
                if (dayoffreq.requestID == null) {
                    return res.status(401).json({msg:"This request does not exist"});
                }
                var u = await dayOffReq.findOneAndUpdate(
                    {
                        requestID: req.params.reqID
                    },
                    {
                        status: "Accepted"
                    },
                    {
                        seen : false
                    }
                    )
                var a = await academicMember.findOne(
                    {
                        _id: u.memberID
                    });
                var m = await members.findOne(
                    {
                        _id: a.Memberid
                    });
                if (a.department != dep) {
                    return res.status(401).json({msg:"This user is not in your department"});
                }
                m.dayOff = dayoffreq.requestedDay;
                await m.save();

                res.json({msg:"Request changed successfully"})
            }
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

HodRouter.route('/acceptLeaveReq/:reqID')
    .put(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //   const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});

            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }
            //get the department
            //verify that there is a request with this id
            //change the status to accepted
            //update the missing days accordingly
            const l1 = await Leaves.findOne(
                {
                    requestID: req.params.reqID
                });
            if (l1 == null)
                return res.json({msg:"This request does not exist"});
            const d = await department.findOne(
                {
                    name: ufound.department
                });
            const m = await members.findOne(
                {
                    _id: l1.StaffID
                });
            const miss = await missing.findOne(
                {
                    Memberid: m._id
                });
            if (!(m.id.includes("ac")))
                return res.json({msg:"This request does not belong to an academic member"});
            const a = await academicMember.findOne(
                {
                    Memberid: m._id
                });
            if (a.department != ufound.department)
                return res.json({msg:"This request does not belong to your department"});
            var total = [];
            if (l1 != null) {
                l1.status = "Accepted";
                l1.seen = false;
                await l1.save();
                if (l1.Leavetype == "Compensation") {
                    if (miss.missingDays)
                        miss.missingDays = miss.missingDays - 1;
                    if (miss.remainingDays)
                        miss.remainingDays = miss.remainingDays - 1;
                    await miss.save();
                }
                else {
                    if (l1.Leavetype == "Annual" || l1.Leavetype == "Accidental") {
                        m.AnnualBalance = m.AnnualBalance - m.numberOfdays;
                        await l1.save();
                        if (l1.Leavetype == "Accidental") {
                            if (miss.missingDays && l1.numberOfdays)
                                miss.missingDays = miss.missingDays - l1.numberOfdays;
                            if (miss.remainingDays && l1.numberOfdays)
                                miss.remainingDays = miss.remainingDays - l1.numberOfdays;
                            await miss.save()
                        }

                    }
                    else {
                        if (miss.missingDays && l1.numberOfdays)
                            miss.missingDays = miss.missingDays - l1.numberOfdays;
                        if (miss.remainingDays && l1.numberOfdays)
                            miss.remainingDays = miss.remainingDays - l1.numberOfdays;
                        await miss.save();
                    }
                    if (l1.Leavetype == "Annual") {
                        if (l1.replacementID != null) {
                            //get the replacement request
                            const rep = (await replacementrequest.find({ $and: [{ "memberID": ufound._id }, { "requestedID": replacementID }] }))[0];
                            const repSlot = rep.requestedSlot;
                            const repDate = rep.requestedDay;
                            const nComp = new compensationslot({
                                slot: repSlot,
                                Date: repDate
                            });
                            await nComp.save();
                            console.log("compensation added");
                            const comp = await compensationslot.findOne({ $and: [{ "slot": repSlot }, { "Date": repDate }] });
                            const exSlot = (await academicMember.findById(replacementID)).CompensationSlots;
                            exSlot.push(comp._id);
                            await academicMember.findByIdAndUpdate(replacementID, { "CompensationSlots": exSlot });
                            console.log("compensation added to requested member");
                        }
                    }
                }

            }

            res.json({msg:"Request updated successfully"});
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

   

// HodRouter.route('/acceptLeaveReq/:reqID')
//     .put(async (req, res, next) => {
//         //authenticate that this is a valid member
//         //authorize that this is a Hod member
//         try {
//             const token = req.header('authtoken');
//             const DecodeToken = jwt_decode(token);
//             const currentid = DecodeToken.id;
//             const found = await member.findOne({ id: currentid });
//             const deletedtoken = await DeletedToken.findOne({ token: token });
//             if (deletedtoken) {
//                 res.send("Sorry you are logged out .")
//             }
//             //   const found = await member.findOne({ id: currentid });
//             if (!found)
//                 return res.status(401).send("Not authenticated");

//             const ufound = await academicMember.findOne({ Memberid: found._id });
//             if (!currentid.includes("ac")) {
//                 return res.status(401).send("not authorized");
//             }
//             if (ufound.type != "HeadOfDepartment") {
//                 return res.status(401).send("not authorized");
//             }
//             //get the department
//             //verify that there is a request with this id
//             //change the status to accepted
//             //update the missing days accordingly
//             const l1 = await Leaves.findOne(
//                 {
//                     requestID: req.params.reqID
//                 });
//             if (l1 == null)
//                 return res.status(401).send("This request does not exist");
//             const d = await department.findOne(
//                 {
//                     name: ufound.department
//                 });
//             const m = await members.findOne(
//                 {
//                     _id: l1.StaffID
//                 });
//             const miss = await missing.findOne(
//                 {
//                     Memberid: m._id
//                 });
//             if (!(m.id.includes("ac")))
//                 return res.status(401).send("This request does not belong to an academic member");
//             const a = await academicMember.findOne(
//                 {
//                     Memberid: m._id
//                 });
//             if (a.department != ufound.department)
//                 return res.status(401).send("This request does not belong to your department");
//             var total = [];
//             if (l1 != null) {
//                 l1.status = "Accepted";
//                 await l1.save();
//                 if (l1.Leavetype == "Compensation") {
//                     if (miss.missingDays)
//                         miss.missingDays = miss.missingDays - 1;
//                     if (miss.remainingDays)
//                         miss.remainingDays = miss.remainingDays - 1;
//                     await miss.save();
//                 }
//                 else {
//                     if (l1.Leavetype == "Annual" || l1.Leavetype == "Accidental") {
//                         m.AnnualBalance = m.AnnualBalance - m.numberOfdays;
//                         await l1.save();
//                         if (l1.Leavetype == "Accidental") {
//                             if (miss.missingDays && l1.numberOfdays)
//                                 miss.missingDays = miss.missingDays - l1.numberOfdays;
//                             if (miss.remainingDays && l1.numberOfdays)
//                                 miss.remainingDays = miss.remainingDays - l1.numberOfdays;
//                             await miss.save()
//                         }

//                     }
//                     else {
//                         if (miss.missingDays && l1.numberOfdays)
//                             miss.missingDays = miss.missingDays - l1.numberOfdays;
//                         if (miss.remainingDays && l1.numberOfdays)
//                             miss.remainingDays = miss.remainingDays - l1.numberOfdays;
//                         await miss.save();
//                     }
//                     if (l1.Leavetype == "Annual") {
//                         if (l1.replacementID != null) {
//                             //get the replacement request
//                             const rep = (await replacementrequest.find({ $and: [{ "memberID": ufound._id }, { "requestedID": replacementID }] }))[0];
//                             const repSlot = rep.requestedSlot;
//                             const repDate = rep.requestedDay;
//                             const nComp = new compensationslot({
//                                 slot: repSlot,
//                                 Date: repDate
//                             });
//                             await nComp.save();
//                             console.log("compensation added");
//                             const comp = await compensationslot.findOne({ $and: [{ "slot": repSlot }, { "Date": repDate }] });
//                             const exSlot = (await academicMember.findById(replacementID)).CompensationSlots;
//                             exSlot.push(comp._id);
//                             await academicMember.findByIdAndUpdate(replacementID, { "CompensationSlots": exSlot });
//                             console.log("compensation added to requested member");
//                         }
//                     }
//                 }

//             }

//             res.json("Request updated successfully");
//         }
//         catch (error) {
//             res.status(500).json(
//                 {
//                     error: error.message
//                 })
//         }
//     }); 

   

HodRouter.route('/rejectDayOffReq/:reqID')
    .put(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});

            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }
            //get the department
            //verify that there is a request with this id

            //change the status to rejected
            //get the comment from the body add the comment
            else {
                const dep = ufound.department;
                const dayoffreq = await dayOffReq.findOne(
                    {
                        requestID: req.params.reqID
                    });
                if (dayoffreq == null)
                    return res.json({msg:"This request does not exist"});
                // if (dayoffreq.requestID == null) {
                //     return res.status(401).send("This request does not exist");
                // }
                var a = await academicMember.findOne(
                    {
                        _id: dayoffreq.memberID
                    });
                if (a.department != dep) {
                    return res.json({msg:"This Instructor is not in your department"});
                }
                console.log(req.body.comment)
                if (typeof (req.body.comment) == "string") {
                    const comment = req.body.comment
                    var u= await dayOffReq.findOneAndUpdate({requestID: req.params.reqID}, {status:"rejected"})
                    dayoffreq.status = "rejected";
                    dayoffreq.seen = false;
                    dayoffreq.comment = comment;
                    await dayoffreq.save();


                }
                res.json(dayoffreq)

            }

        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

HodRouter.route('/rejectLeaveReq/:reqID')
    .put(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});

            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }
            //get the department
            //verify that there is a request with this id
            //change the status to rejected
            //get the comment from the body add the comment
            const l1 = await Leaves.findOne(
                {
                    requestID: req.params.reqID
                });
            if (l1 == null)
                return res.json({msg:"This request does not exist"});
            const d = await department.findOne(
                {
                    name: ufound.department
                });

            const m = await members.findOne(
                {
                    _id: l1.StaffID
                });
            if (!(m.id.includes("ac")))
                return res.json({msg:"This request does not belong to an academic member"});
            const a = await academicMember.findOne(
                {
                    Memberid: m._id
                });
            if (a.department != ufound.department)
                return res.json({msg:"This request does not belong to your department"});
            var total = [];

            if (l1 != null) {
                if (req.body.comment == null) {
                    return res.json({msg:"Please enter a comment"});
                }
                if (typeof (req.body.comment) == "string") {
                    console.log(l1)
                    l1.status = "rejected";
                    l1.seen = false;
                    l1.HodComment = req.body.comment;
                    await l1.save();
                }
                res.json({msg:"Request updated successfully"});
            }
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

HodRouter.route('/viewCoverage')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            //  const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});
            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }

            //get the department
            //show all coverages for all courses in this department
            else {
                const dep = ufound.department;
                const depmembers = await department.findOne(
                    {
                        name: dep
                    });
                var depCourses = [];
                var co;
                var result = [];
                for (i = 0; i < depmembers.courses.length; i++) {
                    depCourses.push(depmembers.courses[i]);
                    co = await courses.findOne(
                        {
                            _id: depmembers.courses[i]
                        })
                    if (co != null)
                        result.push({"code":co.code, "coverage":co.coverage});
                }
                res.json(result);
            }
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }

    });

HodRouter.route('/viewSlotAssignments/:cID')
    .get(async (req, res, next) => {
        //authenticate that this is a valid member
        //authorize that this is a Hod member
        try {
            const token = req.header('authtoken');
            const DecodeToken = jwt_decode(token);
            const currentid = DecodeToken.id;
            const found = await member.findOne({ id: currentid });
            const deletedtoken = await DeletedToken.findOne({ token: token });
            if (deletedtoken) {
                res.json({msg:"Sorry you are logged out ."})
            }
            // const found = await member.findOne({ id: currentid });
            if (!found)
                return res.json({msg:"Not authenticated"});
            const ufound = await academicMember.findOne({ Memberid: found._id });
            if (!currentid.includes("ac")) {
                return res.json({msg:"not authorized"});
            }
            if (ufound.type != "HeadOfDepartment") {
                return res.json({msg:"not authorized"});
            }

            //get the department
            //get the course from params
            //show all slots for this course (which accordingly show the academic members assigned)
            else {
                const c = await courses.findOne(
                    {
                        code: req.params.cID
                    });
                if (c === null) {
                    return res.json({msg:"This course does not exist"});
                }
                //const d = await department.findOne({name:ufound.department});

                // for(i=0;i<d.courses.length;i++){


                //     if(c._id !== d.courses[i]){
                //         return res.status(401).send("This course is not in your department");
                //     }
                // }
                var s;
                var c1;
                var c2;
                var loc;
                var all = [];
                for (i = 0; i < c.slots.length; i++) {
                    s = await slot.findOne(
                        {
                            _id: c.slots[i]
                        });
                    if (s != null) {
                        c1 = await academicMember.findOne(
                            {
                                _id: s.memberID
                            });
                        if (c1 != null) {
                            c2 = await members.findOne(
                                {
                                    _id: c1.Memberid
                                });
                            loc = await location.findOne(
                                {
                                    _id: s.location
                                });
                            all.push({"name":c2.name, "id":c2.id, "timing":s.timing, "room":loc.name, "roomType":loc.type, "slotType":s.type});
                        }
                        else {
                            loc = await location.findOne(
                                {
                                    _id: s.location
                                });
                            all.push({"name":null, "id":null, "timing":s.timing,"room": loc.name, "roomType":loc.type, "slotType":s.type});
                        }
                    }
                }
                res.json(all)
            }
        }
        catch (error) {
            res.status(500).json(
                {
                    error: error.message
                })
        }
    });

module.exports = HodRouter;
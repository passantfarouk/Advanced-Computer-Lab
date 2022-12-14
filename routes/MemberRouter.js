const express = require("express");
const { timeStamp } = require("console");
const validator = require("validator");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var authenticate = require("../authenticate");
const jwt_decode = require("jwt-decode");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const key = "shawerma";
const members = require("../models/members");
const location = require("../models/location");
const AM = require("../models/academicMember");
const DeletedToken = require("../models/DeletedTokens");
const attendance = require("../models/attendance");
const Missings = require("../models/missing");
const Leaves = require("../models/Leaves");
const missing = require("../models/missing");

const MemberRouter = express.Router();
MemberRouter.use(bodyParser.json());

MemberRouter.route("/login").post(async (req, res, next) => {
	try {
		//validation
		console.log("helloo");
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ msg: "please enter email or password" });
		}
		if (!validator.isEmail(email)) {
			return res.status(400).send("Please enter a correct email format .");
		}
		const existingUser = await members.findOne({ email: email });
		if (!validator.isEmail(email)) {
			res.send(a);
			return;
		}
		if (!existingUser) {
			return res.status(400).json({ msg: "Not found Member." });
		}

		const isMatched = await bcrypt.compare(password, existingUser.password);
		if (!isMatched) {
			return res.status(400).json({ msg: "inavalid password" });
		}
		const token = jwt.sign({ id: existingUser.id }, key);

		res.header("authtoken", token);
		//res.header("Access-Control-Expose-Headers", "authtoken")
		 const userID = existingUser.id;
		 var type ;
		 console.log(userID);
		 if(userID.includes('hr')){
		     type = "hr" ;
		 }
		 else if(userID.includes('ac')){
		     const existingAM = await AM.findOne({Memberid:existingUser._id});
		    console.log(existingAM)
		     if(existingAM){
		         type = existingAM.type;
		     }
		 }
		  console.log(type)

		return res.json({
			//membertype: existingUser.id.substring(0, 2),
			membertype: type,
			msg: "logged in Successfuly",
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}

	//verify that the needed credentials are given
	//verify that there is a user with the email given in the body
	//if found verify that the password is correct using bcrypt
	//if this is the first login prompt the user to change password
	//use the prompt col in the member table
});

MemberRouter.route("/logout").get(async (req, res, next) => {
	try {
		const token = req.header("authtoken");
		const t = new DeletedToken({ token: token });
		await t.save();
		console.log("You are logged out .");
		res.json({
			msg: "GoodByee",
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
	//verify that the needed credentials are given
	//I think delete the token
});

MemberRouter.route("/viewProfile").get(async (req, res, next) => {
	try {
		const token = req.headers.authtoken;
		const DecodeToken = jwt_decode(token);
		const id = DecodeToken.id;
		const existingUser = await members.findOne({ id: id });
		const deletedtoken = await DeletedToken.findOne({ token: token });
		const info = [];
		// console.log("Helloo" + existingUser)
		if (deletedtoken) {
			res.send("Sorry you are logged out .");
		} else {
			if (!existingUser) {
				res.send("not Authenticated");
			}
			let miss = await missing.findOne({ Memberid: existingUser._id });
			var mSalary = (await members.findById(existingUser._id)).salary;
			var originalSalary = mSalary;
			if (miss != null) {
				var missingDays = miss.missingDays;
				var missingHours = miss.missingHours;
				var dayDed = missingDays * (mSalary / 60);
				let hourDed = 0;
				let minDed = 0;
				if (missingHours >= 3) {
					hourDed = Math.floor(missingHours) * (mSalary / 180);
					minDed =
						(missingHours - Math.floor(missingHours)) *
						60 *
						((mSalary / 180) * 60);
				}
				mSalary = mSalary - dayDed - hourDed - minDed;
				await members.findByIdAndUpdate(existingUser._id, {
					salarySoFar: mSalary,
				});
				console.log("salary deducted");
			}
			const OfficeID = existingUser.officeLocation;
			const OfficeName = await location.findOne({ _id: OfficeID });
			if (id.includes("ac")) {
				const academicMember = await AM.findOne({ Memberid: existingUser._id });

				const course = academicMember.course;
				// console.log(existingUser.name)
				// //console.log(OfficeName.name)
				// console.log(academicMember.faculty)
				// console.log(existingUser.dayOff)
				// console.log(OfficeName.name)
				// console.log(OfficeName.name)
				// console.log(OfficeName.name)

				info.push({
					name: existingUser.name,
					email: existingUser.email,
					faculty: academicMember.faculty,
					department: academicMember.department,
					dayOff: existingUser.dayOff,
					office: OfficeName.name,
					salarySoFar: mSalary,
					salary: originalSalary,
					phoneNumber: existingUser.phoneNumber,
					SecondaryEmail: existingUser.SecondayMail,
					Officehours: academicMember.Officehours,
				});

				res.send(info);
			} else {
				info.push({
					name: existingUser.name,
					email: existingUser.email,
					Office: OfficeName.name,
					salarySoFar: mSalary,
					salary: originalSalary,
					phoneNumber: existingUser.phoneNumber,
					SecondaryEmail: existingUser.SecondayMail,
				});

				res.send(info);
			}
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

MemberRouter.route("/updateProfile").post(async (req, res, next) => {
	try {
		console.log("test test ");
		const NewSecondaryEmail = req.body.NewSecondaryEmail;
		const NewPhonenumber = req.body.NewPhonenumber;
		const NewOfficehours = req.body.NewOfficehours;

		const token = req.header("authtoken");
		const DecodeToken = jwt_decode(token);
		const id = DecodeToken.id;
		const existingUser = await members.findOne({ id: id });
		const deletedtoken = await DeletedToken.findOne({ token: token });
		if (deletedtoken) {
			res.json({
				msg: "Sorry you are logged out ! ",
			});
			return;
		}
		if (!NewSecondaryEmail && !NewPhonenumber && !NewOfficehours) {
			res.json({
				msg: "Please enter data ! ",
			});
			return;
		} else {
			if (!existingUser) {
				res.json({
					msg: "Not authenticated ",
				});
				return;
			}

			if (NewSecondaryEmail) {
				if (!validator.isEmail(NewSecondaryEmail)) {
					res.json({
						msg: "That is not an email ",
					});
					return;
				} else {
					members.updateOne(
						{ id: id },
						{ SecondayMail: NewSecondaryEmail },
						function (err, res) {
							if (err) throw err;
							// console.log("document updated 1");
						}
					);
				}
			}
			if (NewPhonenumber) {
				if (!validator.isMobilePhone(NewPhonenumber)) {
					res.json({
						msg: "this is not a mobile number  ",
					});
					return;
				} else {
					members.updateOne(
						{ id: id },
						{ phoneNumber: NewPhonenumber },
						function (err, res) {
							if (err) throw err;
							// console.log("document updated 2");
						}
					);
				}
			}
			if (id.includes("ac")) {
				if (NewOfficehours) {
					AM.updateOne(
						{ Memberid: existingUser._id },
						{ officeHourse: NewOfficehours },
						function (err, res) {
							if (err) throw err;
							// console.log("document updated 2");
						}
					);
				}
			}
			res.json({
				msg: "Updated Successfully ",
			});
			return;
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
	//authenticate
	//refuse to update name or id
	//check member type;
	//if academic member refuse to update salary, faculty and department.
});

MemberRouter.route("/resetPassword").post(async (req, res, next) => {
	try {
		console.log("3'yrnahaaaa y a5y");
		const token = req.header("authtoken");
		const DecodeToken = jwt_decode(token);
		const id = DecodeToken.id;
		const existingUser = await members.findOne({ id: id });
		const deletedtoken = await DeletedToken.findOne({ token: token });
		if (!existingUser) {
			res.send("Not authenticated .");
			return;
		}
		if (deletedtoken) {
			res.json({
				msg: "Sorry you are logged out .",
			});
			return;
		} else {
			//console.log("hello")
			const NewPassword = req.body.NewPassword;
			if (NewPassword.length < 7) {
				res.json({
					msg: "Password must be atleast 8 characters.",
				});
				return;
			}
			const salt = await bcrypt.genSalt();
			const hasedPassword = await bcrypt.hash(NewPassword, salt);
			if (!existingUser) {
				res.json({
					msg: "Not authenticated",
				});
				return;
			}
			members.updateOne(
				{ id: id },
				{ password: hasedPassword },
				function (err, res) {
					if (err) throw err;
					console.log("document updated");
				}
			);
			members.updateOne({ id: id }, { prompt: false }, function (err, res) {
				if (err) throw err;
				console.log("document updated");
			});
			res.json({
				msg: "Password updated successfully",
			});
			return;
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

//Check Read me
MemberRouter.route("/signIn").post(async (req, res, next) => {
	try {
		// console.log("yarab nd5ol");
		const token = req.header("authtoken");
		const DecodeToken = jwt_decode(token);
		const id = DecodeToken.id;
		const existingUser = await members.findOne({ id: id });
		const today = new Date();
		const deletedtoken = await DeletedToken.findOne({ token: token });
		if (!existingUser) {
			res.send("Not authenticated .");
			return;
		}
		if (deletedtoken) {
			res.send("Sorry you are logged out .");
			return;
		}

		var signIns = await attendance.findOne({
			Memberid: existingUser,
			signOut: undefined,
		});
		if (signIns) {
			attendance.updateOne(
				{ _id: signIns._id },
				{ signIns: today, signOut: undefined },
				function (err, res) {
					if (err) throw err;
					//console.log("document updated");
				}
			);
			res.json({
				msg: "You have signed in a moment ago !",
			});
			return;
		} else {
			const attended = new attendance({
				Memberid: existingUser._id,
				signIn: today,
			});
			await attended.save();
			res.json({
				msg: "Welcome to the GUC !",
			});
			return;
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
	//does he has to be logged in?
	//authenticate
	//add a record in the attendace collection with the id from params with a new date created once signed in
});

MemberRouter.route("/signOut").post(async (req, res, next) => {
	try {
		console.log("hnd5ol wla ehh");
		const token = req.header("authtoken");
		const DecodeToken = jwt_decode(token);
		const id = DecodeToken.id;
		const existingUser = await members.findOne({ id: id });
		var existingID = await attendance.find({
			Memberid: existingUser._id,
			signIn: { $ne: null },
		});
		//console.log(existingID)
		const SignOutDate = new Date();
		const deletedtoken = await DeletedToken.findOne({ token: token });
		var Notfound = false;
		if (!existingUser) {
			res.send("Not authenticated .");
			return;
		}
		if (deletedtoken) {
			res.send("Sorry you are logged out .");
			return;
		}
		//console.log(existingID.length)

		var SpentHours;
		var SpentMin;
		var finalDuration;

		for (i = 0; i < existingID.length; i++) {
			// console.log(existingID)

			var correspondingSignIn = existingID[i].signIn;
			var correspondingSignInHours = correspondingSignIn.getHours();
			var correspondingSignInMinutes = correspondingSignIn.getMinutes();

			var correspondingSignOutHour = SignOutDate.getHours();
			var correspondingSignOutMin = SignOutDate.getMinutes();
			if (correspondingSignOutHour > 21) {
				var time = new Date("1995-12-17T21:00:00");
				var timeHour = time.getHours();
				finalDuration = timeHour - correspondingSignInHours;
			} else {
				SpentHours = correspondingSignOutHour - correspondingSignInHours;
				SpentMin = (correspondingSignOutMin - correspondingSignInMinutes) / 60;
				if (SpentMin < 0) {
					SpentMin = SpentMin / -1;
				}
				finalDuration = SpentMin + SpentHours;
			}

			attendance.updateOne(
				{ _id: existingID[i]._id },
				{ duration: finalDuration },
				function (err, res) {
					if (err) throw err;
				}
			);

			var correspondingSignInDay = correspondingSignIn.getDate();
			var correspondingSignInMonth = correspondingSignIn.getMonth();
			var correspondingSignOutDay = SignOutDate.getDate();
			var correspondingSignOutMonth = SignOutDate.getMonth();
			var MemberID = existingID[i].Memberid;

			if (
				correspondingSignInDay === correspondingSignOutDay &&
				correspondingSignInMonth === correspondingSignOutMonth &&
				(existingID[i].signOut === undefined || existingID[i].signOut === null)
			) {
				var existingObjectID = await attendance.find({
					Memberid: existingUser._id,
					signOut: undefined,
				});
				attendance.updateOne(
					{ _id: existingObjectID },
					{ signOut: SignOutDate },
					function (err, res) {
						if (err) throw err;
						// console.log("document updated 2");
					}
				);
				Notfound = true;
			}
		}
		if (Notfound == false) {
			console.log("d5lt " + i);
			const attended = new attendance({
				Memberid: existingUser._id,
				signOut: SignOutDate,
			});
			await attended.save();
		}

		res.json({
			msg: "GoodBye :) ",
		});
		return;
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

MemberRouter.route("/viewAllAttendance").get(async (req, res, next) => {
	try {
		const token = req.header("authtoken");
		const DecodeToken = jwt_decode(token);
		const id = DecodeToken.id;
		const deletedtoken = await DeletedToken.findOne({ token: token });
		const existingUser = await members.findOne({ id: id });

		if (!existingUser) {
			res.send("Not autheticated ");
			return;
		}
		if (deletedtoken) {
			res.send("Sorry you are logged out .");
			return;
		} else {
			const AttendanceRecord = await attendance.find({
				Memberid: existingUser._id,
			});
			console.log(AttendanceRecord);
			res.send(AttendanceRecord);
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}

	//authenticate
	//get all the records with the id from params
});

MemberRouter.route("/viewAttendanceByMonth/:month").get(
	async (req, res, next) => {
		try {
			// console.log("D5lna")
			// console.log(req.params.month)
			const month = req.params.month;

			console.log(month);
			const token = req.header("authtoken");
			console.log(token);

			const DecodeToken = jwt_decode(token);
			//  console.log()

			const id = DecodeToken.id;
			// console.log("d5l wla eh ")

			const existingUser = await members.findOne({ id: id });
			//  console.log(existingUser)
			const deletedtoken = await DeletedToken.findOne({ token: token });
			const allMonths = [
				"January",
				"February",
				"March",
				"April",
				"May",
				"June",
				"July",
				"August",
				"September",
				"October",
				"November",
				"December",
			];
			const allMonth = [
				"january",
				"february",
				"march",
				"april",
				"may",
				"june",
				"july",
				"august",
				"september",
				"october",
				"november",
				"december",
			];
			const wantedIndex = allMonths.indexOf(month);
			const wantedIndex2 = allMonth.indexOf(month);
			console.log(wantedIndex);
			console.log(wantedIndex2);

			if (!existingUser) {
				res.json({ msg: "Not Authenticated" });
				return;
			}
			if (deletedtoken) {
				res.json({ msg: "You are logged out !" });
				return;
			}
			if (wantedIndex == -1 && wantedIndex2 == -1) {
				res.json({ msg: "Enter a Month" });
			} else {
				const existingUser = await members.findOne({ id: id });
				const AttendanceRecord = await attendance.find({
					Memberid: existingUser._id,
				});
				var WantedRecords = new Array();
				for (i = 0; i < AttendanceRecord.length; i++) {
					if (AttendanceRecord[i].signOut) {
						if (
							AttendanceRecord[i].signOut.getMonth() == wantedIndex ||
							AttendanceRecord[i].signOut.getMonth() == wantedIndex2
						) {
							//console.log("here")
							WantedRecords.push(AttendanceRecord[i]);
						}
					}
				}
				res.json({
					WantedRecords,
				});
			}
		} catch (error) {
			res.status(500).json({ err: error.message });
		}
	}
);

MemberRouter.route("/viewMissingDays").get(async (req, res, next) => {
	//authenticate
	try {
		const token = req.header("authtoken");
		const DecodeToken = jwt_decode(token);
		const id = DecodeToken.id;
		const existingUser = await members.findOne({ id: id });
		const deletedtoken = await DeletedToken.findOne({ token: token });
		var TheAbsentDays = [];

		console.log("faraaaah");
		if (deletedtoken) {
			res.send("you are logged out.");
			return;
		}
		//get all the records with the id from token
		var GetAttendeddays = await attendance.find({ Memberid: existingUser._id });
		//console.log(GetAttendeddays);

		if (!existingUser) {
			res.send("Not authenticated ");
			return;
		}

		const currentMonth = new Date().getMonth();
		const currentYear = new Date().getFullYear();
		const startDate = new Date(currentYear, currentMonth, 11);
		const finishDate = new Date(currentYear, currentMonth + 1, 10);
		var numberOfDaysInMonth = 0;

		// checking if the month is 31 30 or 29 days
		if (currentMonth == 1) {
			numberOfDaysInMonth = 18;
		}
		if (
			currentMonth == 0 ||
			currentMonth == 2 ||
			currentMonth == 4 ||
			currentMonth == 6 ||
			currentMonth == 7 ||
			currentMonth == 9 ||
			currentMonth == 11
		) {
			numberOfDaysInMonth = 20;
		}
		if (
			currentMonth == 3 ||
			currentMonth == 5 ||
			currentMonth == 8 ||
			currentMonth == 10
		) {
			numberOfDaysInMonth = 19;
		}

		var monthAttendance = [];
		var daysOftheMonth = [];
		//filling days of the month from 11 of this month till the 10th of the coming month .
		for (i = 0; i < numberOfDaysInMonth; i++) {
			//console.log("ay 7aga");
			daysOftheMonth.push(new Date(currentYear, currentMonth, 12 + i));
		}
		for (i = 1; i <= 11; i++) {
			//console.log(new Date(currentYear,currentMonth+1,i));
			daysOftheMonth.push(new Date(currentYear, currentMonth + 1, i));
		}
		//console.log(daysOftheMonth);
		// getting all records from the member from 11 of this month till 10 of the following month  .

		//console.log(GetAttendeddays + "get attended days")
		for (let j = 0; j < GetAttendeddays.length; j++) {
			if (GetAttendeddays[j].signIn != null){
			var mon = GetAttendeddays[j].signIn.getMonth();
			//console.log(GetAttendeddays[j].signIn);
			var year = GetAttendeddays[j].signIn.getFullYear();
			var d = GetAttendeddays[j].signIn.getDate() + 1;
			var dateOnly = new Date(year, mon, d);
			//console.log(dateOnly);
			if (
				dateOnly.getTime() >= startDate.getTime() &&
				dateOnly.getTime() <= finishDate.getTime()
			) {
				monthAttendance.push(GetAttendeddays[j]);
			} else if (GetAttendeddays[j].signIn.getTime() > finishDate.getTime()) {
				break;
				//to avoid getting not needed data
			}
		}
		}
		console.log("monthAttendance")
		var current;
		var uniqueDays = 0;
		var UniqueAttendenceDays = [];

		//getting unique records attendence for this member .
		for (i = 0; i < monthAttendance.length; i++) {
			if (monthAttendance[i].signIn != undefined) {
				if (current == null) {
					current = monthAttendance[i].signIn;
					UniqueAttendenceDays.push(monthAttendance[i]);
					uniqueDays++;
				} else if (current.getDate() != monthAttendance[i].signIn.getDate()) {
					//  console.log(monthAttendance[i] )
					current = monthAttendance[i].signIn;
					UniqueAttendenceDays.push(monthAttendance[i]);
					uniqueDays++;
				}
				//else this is the same day but different sign in time
			}
		}
		 console.log("taniiii console ");

		var numberOfmissingDays = 0;
		//  console.log("taleeet console "+UniqueAttendenceDays);

		//getting the days with no sign Outs
		for (i = 0; i < UniqueAttendenceDays.length; i++) {
			if (
				UniqueAttendenceDays[i].signOut == null ||
				UniqueAttendenceDays[i].signOut == undefined
			) {
				//   console.log(UniqueAttendenceDays[i])
				TheAbsentDays.push({ i: UniqueAttendenceDays[i] });
				numberOfmissingDays++;
			}
		}
		//console.log(TheAbsentDays);
		// console.log("taleeet console "+UniqueAttendenceDays);

		//getting all the days he missed even if dayOff and fridays
		console.log("daysOftheMonth")
		var daysMissed = [];
		for (i = 0; i < daysOftheMonth.length; i++) {
			var found = false;
			for (let y = 0; y < UniqueAttendenceDays.length; y++) {
				const y2 = UniqueAttendenceDays[y].signIn.getFullYear();
				console.log(UniqueAttendenceDays[y].signIn);
				const m2 = UniqueAttendenceDays[y].signIn.getMonth();
				
				const d2 = UniqueAttendenceDays[y].signIn.getDate() + 1;
				const dOnly2 = new Date(y2, m2, d2);
				if (dOnly2.getTime() == daysOftheMonth[i].getTime()) {
					found = true;
				}
			}
			if (found == false) {
				daysMissed.push(daysOftheMonth[i]);
			}
		}

		const MemberDayOff = existingUser.dayOff;
		var DayOffnumber = 0;
		if (MemberDayOff == "Sunday") {
			DayOffnumber = 0;
		} else if (MemberDayOff == "Monday") {
			DayOffnumber = 1;
		} else if (MemberDayOff == "Tuesday") {
			DayOffnumber = 2;
		} else if (MemberDayOff == "Wednesday") {
			DayOffnumber = 3;
		} else if (MemberDayOff == "Thursday") {
			DayOffnumber = 4;
		} else if (MemberDayOff == "Friday") {
			DayOffnumber = 5;
		} else if (MemberDayOff == "Saturday") {
			DayOffnumber = 6;
		}
		// getting the days he/she did not attend filtered from fridays and daysOff
		for (i = 0; i < daysMissed.length; i++) {
			console.log(daysMissed[i].getDay());
			if (
				daysMissed[i].getDay() != 5 &&
				daysMissed[i].getDay() != DayOffnumber
			) {
				//console.log(daysMissed[i].getDay() );
				//console.log(daysMissed[i]);
				numberOfmissingDays++;
				TheAbsentDays.push({ i: daysMissed[i] });
			}
		}

		//if a member was not found with a record it will create a new record and add it to missings else it will only update the missing days
		const FoundMember = await missing.findOne({ Memberid: existingUser._id });
		if (!FoundMember) {
			const NewRecord = new Missings({
				Memberid: existingUser._id,
				missingDays: numberOfmissingDays,
			});
			await NewRecord.save();
		} else {
			missing.updateOne(
				{ Memberid: existingUser._id },
				{ missingDays: numberOfmissingDays },
				function (err, res) {
					if (err) throw err;
					console.log("document updated 1");
				}
			);
		}
		console.log("d5lnaa w 5lsna");
		res.json({ TheAbsentDays });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

MemberRouter.route("/viewHours").get(async (req, res, next) => {
	try {
		console.log("d5lna");
		const token = req.header("authtoken");
		const DecodeToken = jwt_decode(token);
		const id = DecodeToken.id;
		const existingUser = await members.findOne({ id: id });
		const deletedtoken = await DeletedToken.findOne({ token: token });
		const existingID = await attendance.find({ Memberid: existingUser._id });

		if (!existingUser) {
			res.send("Not authenticated ");
			return;
		}
		if (deletedtoken) {
			res.send("you are logged out.");
			return;
		} else {
			var SpentHour = 0;
			var HoursMissing = 0;
			var Extrahours = 0;
			for (i = 0; i < existingID.length; i++) {
				//console.log(existingID[i].duration);
				SpentHour = SpentHour + existingID[i].duration;
				//console.log(SpentHour)
			}
			HoursMissing = 180 - SpentHour;
			if (HoursMissing < 0) {
				HoursMissing = 0;
			}
			if (SpentHour > 180) {
				Extrahours = SpentHour - 180;
			}
			//    console.log(SpentHour)
			//    console.log(HoursMissing)
			//    console.log(Extrahours)
			const FoundRecord = await missing.findOne({ Memberid: existingUser._id });
			if (FoundRecord) {
				missing.updateOne(
					{ _id: FoundRecord._id },
					{ SpentHours: SpentHour, MissingHours: HoursMissing },
					function (err, res) {
						if (err) throw err;
						//  console.log("document updated 1");
					}
				);
			} else {
				const Missing = new Missings({
					Memberid: existingUser._id,
					SpentHours: SpentHour,
					MissingHours: HoursMissing,
					ExtraHours: Extrahours,
				});
				await Missing.save();
			}
		}
		const info = [];
		info.push({
			SpentHours: SpentHour,
			MissingHours: HoursMissing,
			ExtraHour: Extrahours,
		});

		res.json(info);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = MemberRouter;

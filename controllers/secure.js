"use strict";

const log = require("../helpers/logging");

const Subject = require("../models/subject");
const s3 = require("../helpers/s3");
const questionsJSON = require("../models/questions.json");
const Question = require("../models/questions");

module.exports.index = function* index() {
	// error checking
	if (!this.session.email || !this.session.token) {
		return this.throw(403, "You must be authenticated");
	}
	const subject = yield Subject.getSubject(this.session.email);
	if (subject.error === true) {
		return this.throw(400, "You must be enrolled in the study");
	}
	if (subject.token !== this.session.token) {
		return this.throw(401, "Bad credentials");
	}
	// proceed with logic
	yield this.render("secure/index");
};

module.exports.experiment = function* experiment() {
	// error checking
	if (!this.session.email || !this.session.token) {
		return this.throw(403, "You must be authenticated");
	}
	const subject = yield Subject.getSubject(this.session.email);
	if (subject.error === true) {
		return this.throw(400, "You must be enrolled in the study");
	}
	if (subject.token !== this.session.token) {
		return this.throw(401, "Bad credentials");
	}
	if (subject.stage !== 2) {
		return this.throw(400, "You are not able to view this content");
	}
	const video = s3.getURL("storefront-trigger-video-3931.mp4");
	// proceed with logic
	log.info(`${subject.id} viewed experiment`);
	yield this.render("secure/experiment", {
		script: "secure/experiment",
		video: video
	});
};

module.exports.questions = function* questions() {
	// error checking
	if (!this.session.email || !this.session.token) {
		return this.throw(403, "You must be authenticated");
	}
	if (this.session.answered === true) {
		return this.throw(400, "You have already answered the questionnaire");
	}
	const subject = yield Subject.getSubject(this.session.email);
	if (subject.error === true) {
		return this.throw(400, "You must be enrolled in the study");
	}
	if (subject.token !== this.session.token) {
		return this.throw(401, "Bad credentials");
	}
	if (subject.stage !== 2) {
		return this.throw(400, "You are not able to view this content");
	}
	// proceed with logic
	log.info(`${subject.id} viewed questions`);
	yield this.render("secure/questions", {
		script: "secure/questions",
		questions: questionsJSON
	});
};

module.exports.questionsSubmit = function* questionsSubmit() {
	// some basic error checking
	if (!this.session.email || !this.session.token) {
		return this.throw(403, "You must be authenticated");
	}
	if (this.session.answered === true) {
		return this.throw(400, "You have already answered the questionnaire");
	}
	const subject = yield Subject.getSubject(this.session.email);
	if (subject.error === true) {
		return this.throw(400, "You must be enrolled in the study");
	}
	if (subject.token !== this.session.token) {
		return this.throw(401, "Bad credentials");
	}
	if (subject.stage !== 2) {
		return this.throw(400, "You are not able to view this content");
	}
	// loop through each ID of each answer they provided and make sure it's valid
	for (const answer in this.request.body) {
		// if this isn't a valid id, bounce them
		if (Question.isValidQuestion(answer) !== true) {
			return this.throw(406, "All questions must be valid");
		}
		if (Question.isValidAnswer(answer, this.request.body[answer]) !== true) {
			return this.throw(406, "All answers must be valid");
		}
	}
	// actually save the results
	const document = yield Question.saveAllAnswers(this.session.id, this.request.body);
	if (document.error === true) {
		return this.throw(500, "Something went wrong saving your questions");
	}
	// save answered to session.
	this.session.answered = true;
	// return result
	log.info(`${subject.id} answered questions`);
	yield this.render("secure/questions_success", {});
};

module.exports.phone = function* phone() {
	// error checking
	if (!this.session.email || !this.session.token) {
		return this.throw(403, "You must be authenticated");
	}
	if (this.session.answered !== true) {
		return this.throw(400, "You have already answered the questionnaire");
	}
	const subject = yield Subject.getSubject(this.session.email);
	if (subject.error === true) {
		return this.throw(400, "You must be enrolled in the study");
	}
	if (subject.token !== this.session.token) {
		return this.throw(401, "Bad credentials");
	}
	if (subject.stage !== 2) {
		return this.throw(400, "You are not able to view this content");
	}
	// proceed with logic
	yield this.render("secure/phone", {
		script: "secure/phone"
	});
};

module.exports.phoneSubmit = function* phoneSubmit() {
	// error checking
	if (!this.session.email || !this.session.token) {
		return this.throw(403, "You must be authenticated");
	}
	if (this.session.answered !== true) {
		return this.throw(400, "You have already answered the questionnaire");
	}
	const subject = yield Subject.getSubject(this.session.email);
	if (subject.error === true) {
		return this.throw(400, "You must be enrolled in the study");
	}
	if (subject.token !== this.session.token) {
		return this.throw(401, "Bad credentials");
	}
	if (subject.stage !== 2) {
		return this.throw(400, "You are not able to view this content");
	}
	if (!this.request.body.sf_phone_number) {
		return this.throw(400, "You must provide a phone number");
	}
	// super basic checking for the phone number because i'm tired
	if (this.request.body.sf_phone_number.length !== 14) {
		return this.throw(400, "You must provide a valid phone number");
	}
	// all error checks pass
	const document = yield Subject.setPhoneNumber(this.session.email, this.request.body.sf_phone_number);
	if (document.error === true) {
		return this.throw(500, document.message);
	}
	// return result
	log.info(`${subject.id} gave us their phone number`);
	yield this.render("secure/phone_success", {});
};

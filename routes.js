"use strict";

const config = require("./config.json");

const app = require("./index.js").app;
const passport = require("./index.js").passport;
const Router = require("koa-router");

const routes = new Router();

const main = require("./controllers/main.js");

// routes
routes.get("/", main.index);
routes.get("/about_us", main.aboutUs);
routes.get("/contact_us", main.contactUs);
routes.get("/jobs", main.jobs);
routes.get("/sign_up", main.signUp);
routes.get("/login", main.login);

app.use(routes.middleware());

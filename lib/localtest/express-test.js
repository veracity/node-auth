"use strict";
/*
Installed deps for this test:
express
express-session
passport
body-parser
node-forge
@types/node-forge
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = require("express-session");
const https_1 = __importDefault(require("https"));
const generateCerts_1 = require("./testhelpers/generateCerts");
const setupAuthFlowStrategy_1 = require("../helpers/setupAuthFlowStrategy");
const app = express_1.default();
setupAuthFlowStrategy_1.setupAuthFlowStrategy({
    appOrRouter: app,
    loginPath: "/login",
    strategySettings: {
        clientId: "3e6d5154-57c6-4fb2-a591-1f51b6c7739e",
        clientSecret: "2B:]tC]R/1P;aQD-",
        redirectUri: "https://localhost:3000/auth/oidc/loginreturn"
    },
    sessionSettings: {
        secret: "secret-secret-secret-secret",
        store: new express_session_1.MemoryStore()
    },
    onLoginVerifier: (options, done) => { done(null, options); },
    onLoginComplete: (req, res, next) => {
        console.log("auth completed");
        res.redirect("/data");
    }
});
/*
app.use(session(makeSessionConfigObject({
    secret: createUid(),
    store: new MemoryStore()
})))
app.use(passport.initialize())
app.use(passport.session())
passport.use("veracity", new VeracityAuthFlowStrategy<{}>({
    tenantId: "ed815121-cdfa-4097-b524-e2b23cd36eb6",
    policy: "b2c_1a_signinwithadfsidp",

    clientId: "fe3af7fd-b3e9-4485-a4fc-edcb675b1ed4",
    clientSecret: "\\QCI13Q~~#e7LGKh4pz~*G}(",
    redirectUri: "https://localhost:3000/auth/oidc/loginreturn"
}, (options, done) => {
    console.log("VERIFIER", options)
    done(null, options)
}))

passport.serializeUser((user, done) => {
    done(null, user)
})
passport.deserializeUser((id, done) => {
    done(null, id)
})*/
app.get("/", (req, res) => {
    res.send("ok");
});
app.get("/data", (req, res) => {
    res.send({
        user: req.user
    });
});
const server = https_1.default.createServer({
    ...generateCerts_1.generateCerts()
}, app);
server.on("error", (error) => {
    console.error(error);
    process.exit(1);
});
server.listen(3000, () => {
    console.log("Listening");
});

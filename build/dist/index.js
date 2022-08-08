"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const TwitterStrategy = require('passport-twitter');
const GitHubStrategy = require('passport-github');
const cookieParser = require('cookie-parser');
const User_1 = __importDefault(require("./User"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
mongoose_1.default.connect(`${process.env.START_MONGODB}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}${process.env.END_MONGODB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, () => {
    console.log("Connected to mongoose successfully");
});
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());
app.use((0, express_session_1.default)({
    secret: "secretcode",
    resave: true,
    saveUninitialized: true
    // cookie: {
    //   sameSite: "none",
    //   secure: true,
    //   maxAge: 1000 * 60 * 60 * 24 * 7 // One Week
    // }
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// should only store ids
passport_1.default.serializeUser((user, done) => {
    return done(null, user._id);
});
// should only store ids
passport_1.default.deserializeUser((id, done) => {
    User_1.default.findById(id, (err, doc) => {
        console.log(doc, "<------- doc from deserialize");
        return done(null, doc);
    });
});
// ________________________________Google Strategy
passport_1.default.use(new GoogleStrategy({
    clientID: `${process.env.CLIENT_ID}`,
    clientSecret: `${process.env.CLIENT_SECRET}`,
    callbackURL: '/oauth2/redirect/google',
    scope: ['profile'],
    state: true
}, function verify(accessToken, refreshToken, profile, cb) {
    console.log("verify function running");
    User_1.default.findOne({ googleId: profile.id }, (err, doc) => __awaiter(this, void 0, void 0, function* () {
        console.log("Mongo Function Firing!");
        if (err) {
            return cb(err, null);
        }
        console.log("No err!");
        if (!doc) {
            //create a record
            const newUser = new User_1.default({
                googleId: profile.id,
                username: profile.displayName
            });
            yield newUser.save();
            cb(null, newUser);
            console.log("newUser saved<------");
        }
        else {
            cb(null, doc);
        }
    }));
    console.log(profile, "<---------profile--------");
}));
// ________________________________Instagram Strategy
passport_1.default.use(new InstagramStrategy({
    clientID: `${process.env.INSTAGRAM_ID}`,
    clientSecret: '${process.env.INSTAGRAM_SECRET}',
    callbackURL: "/oauth2/redirect/instagram"
}, function (accessToken, refreshToken, profile, done) {
    // User.findOne({googleId: profile.id}, async (err: Error, doc: IUser) => {
    //   console.log("Mongo Function Firing!")
    //   if(err){
    //     return done(err, null);
    //   }
    //   console.log("No err!")
    //   if(!doc){
    //     //create a record
    //     const newUser = new User({
    //       instagramId: profile.id,
    //       username: profile.displayName
    //     });
    //     await newUser.save();
    //     console.log("newUser saved<------")
    //   }
    // })
    console.log(profile, "<---------profile--------");
    done(null, profile);
}));
// ________________________________Twitter Strategy
passport_1.default.use(new TwitterStrategy({
    consumerKey: `${process.env.TWITTER_ID}`,
    consumerSecret: `${process.env.TWITTER_SECRET}`,
    callbackURL: "/oauth2/redirect/twitter"
}, function (token, tokenSecret, profile, cb) {
    console.log(profile, "<---------profile--------");
    User_1.default.findOne({ twitterId: profile.id }, (err, doc) => __awaiter(this, void 0, void 0, function* () {
        console.log("Mongo Function Firing!");
        if (err) {
            return cb(err, null);
        }
        console.log("No err!");
        if (!doc) {
            //create a record
            const newUser = new User_1.default({
                twitterId: profile.id,
                username: profile.displayName
            });
            yield newUser.save();
            cb(null, newUser);
            console.log("newUser saved<------");
        }
        else {
            cb(null, doc);
        }
    }));
}));
// ________________________________GitHub Strategy
passport_1.default.use(new GitHubStrategy({
    clientID: `${process.env.GITHUB_ID}`,
    clientSecret: `${process.env.GITHUB_SECRET}`,
    callbackURL: "/oauth2/redirect/github",
    state: true
}, function (accessToke, refreshToken, profile, cb) {
    console.log(profile, "<---------profile--------");
    console.log(profile.id, " <----- profile.id");
    User_1.default.findOne({ githubId: profile.id }, (err, doc) => __awaiter(this, void 0, void 0, function* () {
        console.log("Mongo Function Firing!");
        if (err) {
            return cb(err, null);
        }
        console.log("No err!");
        if (!doc) {
            console.log("create user firing");
            //create a record
            const newUser = new User_1.default({
                githubId: profile.id,
                username: profile.displayName
            });
            yield newUser.save();
            cb(null, newUser);
            console.log("newUser saved<------");
        }
        console.log(doc, " <-------- doc");
        cb(null, doc);
    }));
}));
// ------------------------------------- ROUTES ------------------------
// -------Google 
app.get('/login/google', passport_1.default.authenticate('google', { scope: ['profile'] }));
app.get('/oauth2/redirect/google', passport_1.default.authenticate('google', { failureRedirect: '/', failureMessage: true }), function (req, res) {
    res.redirect('http://localhost:3000');
});
// --------- Insta
app.get('/login/instagram', passport_1.default.authenticate('instagram', { scope: ['profile'] }));
app.get('/oauth2/redirect/instagram', passport_1.default.authenticate('instagram', { failureRedirect: '/', failureMessage: true }), function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('http://localhost:3000');
});
// -------- Twitter  
app.get('/login/twitter', passport_1.default.authenticate('twitter'));
app.get('/oauth2/redirect/twitter', passport_1.default.authenticate('twitter', { failureRedirect: '/', failureMessage: true }), function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('http://localhost:3000');
});
// ------- GitHub  
app.get('/login/github', passport_1.default.authenticate('github'));
app.get('/oauth2/redirect/github', passport_1.default.authenticate('github', { failureRedirect: 'http://localhost:3000/', session: true, failureMessage: true }), function (req, res) {
    console.log("<--------callback from server github");
    // Successful authentication, redirect home.
    res.redirect('http://localhost:3000');
});
app.get("/getuser", (req, res) => {
    // console.log(req, "req from context request");
    if (req.user) {
        res.send(req.user);
    }
    else {
        console.log("no user from /getuser");
    }
});
// app.get("/auth/logout", (req, res) => {
//   req.logOut();
//   if(req.user){
//     res.send("success");
//   }else {
//     console.log(req, "<------- no user");
//   }
// })
app.get('/auth/logout', function (req, res, next) {
    if (req.user) {
        console.log("logout route firing");
        req.logout(function (err) {
            if (err) {
                return next(err);
            }
            res.send("done");
        });
    }
    else {
        throw new Error("User previously logged out.");
    }
});
app.get('/', (req, res) => {
    res.send('Hello f Internet');
});
app.listen(port, () => {
    console.log(`[server]: Server is now ~~~~ running at https://localhost:${port}`);
});
//# sourceMappingURL=index.js.map
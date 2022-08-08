import express, {Express, Request, Response} from 'express';
import dotenv from 'dotenv';
import mongoose, { ConnectOptions } from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const TwitterStrategy = require('passport-twitter');
const GitHubStrategy = require('passport-github');
const cookieParser = require('cookie-parser');

import User from './User';
import {IUser, IMongoDBUser} from './types';

dotenv.config();

const app = express();
const port = process.env.PORT;

mongoose.connect(`${process.env.START_MONGODB}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}${process.env.END_MONGODB}`, { 
  useNewUrlParser: true,
  useUnifiedTopology: true
} as ConnectOptions, () => {
    console.log("Connected to mongoose successfully")
});

app.use(express.json());
app.use(cors({origin:"http://localhost:3000", credentials: true}));
app.use(cookieParser());
app.use(
  session({
    secret: "secretcode",
    resave: true,
    saveUninitialized: true
    // cookie: {
    //   sameSite: "none",
    //   secure: true,
    //   maxAge: 1000 * 60 * 60 * 24 * 7 // One Week
    // }
  })
);
app.use(passport.initialize());
app.use(passport.session());

// should only store ids
passport.serializeUser((user: any, done: any) => {
  return done(null, user._id);
})

// should only store ids
passport.deserializeUser((id: any, done: any) => {
  User.findById(id, (err: Error, doc:any) => {
    console.log(doc, "<------- doc from deserialize");
    return done(null, doc);
  })
  
})

// ________________________________Google Strategy
passport.use(new GoogleStrategy({
    clientID: `${process.env.CLIENT_ID}`,
    clientSecret: `${process.env.CLIENT_SECRET}`,
    callbackURL: '/oauth2/redirect/google',
    scope: [ 'profile' ],
    state: true
  },

  function verify(accessToken: any, refreshToken: any, profile: any, cb: any) {
    console.log("verify function running");
    User.findOne({googleId: profile.id}, async (err: Error, doc: any) => {
      console.log("Mongo Function Firing!")
      if(err){
        return cb(err, null);
      }
      console.log("No err!")
      if(!doc){
        //create a record
        const newUser = new User({
          googleId: profile.id,
          username: profile.displayName
        });
        await newUser.save();
        cb(null, newUser);
        console.log("newUser saved<------")
      } else {
        cb(null, doc);
      }
    })
    console.log(profile, "<---------profile--------")
    }
  ));

// ________________________________Instagram Strategy

passport.use(new InstagramStrategy({
    clientID: `${process.env.INSTAGRAM_ID}`,
    clientSecret: '${process.env.INSTAGRAM_SECRET}',
    callbackURL: "/oauth2/redirect/instagram"
  },
  function(accessToken: any, refreshToken: any, profile: any, done: any) {
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
    
      console.log(profile, "<---------profile--------")
    done(null, profile);
      
  }
));
  
// ________________________________Twitter Strategy

passport.use(new TwitterStrategy({
    consumerKey: `${process.env.TWITTER_ID}`,
    consumerSecret: `${process.env.TWITTER_SECRET}`,
    callbackURL: "/oauth2/redirect/twitter"
  },
  function(token: any, tokenSecret: any, profile: any, cb: any) {
    console.log(profile, "<---------profile--------")

    User.findOne({twitterId: profile.id}, async (err: Error, doc: any) => {
      console.log("Mongo Function Firing!")
      if(err){
        return cb(err, null);
      }
      console.log("No err!")
      if(!doc){
        //create a record
        const newUser = new User({
         twitterId: profile.id,
          username: profile.displayName
        });
        await newUser.save();
        cb(null, newUser);
        console.log("newUser saved<------")
      } else {
        cb(null, doc);
      }
    })
  }
));

// ________________________________GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: `${process.env.GITHUB_ID}`,
    clientSecret: `${process.env.GITHUB_SECRET}`,
    callbackURL: "/oauth2/redirect/github",
    state: true
  },
  function(accessToke: any, refreshToken: any, profile: any, cb: any) {

    User.findOne({githubId: profile.id}, async (err: Error, doc: any) => {
      console.log("Mongo Function Firing!")
      if(err){
        return cb(err, null);
      }
      console.log("No err!")
      if(!doc){
        console.log("create user firing");
        //create a record
        const newUser = new User({
          githubId: profile.id,
          username: profile.displayName
        });
        await newUser.save();
        cb(null, newUser);
        console.log("newUser saved<------")
      } 
      console.log(doc, " <-------- doc");
      cb(null, doc);
      
    })
  }
));


// ------------------------------------- ROUTES ------------------------

// -------Google 

app.get('/login/google', passport.authenticate('google', {scope: ['profile'] }));

app.get('/oauth2/redirect/google',
passport.authenticate('google', { failureRedirect: '/', failureMessage: true }),
function(req, res) {
    res.redirect('http://localhost:3000');
});

// --------- Insta

app.get('/login/instagram', passport.authenticate('instagram', {scope: ['profile'] }));

app.get('/oauth2/redirect/instagram', 
  passport.authenticate('instagram', { failureRedirect: '/', failureMessage: true }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('http://localhost:3000');
  });

// -------- Twitter  
app.get('/login/twitter', passport.authenticate('twitter'));

app.get('/oauth2/redirect/twitter', 
  passport.authenticate('twitter', { failureRedirect: '/', failureMessage: true }),
  function(req, res) {
      // Successful authentication, redirect home.
     res.redirect('http://localhost:3000');
  });

// ------- GitHub  

app.get('/login/github', passport.authenticate('github'));

app.get('/oauth2/redirect/github', 
  passport.authenticate('github', { failureRedirect: 'http://localhost:3000/', session: true , failureMessage: true }),
  function(req, res) {
    console.log("<--------callback from server github")
      // Successful authentication, redirect home.
     res.redirect('http://localhost:3000');
  });

app.get("/getuser", (req, res) => {
  // console.log(req, "req from context request");
  if(req.user){
    res.send(req.user);
  }else{
    console.log("no user from /getuser");
  }
  
})

// app.get("/auth/logout", (req, res) => {
//   req.logOut();
//   if(req.user){
    
//     res.send("success");
  
//   }else {
//     console.log(req, "<------- no user");
//   }
// })

app.get('/auth/logout', function(req, res, next) {
  if(req.user){
    console.log("logout route firing");
    req.logout(function(err) {
      if (err) { return next(err); }
      res.send("done");
    });
  } else {
    throw new Error("User previously logged out.");
  }

});

app.get('/', (req, res) => {
    res.send('Hello f Internet');
  });
  
  app.listen(port, () => {
    console.log(`[server]: Server is now ~~~~ running at https://localhost:${port}`);
  });
  
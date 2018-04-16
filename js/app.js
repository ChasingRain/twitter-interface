const express = require('express');
const app = express();
const Twit = require('twit');
var bodyParser = require('body-parser')
//var parser = require('json-parser');
var config = require('./config.js') //this is we import the config
//file which is a js file which contains the keys ans tokens

var T = new Twit(config); //this is the object of twit which
//will help us to call functions inside it
app.use("/images", express.static('images'))
app.use("/css", express.static('css'))
//app.use(express.bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
//app.use(multer()); // for parsing multipart/form-data

app.set('view engine', 'pug');

let followers=[];
let tweets=[];
let dms=[];
let users=[];
let userScreenName="";
let userPImage="";
let userBGImage="";

function resetVariables(){
  followers=[];
  tweets=[];
  dms=[];
  users=[];
  userName = "";
  userScreenName="";
  userPImage="";
}

function getData(){
  getUserData();
  getFollowers();
  getTweets();
  getDMS();
}

function getUserData(){
  users = [];
  T.get('account/verify_credentials',  function (err, data, response) {
    let user = {};
    userScreenName = data.screen_name;
    userPImage = data.profile_image_url;
    userName = data.name
    user.userBGImage = data.profile_banner_url;
    user.userName = data.name;
    user.userScreenName = data.screen_name;
    user.userPImage = data.profile_image_url;
    users.push(user);
    }
  )
}

let count = 0;
let followerArray;
function runAgain(i){
  followerData(i);
};

function followerData(i){
  T.get('users/show', { user_id: followerArray[i] },  function (err, data, response) {
    if(data.errors >= ""){
      console.log("error")
      i++;
      runAgain(i);
    }else{
      let follower = {}
      let followerData = data;
      follower.name = followerData.name;
      follower.screenName = '@'+followerData.screen_name;
      follower.pImage = followerData.profile_image_url;
      followers.push(follower);
      count++;
      i++;
      console.log(i)
      console.log(count)
      if(count<=4){
        runAgain(i);
      }else {
        return;
      }
    }
  });
}

function getFollowers(){
  followers = [];
  T.get('followers/ids', { screen_name: userScreenName },  function (err, data, response) {
    followerArray = data.ids;
    // for(i=0;i<=5;i++){
    followerData(0);
    // }
  })
}

function getTweets(){
  T.get('statuses/user_timeline', { screen_name: userScreenName, count: 5 },  function (err, data, response) {
    tweets = data;
  })
}

function getDMS(){
  T.get('direct_messages', { count: 5 },  function (err, data, response) {
    dms = data;
  })
}

getData();

app.get('/', (req,res,next) => {
  res.render('index', {
    users: users,
    tweets: tweets,
    followers: followers,
    directMessages: dms,
  });
})

app.post('*', (req,res) => {
  T.post('statuses/update', { status: req.body.tweet }, function(err, data, res) {
  });
  tweets.unshift({
    user: {
      name: userName,
      screen_name: userScreenName,
      profile_image_url: userPImage
    },
    text: req.body.tweet
  });
  res.render('index', {
    users: users,
    tweets: tweets,
    followers: followers,
    directMessages: dms,
  });
})

app.use((req, res, next) => {
  const err = new Error("Uh Oh, Not Found");
  err.status= 404;
  next(err);
})

app.use((err, req, res, next) => {
  res.locals.error = err;
  err.text = 'Looks like there has been an error!';
  res.status(err.status)
  res.render('error',err);
});

app.listen(3000, function () {
console.log("express has started on port 3000");
});

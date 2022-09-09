const express = require("express");
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());

let users = {
  "userRandomID": {
    id: "user1ID",
    email: "user@gmail.com",
    password: "123"
  },
  "user2RandomID": {
    id: "user2ID",
    email: "user2@gmail.com",
    password: "321"
  }
};

const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user2RandomID"
  },
  Osm5xK: {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  }
};

const urlDatabaseMapper = function(database) {
  let obj = {};

  for (const data in database) {
    obj[data] = database[data].longURL;
  }
  return obj;
};

const urlsForUser = function(database, id) {
  const userURLs = {};

  for (const url in database) {
    if (database[url].userID === id) {
      userURLs[url] = database[url].longURL;
    }
  }
  return userURLs;
};



//Default page that shows index page or urls
app.get("/", (req, res) => {
  const urldb = urlDatabaseMapper(urlDatabase);
  const templateVars = {
    urls: urldb,
    user: users[req.cookies["user_id"]]
  };

  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  } else {
    res.render('urls_index', templateVars);
  }
});

//Show our list of urls page
app.get("/urls", (req, res) => {
  const myUrls = urlsForUser(urlDatabase, req.cookies["user_id"]);

  if (req.cookies["user_id"]) {
    const templateVars = {
      urls: myUrls,
      user: users[req.cookies["user_id"]]
    };
    res.render('urls_index', templateVars);
  } else {
    const templateVars = {
      urls: null,
      user: users[req.cookies["user_id"]],
    };
    res.render('urls_index', templateVars);
  }
});


//Create the url
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();

  if (!req.cookies["user_id"]) {
    res.send("Not logged in - please login to shorten URLs.");
  } else {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.cookies["user_id"]
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

//Show the create url page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };

  if (!req.cookies["user_id"]) {
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }
});

//Delete the url
app.post("/urls/:id/delete", (req, res) => {
  const user = req.cookies["user_id"];
  const userUrls = urlsForUser(urlDatabase, req.cookies["user_id"]);
  const databaseOb = urlDatabase[req.params.id];
  
  if (!user) {
    res.status(401).send("You must be logged in to see this page.");
  }
  if (req.cookies["user_id"]) {
    const templateVars = {
      urls: userUrls,
      user: users[req.cookies["user_id"]]
    };
  } 
  if (user === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  } else {
    res.status(404).send("You do not have permision to delete");
  }
  if (!databaseOb) {
    res.status(404).send("URL does not exist");
  }
  if (user !== databaseOb.userID){
    res.status(401).send("You cannot access this.");
  } 

});

//Show information of a specific URL in our JSON
//WHEN I GET BACK - PLEASE FIX THIS SHIT
app.get("/urls/:id", (req, res) => {
  const urldb = urlDatabaseMapper(urlDatabase);
  const user = req.cookies["user_id"];
  const databaseOb = urldb[req.params.id];
  const userUrls = urlsForUser(urlDatabase, req.cookies["user_id"]);
  const templateVars = {
    id: req.params.id,
    longURL: urldb[req.params.id],
    user: users[user]
  };

  // console.log("user:");
  // console.log(user)
  // console.log("DB is:");
  // console.log(urlDatabase[req.params.id].userID);

  if (!user) {
    res.status(401).send("You must be logged in to see this page.");
  }
  if (!databaseOb) {
    res.status(404).send("Short URL does not exist");
  }
  else if (user !== urlDatabase[req.params.id].userID){
    res.status(401).send("You cannot access this.");
  } 
  res.render("urls_show", templateVars);

});

//Update the long URL
app.post("/urls/:id", (req, res) => {
  const urldb = urlDatabaseMapper(urlDatabase);
  urldb[req.params.id] = req.body.longURL;

  res.redirect(`/urls/${req.params.id}`);
});

//Redirect to the long url
app.get("/u/:id", (req, res) => {
  const urldb = urlDatabaseMapper(urlDatabase);
  const longURL = urldb[req.params.id];

  if (!longURL) {
    res.status(404).send("<h1>Short URL does not exist</h1>");
  } else {
    res.redirect(longURL);
  }
});

//Show our urls in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urlsdb.json", (req, res) => {
  const urldb = urlDatabaseMapper(urlDatabase);
  res.json(urldb);
});


app.get("/users.json", (req, res) => {
  res.json(users);
});

//Show our register page
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };

  if (!req.cookies["user_id"]) {
    res.render("urls_register", templateVars);
  } else {
    res.redirect('/urls');
  }
});

//Creates user and cookie session
app.post('/register', (req, res) => {
  const userExists = emailLookup(users, req.body.email);

  // checks if email/password are empty/email registered
  if (!req.body.email || !req.body.password || userExists) {
    res.status(404).send("<h1>Bad Request</h1>");
  } else {
    const newUserID = generateRandomString();
    const newUser = {
      id: newUserID,
      email: req.body.email,
      password: req.body.password
    };
    users[newUserID] = newUser;
    res.cookie('user_id', newUserID);
    res.redirect('/urls');
  }
});

//Go to login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };

  if (!req.cookies["user_id"]) {
    res.render('urls_login', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.post("/login", (req, res) => {
  const userExists = emailLookup(users, req.body.email);

  if (!userExists || users[userExists].password !== req.body.password) {
    res.status(403).send("<h1>Access Forbidden</h1>");
  } else {
    res.cookie('user_id', userExists);
    res.redirect('/urls');
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = function() {
  let randomString = Math.random().toString(36).substring(2, 8);
  return randomString;
};

const emailLookup = function(usersDatabase, email) {
  for (let user in usersDatabase) {
    if (usersDatabase[user].email === email) {
      return user;
    }
  }
  return undefined;
};
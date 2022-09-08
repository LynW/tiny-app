const express = require("express");
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser())
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
}

const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Default page that shows index page or urls
app.get("/", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    user: users[req.cookies["user_id"]] 
  };
  res.render("urls_index", templateVars);
});

//Show our list of urls page
app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    user: users[req.cookies["user_id"]] 
  };
  res.render("urls_index", templateVars);
});

//Create the url
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//Delete the url
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//Show the create url page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render('urls_new', templateVars);
});

//Show information of a specific URL in our JSON
app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

//Update the long URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

//Redirect to the long url
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

//Show our urls in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(users);
});

//Show our register page
app.get("/register", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_register", templateVars);
});

//Creates user and cookie session
app.post('/register', (req, res) => {
  const userExists = emailLookup(users, req.body.email);
  console.log(userExists);
  // checks if email/password are empty/email registered
  if (!req.body.email || !req.body.password || userExists) {
    res.send("400 - Bad Request");
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

app.get("/login", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]]
  };
  res.render('urls_login', templateVars);
});

app.post("/login", (req, res) => {
  const userExists = emailLookup(users, req.body.email);
  if (!userExists || users[userExists].password !== req.body.password) {
    res.send("403 - Access Forbidden");
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

function generateRandomString() {
  let randomString = Math.random().toString(36).substring(2, 8);
  return randomString;
}

const emailLookup = function(usersDatabase, email) {
  for (let user in usersDatabase) {
    if (usersDatabase[user].email === email) {
      return user;
    }
  }
  return false;
};
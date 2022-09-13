const express = require("express");
const app = express();
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const {
  generateRandomString,
  urlsForUser,
  urlDatabaseMapper,
  getUserByEmail,
} = require('./helpers');
const urlDatabase = require('./database.db');
const users = require('./users.db');

app.use(cookieSession({
  name: 'session',
  keys: ['aKey'],
  maxAge: 24 * 60 * 60 * 1000
}));

const PORT = 8080; // default port 8080
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

//Default page that shows index page or urls
app.get("/", (req, res) => {
  const currentUser = req.session.user_id;
  console.log(currentUser);
  const myUrls = urlsForUser(urlDatabase, currentUser);

  if (currentUser) {
    const templateVars = {
      urls: myUrls,
      user: users[currentUser]
    };
    res.render('urls_index', templateVars);
  } else {
    const templateVars = {
      urls: null,
      user: users[currentUser],
    };
    res.render('urls_index', templateVars);
  }
});

//Show our list of urls page
app.get("/urls", (req, res) => {
  const currentUser = req.session.user_id;
  const myUrls = urlsForUser(urlDatabase, currentUser);

  if (currentUser) {
    const templateVars = {
      urls: myUrls,
      user: users[currentUser]
    };
    res.render('urls_index', templateVars);
  } else {
    const templateVars = {
      urls: null,
      user: users[currentUser],
    };
    res.render('urls_index', templateVars);
  }
});


//Create the url
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const currentUser = req.session.user_id;


  if (!currentUser) {
    res.send("Not logged in - please login to shorten URLs.");
    return;
  } else {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: currentUser
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

//Show the create url page
app.get("/urls/new", (req, res) => {
  const currentUser = req.session.user_id;
  const templateVars = {
    user: users[currentUser]
  };

  if (!currentUser) {
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }
});


//Trying to delete from a link
app.post("/urls/:id/delete", (req, res) => {
  const currentUser = req.session.user_id;
  const dbUsers = urlDatabase[req.params.id].userID;

  if (!currentUser) {
    res.status(401).send("You must be logged in to delete.");
    return;
  } else if (!dbUsers) {
    res.status(404).send("URL does not exist");
    return;
  }
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});



//Show information of a specific URL in our JSON
app.get("/urls/:id", (req, res) => {
  const urldb = urlDatabaseMapper(urlDatabase);
  const currentUser = req.session.user_id;
  const databaseOb = urldb[req.params.id];
  const templateVars = {
    id: req.params.id,
    longURL: databaseOb,
    user: users[currentUser]
  };

  if (!currentUser) {
    res.status(401).send("You must be logged in to see this page.");
    return;
  } else if (!databaseOb) {
    res.status(404).send("Short URL does not exist");
    return;
  } else if (currentUser !== urlDatabase[req.params.id].userID) {
    res.status(401).send("You cannot access this.");
    return;
  }

  res.render("urls_show", templateVars);

});

//Update the long URL
app.post("/urls/:id", (req, res) => {
  const urldb = urlDatabaseMapper(urlDatabase);
  urldb[req.params.id] = req.body.longURL;
  
  urlDatabase[req.params.id] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${req.params.id}`);
});

//Redirect to the long url
app.get("/u/:id", (req, res) => {
  const urldb = urlDatabaseMapper(urlDatabase);
  const longURL = urldb[req.params.id];

  if (!longURL) {
    res.status(404).send("<h1>Short URL does not exist</h1>");
    return;
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
  const currentUser = req.session.user_id;
  const templateVars = {
    user: users[currentUser]
  };

  if (!currentUser) {
    res.render("urls_register", templateVars);
  } else {
    res.redirect('/urls');
  }
});

//Creates user and cookie session
app.post('/register', (req, res) => {
  const enteredPass = req.body.password;
  const enteredEmail = req.body.email;
  const userExists = getUserByEmail(users, enteredEmail);
  const hashedPassword = bcrypt.hashSync(enteredPass, 10);

  // checks if email/password are empty/email registered
  if (!enteredEmail || !enteredPass || userExists) {
    res.status(404).send("<h1>Bad Request</h1>");
    return;
  } else {
    const newUserID = generateRandomString();
    users[newUserID] = {
      id: newUserID,
      email: enteredEmail,
      password: hashedPassword
    };
    req.session.user_id = newUserID;
    res.redirect('/urls');
  }
});

//Go to login page
app.get("/login", (req, res) => {
  const currentUser = req.session.user_id;

  if (!currentUser) {
    const templateVars = {
      error: false,
      user: users[currentUser]
    };
    res.render('urls_login', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.post("/login", (req, res) => {
  const userExists = getUserByEmail(users, req.body.email);
  const currentUser = req.session.user_id;
  const enteredPass = req.body.password;
  const templateVars = {
    user: users[currentUser],
    error: true
  };

  if (!userExists) {
    res.render('urls_login', templateVars);
  } else {
    const matchingPass = bcrypt.compareSync(enteredPass, userExists.password);
    if (matchingPass) {
      req.session.user_id = userExists.id;
      res.redirect('/urls');
    } else {
      res.render('urls_login', templateVars);
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
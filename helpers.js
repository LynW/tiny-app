const generateRandomString = function() {
  let randomString = Math.random().toString(36).substring(2, 8);
  return randomString;
};

const getUserByEmail = function(usersDatabase, email) {
  for (let user in usersDatabase) {
    if (usersDatabase[user].email === email) {
      return usersDatabase[user];
    }
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


module.exports = {
  generateRandomString,
  urlsForUser,
  urlDatabaseMapper,
  getUserByEmail,
};
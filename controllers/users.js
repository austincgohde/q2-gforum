const knex = require('../db/knex.js');
const encryption = require("../config/encryption.js");

module.exports = {

  index: (req, res) => {

    if(!req.session.user) {
      req.session.user = {};
    }

    if(!req.session.errMsg) {
      req.session.errMsg = "";
    }

    res.render("index", { errMsg: req.session.errMsg });

  },

  check: (req, res) => {
    knex("users")
      .where("email", req.body.email)
      .then((result) => {
        let user = result[0]
        encryption.check(user, req.body)
          .then((isValid) => {
            if(isValid) {
              req.session.user = {
                id: user.id,
                name: user.first_name,
                auth_level: user.auth_level,
              }
              req.session.save(() => {
                res.redirect("/overview");
              })
            } else {
              req.session.errMsg = "The email and password provided are incorrect. please try again.";
              req.session.save(() => {
                res.redirect("/");
              })
            }
          })
      })
      .catch((err) => {
        console.error(err);
        req.session.errMsg = "The email and password provided are incorrect. Please try again.";
        req.session.save(() => {
          res.redirect("/");
        })
      })
  },

  getRegister: (req, res) => {
    res.render("register");
  },

  create: (req, res) => {
    encryption.hash(req.body)
      .then((encryptedUser) => {
        knex("users")
          .insert({
            first_name: req.body.firstName,
            last_name: req.body.lastName,
            email: req.body.email,
            password: encryptedUser.password,
            cohort_id: req.body.cohort,
            auth_level: 1
          }, "*")
          .then((result) => {
            let user = result[0];

            req.session.user = {
              id: user.id,
              name: user.first_name,
              auth_level: user.auth_level,
            }

            req.session.save(() => {
              res.redirect("/overview")
            })
          })
          .catch((err) => {
            req.session.errMsg = "You have entered invalid info."
            req.session.save(() => {
              res.redirect("/register");
            })
          })
      })
  },

  getOverview: (req, res) => {
    knex.raw(`SELECT posts.title, posts.content, posts.upvote, posts.downvote, users.first_name FROM posts JOIN users ON users.id = posts.user_id JOIN types ON types.id = posts.type_id`)
      .then((result) => {
        let interesting = result.rows;

        knex("types")
          .whereNot("id", 1)
          .then((result) => {

            res.render("overview", { interestings: interesting, types: result, user: req.session.user.name})
          })
      })
  },

  getProfile: (req, res) => {
    knex("users")
      .where("id", req.session.user.id)
      .then((result) => {
        res.render("profile", { user: result[0] })
      })
      .catch((err) => {
        console.error(err);
      })
  },

  updateProfile: (req, res) => {
    if(req.body.currentPassword && req.body.newPassword) {
      knex("users")
        .where("id", req.session.user.id)
        .then((result) => {
          let encryptedUser = result[0];
          let user = {
            password: req.body.currentPassword
          }
          encryption.check(encryptedUser, user)
            .then((isValid) => {
              if(isValid) {

                user.password = req.body.newPassword;
                encryption.hash(user)
                  .then((encryptedUser) => {
                    knex("users")
                      .where("id", req.session.user.id)
                      .update({
                        first_name: req.body.firstName,
                        last_name: req.body.lastName,
                        email: req.body.email,
                        password: encryptedUser.password
                      })
                      .then(() => {
                        res.redirect("/update")
                      })
                  })
              } else {
                req.session.errMsg = "Invalid information. Please try again"
                req.session.save(() => {
                  res.redirect("/update")
                })
              }
            })
        })
    } else {

      knex("users")
        .where("id", req.session.user.id)
        .update({
          first_name: req.body.firstName,
          last_name: req.body.lastName,
          email: req.body.email
        })
        .then(() => {
          res.redirect("/update")
        })
    }
  },

  delProfile: (req, res) => {
    knex("users")
      .where("id", req.session.user.id)
      .del()
      .then(() => {
        req.session.user.id = {};
        req.session.save(() => {
          res.redirect("/")
        })
      })
  }
};

const knex = require('../db/knex.js');
const encryption = require("../config/encryption.js");

//Helps:
 module.exports = {

   getHelp: function(req, res){
     console.log("SOmething shit");
     knex('types')
     .where('name', req.params.type)
     .then((result)=>{
       console.log("Hello");
       console.log(result);
       req.session.type = {
         id: result[0].id,
         name: result[0].name
       };

       if(req.session.type.name.includes("_")) {
         console.log("Hi");
         req.session.type.name = req.session.type.name.replace(/_/g, " ");
       }

       knex('posts')
       .select("title", 'content', 'upvote', 'downvote', 'types.name', 'users.first_name', 'users.last_name')
       .join('users', 'users.id', 'posts.user_id')
       .join('types', 'types.id', 'posts.type_id')
       .where('type_id', result[0].id)
       .then((result) => {
         let posts = result;
         console.log("Some stupid shit");
         for(let i = 0; i < posts.length; i++) {
           let timeFormat = String(posts[i].created_at).slice(0, 21);
           posts[i].created_at = timeFormat;
         }
       res.render('pages/subject', {posts: result, type: req.session.type.name} )

       }).catch((err)=>{
         console.log(err);
       })

      // res.send("HELLO!")
    }).catch((err)=>{
      console.log(err);
    })
   },

     createHelp: function(req, res){
       knex('posts')
         .insert({
           title: req.body.title,
           content: req.body.content,
           user_id: req.session.user.id,
           type_id: req.session.type.id
         }, '*')
         .then((result)=>{
           res.redirect('/helps/'+result[0].id, result)
         })
          .catch((err) => {
            console.error(err)
         });
        },

   singlePost: function(req, res){
     knex('posts')
     .where('id', req.params.id)
     .select('title', 'content', 'types.name', 'users.first_name', 'users.last_name', 'upvote', 'downvote')
     .join('users', 'users.id', 'posts.user_id')
     .join('types', 'types.id', 'posts.type_id')
     .then((result)=>{
       let post = result[0];
       knex('comments')
       .where('posts_id', req.params.id)
       .select('content', 'upvote', 'downvote', 'users.first_name', 'users.last_name')
       .join('users', 'users.id', 'comments.user_id')
     })
     .then((result)=>{
       res.render('pages/post', { post: post, comments: result})
     });
   },

//Resources:


   resource: function(req, res){
       knex('resources')
       .then((result) => {
         res.render('resources', {info: result} )
       })
       .catch((err) => {
         console.error(err)
       });
   },

    addResource: function(req, res){
       knex('resources')
         .insert({
           link: req.body.link,
           blurb: req.body.blurb
         }, '*')
         .then((result)=>{
           res.redirect('/resources/create'+result[0].id, result)
         })
        .catch((err) => {
          console.error(err)
         });
        },

     interest: function(req, res){
       knex('posts')
         .insert({
           title: req.body.title,
           content: req.body.content,
           user_id: req.session.user.id,
           type_id: 1
         }, '*')
         .then((result)=>{
           res.redirect('/overview', result)
           res.redirect('/overview')
         })
          .catch((err) => {
            console.error(err)
          });
          }

 };

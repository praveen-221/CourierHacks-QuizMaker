//# dependencies
const session = require('express-session'); //import express-session dependency as session
const bodyParser = require('body-parser'); //import body-parser dependency as bodyParser
const express = require('express'); //import express dependency as express
const app = express(); //declare app variable as express
let conn = require('./mysql.js'); //declare conn variable to require file mysql.js
// Install with: npm install @trycourier/courier
const { CourierClient } = require("@trycourier/courier");
const courier = CourierClient({ authorizationToken: "pk_prod_BJCG9V609RMYQMMTRCAS3BSA0DSA" });

//# settings
//environment settings & db connect

app.set('view engine', 'ejs'); //set web templating engine as ejs
app.use(express.static('public')); //set public as the css/js express static folder
app.use(
  bodyParser.urlencoded({  //initialize bodyParser usage
    extended: false
  })
);
app.use(bodyParser.json()); //initialize bodyParser's json
app.use(
  session({             //initialize session to be used with specified settings
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

app.get('/', (req, res) => {    //get function to render login.ejs
  res.render('landing.ejs');
});
//# render, and authorization
app.get('/login', (req, res) => {    //get function to render login.ejs
  res.render('login.ejs');
});
app.get('/attendquiz', (req, res) => {    //get function to render login.ejs
  res.render('attendquiz.ejs');
});

app.get('/home', (req, res) => {  //get function to render home.ejs
  if(req.session.loggedin == true){
    res.render('homepage.ejs');
  }else{
    res.redirect('/');
  }
  
});

app.get('/register', (req, res) => {  //get function to render register.ejs
  res.render('register.ejs');
});

app.get('/setvcq/:qid', (req, res) => {  //get function to render register.ejs
  let qid = req.params.qid;
  res.render('setvcq.ejs',{q:qid});
});

app.get('/enterquizcode', (req, res) => {  //get function to render register.ejs
  res.render('enterquizcode.ejs');
});

app.get('/myquiz', (req, res) => {  //get function to render register.ejs
  res.render('myquiz.ejs');
});

app.post('/auth_login', (req, res) => { //post function to authorize user login
  let email = req.body.email,           //declare email/password variable
    password = req.body.password;

  if (email && password) {
    conn.query(
      'SELECT * FROM user WHERE email = ? AND password = ?',  //set conn query to mysql
      [email, password],    //insert email and password as data
      (err, results) => {   //function for error throwing and the results
        if (err) throw err;
        if (results.length > 0) {
          req.session.loggedin = true;   //set loggedin property as true
            req.session.email = email;    //set email property as email itself
          res.redirect('/home');    //redirect to home
        } else {
          res.json({    //json output with error and error code
            code: 400,
            err: 'Incorrect credentials'
          });
        }
        res.end();
      }
    );
  }
});

app.post('/auth_register', async (req, res) => {  //post function to authorize registration
  let register_data = {   //set register_data variable to have name, email, and password property
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  };
  const { requestId } = await courier.send({
    message: {
      to: {
        email: req.body.email,
      },
      template: "9B22S9HXAXMBKYPESJ6PQ9SWE165",
      data: {
        userName : req.body.name,
      },
    },
  });
  conn.query('INSERT INTO user SET ?', register_data, (err, results) => {  //set conn query to mysql with err and the results
    if (err) throw err;
    else {
      console.log('Data inserted!', results);  //output to console
      res.redirect('/');  //redirect to login page
    }
  });
  
});

app.use('/logout',(req,res)=>{
  req.session.destroy();
  res.redirect('/');
});

app.post('/attendquiz',(req,res)=>{
  console.log(req);
  let crctpts = 0;
  let redpts = 0;
  let novibe = 0;
  let vibepercentage = 0;
  let vcomm="";
  conn.query(
    'SELECT * FROM question WHERE userid = ?',  //set conn query to mysql
    [req.body.userid],    //insert email and password as data
    (err, results) => {   //function for error throwing and the results
      if (err) throw err;
      if (results.length == 5) {
           //redirect to home
          
           if(results[0][req.body.q1ans]=="+1"){
            crctpts+=1;
           }else if(results[0][req.body.q1ans]=="-1"){
              redpts+=1;
           }else{
              novibe+=1;
           }
           if(results[0][req.body.q2ans]=="+1"){
            crctpts+=1;
           }else if(results[0][req.body.q2ans]=="-1"){
              redpts+=1;
           }else{
              novibe+=1;
           }
           if(results[0][req.body.q3ans]=="+1"){
            crctpts+=1;
           }else if(results[0][req.body.q3ans]=="-1"){
              redpts+=1;
           }else{
              novibe+=1;
           }
           if(results[0][req.body.q4ans]=="+1"){
            crctpts+=1;
           }else if(results[0][req.body.q4ans]=="-1"){
              redpts+=1;
           }else{
              novibe+=1;
           }
           if(results[0][req.body.q5ans]=="+1"){
            crctpts+=1;
           }else if(results[0][req.body.q5ans]=="-1"){
              redpts+=1;
           }else{
              novibe+=1;
           }

           if(redpts==5){
            vibepercentage=-100;
            vcomm="Hmmm No comments to each their own"
           }else if(novibe==5){
            vibepercentage=0;
            vcomm="Maybe u could get to know each other more"
           }else if(crctpts==5){
            vibepercentage=100;
            vcomm="If you are not bffs yet, you should be"
           }else{
            vibepercentage = (crctpts/5)*100 - (redpts/5)*20 ;
           }

      } else {
        res.redirect('/home'    //json output with error and error code
          );
      }
      res.render('/quizcomplete',{vbp:vibepercentage,vbcom:vcomm});
    }
  );
});

app.use('/quizcomplete',(req,res)=>{
res.render('quizcomplete.ejs',{vbp:"98",vbcom:"Nice match"});
});


app.get('*', (req, res) => {
  res.send('404 - Page not found'); //set other unknown pages as 404
});
//# middleware port
app.listen(9090, () => { //listen to port
  console.log('Port established in 9090'); //output to console
});



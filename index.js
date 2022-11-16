//# dependencies
const session = require('express-session'); //import express-session dependency as session
const bodyParser = require('body-parser'); //import body-parser dependency as bodyParser
const express = require('express'); //import express dependency as express
const app = express(); //declare app variable as express
let conn = require('./mysql.js'); //declare conn variable to require file mysql.js
// Install with: npm install @trycourier/courier
const { CourierClient } = require("@trycourier/courier");
const courier = CourierClient({ authorizationToken: "pk_prod_BJCG9V609RMYQMMTRCAS3BSA0DSA" });
var alert = require('alert');

const window = require("window");
const { request } = require('express');

// var popup = require("popups");

let submitEnable = false;



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
// app.get('/attendquiz', (req, res) => {    //get function to render login.ejs

// });

app.get('/home', (req, res) => {  //get function to render home.ejs
  if (req.session.loggedin == true) {
    let quizattend = false;
    conn.query(
      'SELECT * FROM question where userid=?',  //set conn query to mysql
      [req.session.userid],    //insert email and password as data
      (err, results) => {   //function for error throwing and the results
        if (err) throw err;
        if (results.length < 5) {
          res.render('homepage.ejs', { submitEnable: false, quizcode: 0 });
        }

        else {
          conn.query(
            "select * from quiz where userid=?", [req.session.userid],
            (err, results) => {
              console.log(results[0].quizid)
              res.render('homepage.ejs', { submitEnable: true, quizcode: results[0].quizid });
            }
          )
        }

      });
  } else {
    res.redirect('/');
  }

});

app.get('/register', (req, res) => {  //get function to render register.ejs
  res.render('register.ejs');
});

app.get('/setvcq/:qid', (req, res) => {  //get function to render register.ejs
  let qid = req.params.qid;
  conn.query(
    'SELECT * FROM question WHERE userid=? AND quesid=?',
    [req.session.userid, qid],
    (err, results) => {
      if (err) throw err;
      console.log(results[0]);
      res.render('setvcq.ejs', { quesid: qid, arr: results[0] });
    }
  )

});

app.post('/setvcq/:qid', (req, res) => {  //get function to render register.ejs
  let qid = req.params.qid;
  let arr = [
    req.body.qstring,
    req.body.opta,
    req.body.optapt,
    req.body.optb,
    req.body.optbpt,
    req.body.optc,
    req.body.optcpt,
    req.body.optd,
    req.body.optdpt]
  var userid = req.session.userid;
  console.log(qid, req.body);
  //agilan
  conn.query(
    'SELECT * FROM question WHERE userid=? AND quesid=?',
    [userid, qid],
    (err, results) => {
      if (err) throw err;
      // console.log(results);
      if (results.length == 0) {

        conn.query(
          'INSERT INTO question VALUES (?,?,?,?,?,?,?,?,?,?,?)',  //set conn query to mysql
          [qid, 1, ...arr],    //insert email and password as data
          (err, results) => {   //function for error throwing and the results
            if (err) throw err;
            res.redirect('/myquiz');
          }
        )
      }
      else {
        console.log("helo");
        conn.query(
          'update question set  qtext=?, opta=?, optascore=?, optb=?, optbscore=?, optc=?, optcscore=?, optd=?, optdscore=? where userid=? and quesid=?',  //set conn query to mysql
          [...arr, req.session.userid, qid],    //insert email and password as data
          (err, results) => {   //function for error throwing and the results
            if (err) throw err;
            // res.render('myquiz.ejs', {submitEnable: false});
            conn.query(
              'SELECT * FROM question WHERE userid=?',
              [req.session.userid],
              (err, results) => {
                if (err) throw err;
                if (results.length == 5) submitEnable = true;
                res.redirect('/myquiz');
              }
            )

          }
        )
      }
    }
  );



});

app.get('/setvcq', (req, res) => {  //get function to render register.ejs
  res.render('setvcq.ejs');
});

app.get('/myquiz', (req, res) => {  //get function to render register.ejs
  res.render('myquiz.ejs', { submitEnable: true });
});



app.get('/enterquizcode', (req, res) => {  //get function to render register.ejs

  res.render('enterquizcode.ejs');
});

app.post('/enterquizcode', (req, res) => {  //get function to render register.ejs

  conn.query(
    "select * from quiz where quizid=?",
    [req.body.friendcode],
    (err, results) => {
      if (err) throw err;
      conn.query(
        "select * from question where userid=?",
        [results[0].userid],
        (err, result) => {
          console.log(result[0].userid)
          res.render('attendquiz.ejs', { result: result, userid: results[0].userid, friendname: req.body.friendname });
        }
      )
    }
  )
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
          req.session.userid = results[0].id;
          req.session.loggedin = true;   //set loggedin property as true
          req.session.email = email;
          req.session.name = results[0].name;  //set email property as email itself
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
        userName: req.body.name,
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

app.use('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
})

app.post("/broadcastquiz", (req, res) => {
  conn.query(
    'SELECT * FROM question where userid=?',  //set conn query to mysql
    [req.session.userid],    //insert email and password as data
    (err, results) => {   //function for error throwing and the results
      if (err) throw err;
      if (results.length < 5) {
        res.render('myquiz.ejs', { submitEnable: submitEnable });
      } else {
        conn.query(
          'INSERT into quiz (userid) values (?)',
          [1],
          (err, results) => {
            if (err) throw err;
            res.redirect("/home");
          }
        )
      }
    }
  );

})

app.post('/attendquiz', (req, res) => {
  let crctpts = 0;
  let redpts = 0;
  let novibe = 0;
  let vibepercentage = 0;
  let vcomm = "";
  let email = ""
  conn.query(
    'SELECT * FROM question WHERE userid = ?',  //set conn query to mysql
    [req.body.userid],    //insert email and password as data
    async (err, results) => {   //function for error throwing and the results
      if (err) throw err;
      if (results.length == 5) {
        //redirect to home
        console.log(results);
        console.log(results[4][req.body.q0ans]);
        if (results[4][req.body.q0ans] == "1") {
          crctpts += 1;
        } else if (results[4][req.body.q0ans] == "-1") {
          redpts += 1;
        } else {
          novibe += 1;
        }
        if (results[0][req.body.q1ans] == "1") {
          crctpts += 1;
        } else if (results[0][req.body.q1ans] == "-1") {
          redpts += 1;
        } else {
          novibe += 1;
        }
        if (results[1][req.body.q2ans] == "1") {
          crctpts += 1;
        } else if (results[1][req.body.q2ans] == "-1") {
          redpts += 1;
        } else {
          novibe += 1;
        }
        if (results[2][req.body.q3ans] == "1") {
          crctpts += 1;
        } else if (results[2][req.body.q3ans] == "-1") {
          redpts += 1;
        } else {
          novibe += 1;
        }
        if (results[3][req.body.q4ans] == "1") {
          crctpts += 1;
        } else if (results[3][req.body.q4ans] == "-1") {
          redpts += 1;
        } else {
          novibe += 1;
        }


        if (redpts == 5) {
          vibepercentage = -100;
          vcomm = "Hmmm No comments to each their own"
        } else if (novibe == 5) {
          vibepercentage = 0;
          vcomm = "Maybe u could get to know each other more"
        } else if (crctpts == 5) {
          vibepercentage = 100;
          vcomm = "If you are not bffs yet, you should be"
        } else {
          vibepercentage = (crctpts / 5) * 100 - (redpts / 5) * 20;
          if (vibepercentage < 50) vcomm = "You may not be in vibe that much! Try couple's therapy";
          else vcomm = "You are both partners in crime. Keep the vibe going!"
        }

      } else {
        // res.redirect('/home'    //json output with error and error code
        //   )
      }
      conn.query(
        "select * from user where name=?",
        [req.body.friendname],
        async (err, results) => {
          if (err) throw err;
          console.log(req.body)
          const { requestId } = await courier.send({
            message: {
              to: {
                email: results[0].email,
              },
              template: "RQAA69315Y4WMZP9Y0YF20SXD665",
              data: {
                friendName: req.session.name,
                userName: req.body.friendname,
                vibePercent: vibepercentage,
                vibeComment: vcomm,
              },
            },
          });
          res.render('quizcomplete.ejs', { vbp: vibepercentage, vbcom: vcomm });
        }
      )
      console.log("----", email)

    }
  );
});

app.use('/quizcomplete', (req, res) => {
  res.render('quizcomplete.ejs', { vbp: "98", vbcom: "Nice match" });
});


app.get('*', (req, res) => {
  res.send('404 - Page not found'); //set other unknown pages as 404
});





//# middleware port
app.listen(9090, () => { //listen to port
  console.log('Port established in 9090'); //output to console
});

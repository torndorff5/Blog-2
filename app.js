//jshint esversion:6

const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const nodemailer = require("nodemailer");
const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
const my_email = "torndorff5@gmail.com"
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: my_email,
    pass: 'trvvnivktrixywoo'
  }
});
let USDollar = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://torndorff5:W!THghimg2banc@cluster0.ognzf1o.mongodb.net/blogDB", {useNewUrlParser: true});

const postSchema = {
  title: String,
  content: String
};

function calculateAmortization(principal, annualInterestRate, termYears) {
  const monthlyInterestRate = annualInterestRate / 12 / 100;
  const totalPayments = termYears * 12;
  const monthlyPayment = principal * monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -totalPayments));

  let currentBalance = principal;
  let schedule = [];

  for (let month = 1; month <= totalPayments; month++) {
    const interestForMonth = currentBalance * monthlyInterestRate;
    const principalForMonth = monthlyPayment - interestForMonth;
    currentBalance -= principalForMonth;

    schedule.push({
      month: month,
      totalPayment: monthlyPayment,
      principalPayment: principalForMonth,
      interestPayment: interestForMonth,
      balance: currentBalance > 0 ? currentBalance : 0
    });

    if (currentBalance <= 0) break;
  }

  return schedule;
}
function sendMail(to, text){
  let mailOptions = {
    from: my_email,
    to: to,
    subject: `MORTGAGE LEAD!!!!`,
    text: text
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

const Post = mongoose.model("Post", postSchema);

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.get("/", function(req, res){
  Post.find({})
  .then(function (posts) {
    res.render('home', {
      posts: posts
    })
  })
  .catch(function (err) {
    console.log(err);
  });
});


app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){

  const post = new Post ({
    title: req.body.postTitle,
    content: req.body.postBody
  });
  post.save()
  res.redirect("/")
});

app.get("/posts/:postName", function(req, res){
  const requestedTitle = _.lowerCase(req.params.postName);
  Post.find({})
  .then(function(posts){
    posts.forEach(function(post){
      const storedTitle = _.lowerCase(post.title);
      if (storedTitle === requestedTitle) {
        res.render("post", {
          title: post.title,
          content: post.content
        });
      }
    });
  })
  .catch(function(err){
    console.log(err)
  })

});

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.post("/contact", function(req, res){
  //grab info
  let name = req.body.fullName;
  let email = req.body.emai;
  let phone = req.body.phone;
  let loan = req.body.loanType;
  let msg = req.body.msg;
  const text = `Name : ${req.body.fullName}
    Email : ${req.body.emai}
    Phone : ${req.body.phone}
    Loan Type : ${req.body.loanType}
    Message : ${req.body.msg}`
  //send email to sreichner32@gmail.com
  sendMail(my_email, text);
  res.render("thanks");
});

app.get("/thanks", function(req, res){
  res.render("thanks");
})

app.get("/loan-programs", function(req, res){
  res.render("loan-programs");
});

app.get("/calculator", function(req, res){
  // Determine the step from the query string, default to step 1
  const step = req.query.step ? parseInt(req.query.step) : 1;
  res.render("calculator", { step: step });
})


app.post("/calculator", function(req, res){
  let amortization = calculateAmortization(req.body.loanAmount, req.body.interestRate, req.body.loanTerm);
  const text = `Loan Amount : ${USDollar.format(req.body.loanAmount)}
    Interest Rate : ${req.body.interestRate}
    Loan Term : ${req.body.loanTerm}
    Annual Income: ${USDollar.format(req.body.annualIncome)}
    Name : ${req.body.fullName}
    Email : ${req.body.emai}
    Phone : ${req.body.phone}
    Monthly: ${USDollar.format(amortization[0].totalPayment)}`
  sendMail(my_email, text);
  res.render("thanks");
});

app.listen(port, function() {
  console.log("Server started on port " + port);
});
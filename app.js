const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongojs = require('mongojs')
const crypto = require('crypto');

const algorithm = 'aes-256-ctr',
    password = 'd6F3Efeq';

const app = express();

const db = mongojs('weblog', ['users'])

//View engine
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

//Body Parser middleware

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

//SET static path
app.use(express.static(path.join(__dirname,'public')));

app.get('/',(req,res) => {
    res.render('index');
});

app.post('/users/add',(req,res) => {
    let crypted = encrypt(req.body.password);
    //db.insert
    console.log(crypted);
});

app.get('/about',(req,res) => {
    res.render('about');
});

app.get('/register',(req,res) => {
    res.render('register');
});

app.get('/login',(req,res) => {
    res.render('login');
});

app.listen(3000,() => {
    console.log('Server started on port 3000');
});

function encrypt(text){
    var cipher = crypto.createCipher(algorithm,password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text){
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
  }
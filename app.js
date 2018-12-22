const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongojs = require('mongojs');
const session = require('express-session');
const crypto = require('crypto');

// Crypto settings
const algorithm = 'aes-256-ctr',
    password = 'd6F3Efeq';

// MongoDB settings
const db = mongojs('weblog',['users']);

const app = express();


//View engine
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

//Body Parser middleware

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

//Use express session
app.use(session({secret:'secretkey'}));
//SET static path
app.use(express.static(path.join(__dirname,'public')));

// GET home route
app.get('/',(req,res) => {
    res.render('index',{'message':'','user':req.session.email});
});

// Register new users
app.post('/users/add',(req,res) => {
    
    //Check if user already exists
    db.users.find({email:req.body.email},(err,docs) =>{
        if(!err){
            
            if(docs.length != 0){
                // User already exists
                res.render('register',{'msg':'User already exists'});
                console.log("User already exists");
            }else{
                // Create new User
                let crypted = encrypt(req.body.password);
                let new_user = {
                    email:req.body.email,
                    password:crypted
                };
                db.users.insert(new_user, (err,result) => {
                    if(err){
                        console.log(err);
                    }else{
                        res.redirect('/login');
                    }
                });
            }
            
        }else{
            console.log(err);
        }
    });
    
});

app.post('/users/login',(req,res) => {
    
    let encrypted_password = encrypt(req.body.password);
    db.users.find({email:req.body.email},(err,docs) => {
        if(encrypted_password == docs[0]['password']){
            // Credentials verified
            req.session.email = req.body.email;
            req.session.password = docs[0]['password'];
            req.session.user_id = docs[0]['_id'];
            res.render('index',{'message':'You are now logged in !!!',
                                'user':req.session.email}); 
        }else{
            // Wrong credentials
            res.render('login',{'message':'Wrong credentials, Login again'})
        }
    });
});

app.get('/logout',(req,res) => {
    req.session.email = null;
    req.session.password = null;
    req.session.user_id = null;
    res.render('index',{'message':'You successfully logged out !!!','user':null});
});

app.get('/about',(req,res) => {
    res.render('about',{'message':'','user':req.session.email});
});

app.get('/register',(req,res) => {
    res.render('register',{'message':"",'user':req.session.email});
});

app.get('/login',(req,res) => {
    res.render('login',{'message':'','user':req.session.email});
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
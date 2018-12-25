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
    posts = db.articles.find((err,result) => {
        res.render('index',{'message':'','user':req.session.email,'posts':result});
    });

    
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

// POST request route for user login 
app.post('/users/login',(req,res) => {
    
    let encrypted_password = encrypt(req.body.password);
    db.users.find({email:req.body.email},(err,docs) => {
        if(encrypted_password == docs[0]['password']){
            // Credentials verified
            req.session.email = req.body.email;
            req.session.password = docs[0]['password'];
            req.session.user_id = docs[0]['_id'];
            db.articles.find((err,result) => {
                res.render('index',{'message':'You are now logged in !!!',
                                'user':req.session.email,
                                'posts':result}); 
            });
            
        }else{
            // Wrong credentials
            res.render('login',{'message':'Wrong credentials, Login again','user':req.session.email})
        }
    });
});

// GET request route for logging out user
app.get('/logout',(req,res) => {
    req.session.email = null;
    req.session.password = null;
    req.session.user_id = null;
    res.render('index',{'message':'You successfully logged out !!!','user':req.session.email});
});

// GET request route for article creation page
app.get('/post_article',(req,res) => {
    res.render('post_article',{'message':'','user':req.session.email,'update':'false'});
});


// POST request route for creating/updating new article
app.post('/post_article',(req,res) => {
    
    if(req.body.update_check == 'false'){ // To create new article
        post = {
            title:req.body.title,
            body:req.body.article_text,
            author:req.session.email,
            created_at: new Date()
        };
        console.log("insert article called");
        db.articles.insert(post,(err,result) => {
            if(err){
                console.log(err);
            }else{
                res.render('index',{'message':'Article posted Successfully !!!','user':req.session.email});
            }
        });
        res.redirect('/');
    }else if(req.body.update_check == 'true'){ // To update an article
        db.articles.findAndModify({query:{_id: db.ObjectId(req.body.article_id)},
            update:{$set:{title:req.body.title,body:req.body.article_text,
                    author:req.session.email,created_at: new Date() }},
                    new:true
            },
         (err, doc) => {
            if(err){
                console.log(err);
            }else{
                // Do nothing, article updated
            }
            
        });
        res.redirect('/dashboard');
    }
    
});

// User dashboard for editing or removing articles
app.get('/dashboard',(req,res) => {
    db.articles.find({author:req.session.email},(err,result) => {
        res.render('dashboard',{'message':'','user':req.session.email,
                                'posts':result});
    });
    
});

// Route to post a comment on a post

app.post('/post/view/:id',(req,res) => {
    new_comment ={
        text:req.body.comment_text,
        author:req.session.email,
        article_id:req.params.id,
        created_at: new Date()
    };
    db.comments.insert(new_comment,(err,result) => {
        if(err){
            console.log(err);
        }else{
            db.articles.findOne({_id:db.ObjectId(req.params.id)},(err2,article)=>{
                db.comments.find({article_id:req.params.id},(err3,comments)=>{
                    res.render('view_post',{'message':'Comment Posted','user':req.session.email,
                                            'post':article,'comments':comments})
                });
            });
            
        }
    });
});

// Route to view single post
app.get('/post/view/:id', (req,res)=>{
    db.articles.findOne({_id:db.ObjectId(req.params.id)},(err,result) => {
        db.comments.find({article_id:req.params.id},(err2,result2) => {
            res.render('view_post',{'message':'View or comment on a post','user':req.session.email,
                                'post':result,'comments':result2});
        });
        
    });
});

// Edit post route
app.get('/post/edit/:id',(req,res) => {
    db.articles.find({_id:db.ObjectId(req.params.id)},(err,result) => {
        res.render('post_article',{'message':'Edit your article here...',
                                    'post':result,
                                    'user':req.session.email,
                                    'update':'true'});
    });
});

// Delete post route
app.get('/post/delete/:id',(req,res) => {
    db.articles.remove({_id:db.ObjectId(req.params.id)},(err,result) => {
        db.comments.remove({article_id:req.params.id},(err2,result2) => {
            db.articles.find({author:req.session.email},(err3,articles) =>{
                res.render('dashboard',{'message':'Article deleted successfully',
                                        'posts':articles,'user':req.session.email});
            });
        });
    });
});

// Delete comments route

app.get('/comments/delete/:post_id/:id', (req,res)=>{
    db.comments.remove({_id:db.ObjectId(req.params.id)},(err,result) => {
        db.articles.findOne({_id:db.ObjectId(req.params.post_id)},(err2,article) => {
            db.comments.find({article_id:req.params.post_id},(err3,comments) => {
                res.render('view_post',{'message':'View or comment on a post','user':req.session.email,
                                    'post':article,'comments':comments});
            });
        });
    });
});


// GET request route for About page
app.get('/about',(req,res) => {
    res.render('about',{'message':'','user':req.session.email});
});


// GET request route for user registration page
app.get('/register',(req,res) => {
    res.render('register',{'message':"",'user':req.session.email});
});

// GET request route for login page
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
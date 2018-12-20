const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const expressValidator = require('express-validator');

let app = express();
/*
var logger = function(req,res,next){
    console.log('Logging');
    next();
}

app.use(logger);
*/
//View engine
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

//Body Parser middleware

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

//SET static path
app.use(express.static(path.join(__dirname,'public')));

var users = [
    {
        first_name:'Aakash',
        last_name:'Srivastava'
    },
    {
        first_name:'Lebron',
        last_name:'James'
    }
];

app.get('/',(req,res) => {
    //let title = 'Customers';
    res.render('index',{
        'title':'Customers',
        'users':users
    });
});

app.post('/users/add',(req,res) => {
    var new_user = {
        first_name:req.body.first_name,
        last_name:req.body.last_name,
        email:req.body.email
    };
    console.log(new_user);
});

app.listen(3000,() => {
    console.log('Server started on port 3000');
});
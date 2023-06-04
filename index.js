const express=require('express')
const app = express()
app.listen(3000, ()=> console.log('listening at port 3000'))

//serve unspecified static pages from our public dir
app.use(express.static('public'))
//make express middleware for json available
app.use(express.json())

// Password so people cant access my work
require('dotenv').config();
const mongoDBPassword=process.env.MYMONGOPASSWORD
const sessionSecret=process.env.MYSESSIONSECRET

// This can load mongoose and connect to the MongoDB database
const mongoose = require('mongoose');

mongoose.connect(`mongodb+srv://CCO6005-02:${mongoDBPassword}@cluster0.lpfnqqx.mongodb.net/JAPP?retryWrites=true&w=majority`)


const users=require('./User')


const postData =require('./Post');

//allows us to process post info in urls
app.use(express.urlencoded({extended: false}));

const path = require('path');

//multer allows processing multipart forms with images
const multer=require('multer');

const upload = multer({ dest: './public/uploads/' })




//consts to hold expiry times in ms
const threeMins = 1000 * 60 * 3;
const oneHour = 1000 * 60 * 60;

//use the sessions module and the cookie parser module
const sessions = require('express-session');
const cookieParser = require("cookie-parser");

//make cookie parser middleware available
app.use(cookieParser());

//load sessions middleware, with some config
app.use(sessions({
    secret: sessionSecret,
    saveUninitialized:true,
    cookie: { maxAge: oneHour },
    resave: false 
}));


//test that user is logged in with a valid session
function checkLoggedIn(request, response, nextAction){
    if(request.session){
        if(request.session.userid){
            nextAction()
        } else {
            request.session.destroy()
            return response.redirect('/login.html')
        }
    }
}

//controller for the main app view, depends on user logged in state
app.get('/app', checkLoggedIn, (request, response)=>{
    // response.redirect('./application.html')
    response.redirect('./chat.html')
})


//controller for logout
app.post('/logout', async (request, response)=>{
    
    await users.setLoggedIn(request.session.userid,false)
    request.session.destroy()
    await console.log(users.getUsers())
    response.redirect('./login.html')
})

//controller for login
app.post('/login', async (request, response)=>{
    console.log(request.body)
    let userData=request.body
    console.log(userData)
    
    if(await users.findUser(userData.username)){
        console.log('user found')
        if(await users.checkPassword(userData.username, userData.password)){
            console.log('password matches')
            request.session.userid=userData.username
            await users.setLoggedIn(userData.username, true)
            response.redirect('hometest.html')
        } else {
            console.log('password wrong')
            response.redirect('/login.html')
        }
    } else {
        console.log('no such user')
        response.redirect('/login.html')
    }
})


app.post('/newpost', upload.single('myImage'), async (request, response) =>{
    console.log(request.body)
    let filename=null
    if(request.file && request.file.filename){ //check that a file was passes with a valid name
        filename='uploads/'+request.file.filename
    }
    await postData.addNewPost(request.session.userid, request.body, filename)
    response.redirect('/chat.html')
})


// async/await version of /getposts controller using Mongo
app.get('/getposts',async (request, response)=>{
    response.json(
        {posts:await postData.getPosts(5)}
    )
})

/////////////////////////////////////


//controller for handling a post being liked
app.post('/like', async (request, response)=>{
    //function to deal with a like button being pressed on a post
    likedPostID=request.body.likedPostID
    likedByUser=request.session.userid
    await postData.likePost(likedPostID, likedByUser)
    // console.log(likedByUser+" liked "+likedPostID)
    response.json(
        {posts:await postData.getPosts(5)}
    )
})

app.post('/comment', async (request, response)=>{
    //function to deal with a like button being pressed on a post
    let commentedPostID=request.body.postid
    let comment=request.body.message
    let commentByUser=request.session.userid
    await postData.commentOnPost(commentedPostID, commentByUser, comment)
    // response.json({post: await postData.getPost(commentedPostID)})
    response.redirect('/chat.html')
})



/////////////////////////////////////

app.post('/getonepost', async (request, response) =>{
    // console.log(request.file)
    let postid=request.body.post
    console.log(request.body)
    response.json({post: await postData.getPost(request.body.post)})
})

//controller for registering a new user
app.post('/register', async (request, response)=>{
    console.log(request.body)
    let userData=request.body
    // console.log(userData.username)
    if(await users.findUser(userData.username)){
        console.log('user exists')
        response.json({
            status: 'failed',
            error:'user exists'
        })
    } else {
        users.newUser(userData.username, userData.password)
        response.redirect('/registered.html')
    }
    console.log(users.getUsers())
})

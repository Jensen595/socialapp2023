const mongoose=require('mongoose');
const { Schema, model } = mongoose;

const userSchema = new Schema({
    username: String,
    password: String,
    loggedin: Boolean
});

const User = model('User', userSchema);


    async function newUser(username, password){
        const user={username:username, password:password, loggedin:false}
        // users.push(user)
        await User.create(user)
        .catch(err=>{
            console.log('Error:'+err)
        });
    }

    // function getUsers(){
    //     return users
    // }

    async function getUsers(){
        let data=[];
        await User.find({})
            .exec()
            .then(mongoData=>{
                data=mongoData;
            })
            .catch(err=>{
                console.log('Error:'+err)
            });
        return data;
    }

    // function findUser(username){
    //     return users.find(user=>user.username==username)
    // }

    async function findUser(username){
        let user=null
        await User.findOne({username:username}).exec()
            .then(mongoData=>{
                user=mongoData;
            })
            .catch(err=>{
                console.log('Error:'+err)
            });
        return user;
    }

    async function checkPassword(username, password){
        let user=await findUser(username)
        if(user){
            // console.log(user, password)
            return user.password==password
        }
        return false
    }

    async function setLoggedIn(username, state){
        let user=await findUser(username)
        if(user){
            user.loggedin=state
            user.save()
        }
    }

    async function isLoggedIn(username){
        let user=await findUser(username)
        if(user){
            return user.loggedin=state
        }
        return false
    }


    
exports.newUser=newUser;
exports.getUsers=getUsers;
exports.findUser=findUser;
exports.checkPassword=checkPassword;
exports.setLoggedIn=setLoggedIn;
exports.isLoggedIn=isLoggedIn;


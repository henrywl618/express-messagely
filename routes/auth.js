const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require('../config');
const ExpressError = require('../expressError');
const {authenticateJWT} = require("../middleware/auth");
const User = require('../models/user');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next)=>{
    try{
        const { username, password } = req.body;
        if( await User.authenticate(username, password)) {
            const token = jwt.sign( {username}, SECRET_KEY);
            await User.updateLoginTimestamp(username);
            return res.json({ token });
        }
        throw new ExpressError("Invalid username/password", 400);
    } catch(err){
        return next(err)
    }
});



/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async (req, res, next)=>{
    try{
        const {username, password, first_name, last_name, phone} = req.body;
        await User.register({username, password, first_name, last_name, phone});
        await User.updateLoginTimestamp(username);
        const token = jwt.sign( { username }, SECRET_KEY);
        return res.json({ token });    
    } catch(err) {
        return next(err)
    }
});

module.exports = router;

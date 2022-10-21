const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require('../config');
const ExpressError = require('../expressError');
const {authenticateJWT, ensureLoggedIn} = require("../middleware/auth");
const User = require('../models/user');
const Message = require('../models/message');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn , (req, res, next)=>{
    try{
        const results = Messages.get(req.params.id);
        const msg = results.rows[0];
        if(req.user.username != msg.from_user && req.user != msg.to_user) throw new ExpressError("Not authorized", 401);
        return res.json(msg)
    }catch(err){
        return next(err)
    };
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, (req, res, next)=>{
    try{
        const username = req.user;
        const {to_username, body} = req.body;
        const result = Messages.create({username, to_username, body});
        const msg = result.rows[0];
        return res.json({message: result.msg});
    }catch(err){
        return next(err)
    };
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', (req, res, next)=>{
    try{
        const result1 = Messages.get(req.params.id);
        if(result1.rows[0].to_user != req.user.username) throw new ExpressError("Only the message recipient can mark this message as read",401);
        const result = Messages.markRead(req.params.id);
        const response = result.rows[0];
        return res.json({message:response})
    }catch(err){
        return next(err);
    };
});

module.exports = router;


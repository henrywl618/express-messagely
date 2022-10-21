const db = require("../db");
const bcrypt = require("bcrypt");
const {BCRYPT_WORK_FACTOR} = require("../config");
const ExpressError = require("../expressError");
/** User class for message.ly */



/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    const hashedpwd = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const user = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [username, hashedpwd, first_name, last_name, phone, new Date(), new Date()]);
    return {username: user.rows[0].username,
            password: password,
            first_name: user.rows[0].first_name,
            last_name: user.rows[0].last_name,
            phone: user.rows[0].phone}
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(`SELECT username, password FROM users WHERE username=$1`,[username])
    const user = result.rows[0];
    if(user && await bcrypt.compare(password, user.password)){
      return true
    }
    return false
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const date = new Date();
    const result = await db.query(`UPDATE users SET last_login_at=$1 WHERE username=$2 RETURNING username`, [date, username]);
    console.log(result)
    if(result.rowCount===0) throw new ExpressError("Cannot find user", 400);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const results = await db.query(`SELECT * FROM users`);
    return results.rows.map(u=>({username:u.username, first_name:u.first_name, last_name:u.last_name, phone:u.phone}));
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(_username) { 
    const results = await db.query(`SELECT * FROM users WHERE username=$1`, [_username]);
    const user = results.rows[0];
    if(!user) throw new ExpressError("Cannot find this user",400);
    const {username, first_name, last_name, phone, join_at, last_login_at} = user;
    return {username, first_name, last_name, phone, join_at, last_login_at}
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const results = await db.query(`SELECT * FROM messages LEFT JOIN users ON users.username=to_username WHERE from_username=$1`, [username]);
    if(results.rowCount === 0 ) throw new ExpressError("Cannot find this user",400);
    const messages = results.rows.map(({id, body, sent_at, read_at, username, first_name, last_name, phone})=>({id, body, sent_at, read_at, to_user:{username, first_name, last_name, phone}}));
    return messages
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const results = await db.query(`SELECT * FROM messages LEFT JOIN users ON users.username=from_username WHERE to_username=$1`, [username]);
    if(results.rowCount === 0 ) throw new ExpressError("Cannot find this user",400);
    const messages = results.rows.map(({id, body, sent_at, read_at, username, first_name, last_name, phone})=>({id, body, sent_at, read_at, from_user:{username, first_name, last_name, phone}}));
    return messages
  }
}


module.exports = User;
const JWT = require('jsonwebtoken');
const Admin = require('../../models/admin/auth');
const {JWT_SECRET} = require('../../config');
signToken = (user) => {
  return JWT.sign({
    iss: 'Coder',
    sub: user._id,
    iat: new Date().getTime(),
    exp: new Date().setDate(new Date().getDate() + 1),
  },
  JWT_SECRET
  );
};
module.exports = {
  signup: async (req, res, next) => {
    const {email, password} = req.value.body;
    // check if there is a user with the same email
    const foundUser = await Admin.findOne({email});
    if (foundUser) {
      res.status(200).send({
        status: 400,
        result: 'email is already in use',
      });
    }
    const newUser = new Admin({email, password});
    await newUser.save();
    const token = signToken(newUser);
    if (!token) {
      res.status(200).send({
        status: '400',
        result: 'error in generating signup',
      });
    }
    res.status(200).json({
      status: '200 OK',
      result: token,
    });
  },
  signin: async (req, res, next) => {
    // console.log('req.user:',req.user);
    if (req.user.message == 'Incorrect Admin') {
      res.status(200).send({
        status: 401,
        result: 'Admin doesn\'t Exist',
      });
    } else if (req.user.message == 'Incorrect password') {
      res.status(200).send({
        status: 401,
        result: 'Incorrect Password',
      });
    } else {
      res.status(200).send({
        status: '200 OK',
        result: 'Login Successful',
      });
    }
  },
  secret: async (req, res, next) => {
    res.json({Status: 'Managed to get here'});
  },
};

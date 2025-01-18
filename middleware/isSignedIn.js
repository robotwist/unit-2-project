// middleware/isSignedIn.js

const isSignedIn = (req, res, next) => {
  if (req.session.user && req.session.user.id) {
    return next();
  }
  res.redirect('/auth/sign-in'); // Redirect to sign-in page if not authenticated
};

module.exports = isSignedIn;
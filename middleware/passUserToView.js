const passUserToView = (req, res, next) => {
    res.locals.user = req.session.user_id ? req.session.user_id : null;
    next();
  };
  module.exports = passUserToView;







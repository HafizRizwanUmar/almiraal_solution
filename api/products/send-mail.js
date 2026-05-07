const sendEmailHandler = require('../sendemail');

// Reuse the sendemail logic since it handles both simple contact forms and complex product forms
module.exports = async (req, res) => {
  return sendEmailHandler(req, res);
};

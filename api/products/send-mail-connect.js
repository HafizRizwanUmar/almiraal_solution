const sendEmailHandler = require('../sendemail');

module.exports = async (req, res) => {
  return sendEmailHandler(req, res);
};

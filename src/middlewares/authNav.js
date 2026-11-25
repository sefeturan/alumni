const fs = require('fs');
const path = require('path');

module.exports = function authNav(req, res, next) {
  const originalSend = res.send.bind(res);
  res.send = function sendWithAuthNav(body) {
    if (typeof body === 'string' && /<body[\s>]/i.test(body) && !body.includes('/assets/auth-nav.js')) {
      body = body.replace(/<\/body>/i, '<script src="/assets/auth-nav.js" defer></script></body>');
    }
    return originalSend(body);
  };

  const originalSendFile = res.sendFile.bind(res);
  res.sendFile = function sendHtmlWithAuthNav(filePath, ...args) {
    if (path.extname(String(filePath)).toLowerCase() !== '.html') {
      return originalSendFile(filePath, ...args);
    }
    fs.readFile(filePath, 'utf8', (error, html) => {
      if (error) return next(error);
      res.type('html');
      res.send(html);
    });
    return res;
  };
  next();
};

const HttpError = require('../utils/HttpError');

function notFoundHandler(req, res, next) {
  next(new HttpError(404, `找不到路径：${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err instanceof HttpError ? err.status : err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    error: err.message || '服务器发生未预期的错误',
    details: err.details || undefined
  });
}

module.exports = { notFoundHandler, errorHandler };

const HttpError = require('../utils/HttpError');

function notFoundHandler(req, res, next) {
  next(new HttpError(404, `ページが見つかりません：${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err instanceof HttpError ? err.status : err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    error: err.message || 'サーバーで予期しないエラーが発生しました',
    details: err.details || undefined
  });
}

module.exports = { notFoundHandler, errorHandler };

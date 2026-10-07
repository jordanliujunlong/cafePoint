// 包一层，让 async route handler 里丢出的错误可以自动送进 Express 的错误处理中介层，
// 不用每个 controller 都自己写 try/catch。
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

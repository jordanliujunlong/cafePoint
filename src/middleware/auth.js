const jwt = require('../utils/jwt');
const HttpError = require('../utils/HttpError');

// 从 cookie 里解析出目前的会员 / 店员身份，塞进 req.member / req.staff。
// 不强制登入，纯粹「解析」，真正要求登入的路由再用下面的 requireMember / requireStaff。
function attachIdentity(req, res, next) {
  const memberToken = req.cookies && req.cookies.member_jwt;
  const staffToken = req.cookies && req.cookies.staff_jwt;

  req.member = null;
  req.staff = null;

  if (memberToken) {
    const payload = jwt.verify(memberToken);
    if (payload && payload.type === 'member') {
      req.member = { id: payload.sub };
    }
  }
  if (staffToken) {
    const payload = jwt.verify(staffToken);
    if (payload && payload.type === 'staff') {
      req.staff = { id: payload.sub, role: payload.role, name: payload.name };
    }
  }
  next();
}

function requireMember(req, res, next) {
  if (!req.member) return next(new HttpError(401, '请先使用 LINE 帐号登入'));
  next();
}

function requireStaff(minRole) {
  return function (req, res, next) {
    if (!req.staff) return next(new HttpError(401, '请先登入店员 / 管理员帐号'));
    if (minRole === 'admin' && req.staff.role !== 'admin') {
      return next(new HttpError(403, '此帐号没有后台管理权限'));
    }
    next();
  };
}

module.exports = { attachIdentity, requireMember, requireStaff };

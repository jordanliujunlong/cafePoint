// 初始化脚本：建立预设的积分规则 + 第一个管理员帐号。
// 部署后执行一次： npm run seed
// 会读取环境变量 SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME
// 若未设定，使用下面的预设值 —— 正式上线前请务必修改密码！

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' } // 全部使用 schema 里定义的预设值
  });
  console.log('积分规则已就绪：', rule);

  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD || 'benmachi2026';
  const name = process.env.SEED_ADMIN_NAME || '店長';

  const existing = await prisma.staffUser.findUnique({ where: { username } });
  if (existing) {
    console.log(`管理员帐号 "${username}" 已存在，略过建立。`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.staffUser.create({
      data: { username, passwordHash, name, role: 'admin' }
    });
    console.log(`已建立管理员帐号： ${username} / ${password}`);
    console.log('⚠️  请尽快登入后台并修改这组密码（见 README 的「修改密码」章节）。');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

# 本町咖啡积分系统 · 后端 + 前端

一个可以直接上线的 LINE 会员积分系统：顾客用 LINE 帐号登入、到店出示店员端的动态签到码领积分、
每次消费自动累积积分、结账时可以用积分折抵金额。包含三个角色：

- **顾客端**（`/`，手机视角）：LINE Login 登入、查看积分余额与消费记录、到店签到
- **店员收银台**（帐号密码登入）：显示动态签到码、收银结账（含积分折抵）、查看今日流水
- **商家后台**（管理员帐号登入）：营运总览图表、会员列表、积分规则设定、完整积分记录、员工帐号管理

技术栈：**Node.js + Express + PostgreSQL（Prisma ORM）**，前端是纯 HTML/CSS/JavaScript（无框架），
由同一个 Express 服务器直接提供静态档案，所以整个系统只需要部署「一个」Railway 服务。

---

## 目录结构

```
benmachi-backend/
├─ prisma/
│  ├─ schema.prisma      数据库结构（Member / StaffUser / Rule / CheckinCode / Transaction）
│  └─ seed.js            初始化脚本：建立预设积分规则 + 第一个管理员帐号
├─ public/                前端静态档案（Express 直接提供）
│  ├─ index.html
│  ├─ styles.css
│  └─ app.js
├─ src/
│  ├─ index.js            Express 入口
│  ├─ config.js           读取环境变量
│  ├─ db.js                Prisma Client 单例
│  ├─ middleware/          身份验证、错误处理
│  ├─ routes/              /api/auth  /api/me  /api/staff  /api/admin
│  ├─ controllers/         各路由的实际逻辑
│  ├─ services/            LINE OAuth、积分计算、签到码等共用逻辑
│  └─ utils/
├─ .env.example            环境变量范本
└─ package.json
```

---

## 一、本地开发（可选，想先在自己电脑测试再部署的话）

### 1. 准备 PostgreSQL

最快的方式是用 Docker 起一个本地数据库：

```bash
docker run --name benmachi-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=benmachi -p 5432:5432 -d postgres:16
```

没有 Docker 的话，也可以直接安装 PostgreSQL，或先跳过本地开发，直接照下面「部署到 Railway」的步骤，
Railway 会帮你开一个云端数据库，一样可以用。

### 2. 安装依赖并设定环境变量

```bash
cd benmachi-backend
npm install
cp .env.example .env
```

打开 `.env`，至少要确认：

- `DATABASE_URL` 指到你刚刚起的数据库（本地 Docker 的话就是 `.env.example` 里预设的那行）
- `JWT_SECRET` 换成一长串随机字符（可用 `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` 产生）
- `LINE_CHANNEL_ID` / `LINE_CHANNEL_SECRET` 先留空也没关系，顾客端的 LINE 登入会先不能用，
  但店员端 / 后台可以正常测试（见下方「二、申请 LINE Login」）

### 3. 建立数据表 + 建立第一个管理员帐号

```bash
npm run prisma:push   # 把 schema.prisma 的结构同步到数据库，建立所有资料表
npm run seed           # 建立预设积分规则 + 第一个管理员帐号（admin / benmachi2026，可在 .env 改）
```

### 4. 启动

```bash
npm run dev
```

打开 `http://localhost:3000`：

- 「店员收银台」「商家后台」可以直接用 `.env` 里 `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`
  （预设 `admin` / `benmachi2026`）登入测试
- 「顾客端」要等你设定好 LINE Login（见下一节）才能真正登入；在那之前会看到登入画面，
  按下按钮若显示「尚未设定 LINE_CHANNEL_ID / LINE_CHANNEL_SECRET」是正常的

---

## 二、申请 LINE Login（顾客端登入用）

1. 前往 [LINE Developers Console](https://developers.line.biz/console/)，用你的 LINE 帐号登入。
2. 建立一个 **Provider**（如果还没有的话），例如叫「本町咖啡」。
3. 在该 Provider 底下新建一个 **Channel**，类型选 **LINE Login**。
4. 填写 Channel 名称、说明、分类、email 等基本资料后建立。
5. 进入这个 Channel 的设定页：
   - 在 **Basic settings** 分页可以看到 **Channel ID** 和 **Channel secret**，先记下来。
   - 切到 **LINE Login** 分页，找到 **Callback URL**，填入：
     - 本地测试：`http://localhost:3000/api/auth/line/callback`
     - 正式上线（部署到 Railway 后）：`https://你的Railway网域/api/auth/line/callback`
     - 两个都可以先加进去（LINE Login 允许填多组 Callback URL，用换行分隔）
   - **App types** 记得勾选 **Web app**。
6. 把 Channel ID / Channel secret 填进 `.env`（本地）或 Railway 的环境变量（部署时，见下一节）里的
   `LINE_CHANNEL_ID` / `LINE_CHANNEL_SECRET`。

> 顾客第一次用 LINE 登入时，只会跳出「本町咖啡想取得你的个人资料（名称、头像）」的授权画面，
> 不需要额外审核就能给一般顾客使用；如果之后想上架成 LINE 官方帐号的选单连结、或需要更多权限，
> 才需要额外申请。

---

## 三、部署到 Railway

### 1. 把程序码放上 GitHub

在 `benmachi-backend` 目录下（这个资料夹本身就是一个完整的项目根目录）：

```bash
git init
git add .
git commit -m "本町咖啡积分系统"
```

到 GitHub 建一个新的 repository，然后照 GitHub 给的指示把它推上去（`git remote add origin ...` 、`git push`）。

> `.gitignore` 已经排除了 `node_modules/` 和 `.env`，不会把机密资料传上去。

### 2. 在 Railway 建立项目

1. 登入 [Railway](https://railway.app/)，点 **New Project**。
2. 选 **Deploy from GitHub repo**，授权后选刚刚建立的 repository。
3. Railway 会自动侦测到这是一个 Node.js 项目（靠 `package.json`），不用额外设定 build 指令；
   它会自动执行 `npm install`（也会一并跑 `postinstall` 里的 `prisma generate`）与 `npm start`。

### 3. 加一个 PostgreSQL

1. 在同一个 Railway 项目里点 **+ New** → **Database** → **Add PostgreSQL**。
2. Railway 会自动生成一个 `DATABASE_URL`，并且可以直接在你的服务里用「Variable Reference」的方式引用它，
   不用手动复制贴上：在你的 Node 服务的 **Variables** 分页，新增一个变量 `DATABASE_URL`，
   值填 `${{Postgres.DATABASE_URL}}`（Railway 的变量参照语法，Postgres 换成你的数据库服务名称）。

### 4. 设定环境变量

在 Node 服务的 **Variables** 分页，把下面这些都加上去（可以参考 `.env.example`）：

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | 参照 Railway 的 PostgreSQL（见上一步） |
| `APP_BASE_URL` | 部署好之后 Railway 给你的网域，例如 `https://benmachi-points-production.up.railway.app`（**不要**结尾加斜线） |
| `JWT_SECRET` | 一长串随机字符，正式环境务必换成自己产生的 |
| `STORE_TZ` | 门店时区，预设 `Asia/Taipei` |
| `LINE_CHANNEL_ID` / `LINE_CHANNEL_SECRET` | 第二节申请到的值 |
| `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | 第一个管理员帐号，之后可以在后台改密码或新增其他帐号 |
| `NODE_ENV` | 填 `production` |
| `PORT` | 不用设，Railway 会自动注入 |

> `APP_BASE_URL` 要先部署一次拿到 Railway 分配的网域后才知道，可以先随便填一个之后再回来改，
> 改完 Railway 会自动重新部署。之后也可以在 Railway 里换成你自己的网域（见下方「自订网域」）。

### 5. 第一次部署后：建立数据表 + 管理员帐号

Railway 服务部署起来之后，数据库还是空的，需要手动跑一次建表指令。在 Railway 项目页面找到
**Settings → 你的服务** 里的 **Shell**（或用本机安装 [Railway CLI](https://docs.railway.app/guides/cli)
执行 `railway login` → `railway link` 连结到你的项目后，在本机跑）：

```bash
railway run npm run prisma:push
railway run npm run seed
```

看到「已建立管理员帐号：xxx / xxx」就代表成功了。之后用这组帐号密码登入「商家后台」，
记得尽快到 **员工帐号** 分页新增自己要用的帐号、或至少改掉预设密码（见下方安全性备注）。

### 6. 回到 LINE Developers 补上正式的 Callback URL

拿到 Railway 分配的网域后，回到 LINE Login Channel 设定，把
`https://你的Railway网域/api/auth/line/callback` 加进 Callback URL 清单（可以跟本地那组并存）。

### 7. 完成

打开 `https://你的Railway网域`，三个角色都可以开始用了。之后每次 `git push`，
Railway 会自动重新部署（也可以在 Settings 关掉自动部署，改成手动触发）。

### 自订网域（选用）

Railway 服务的 **Settings → Networking** 可以加自订网域（例如 `points.你的商店.com`），
设定好 DNS 之后记得同步更新 `APP_BASE_URL` 环境变量，以及 LINE Login 的 Callback URL。

---

## 四、日常维运

- **调整积分规则**（消费兑换比例、签到积分、折抵比例上限、签到码有效期）：登入「商家后台 → 积分规则」，
  改了立刻生效，不用重新部署。
- **新增 / 删除店员或管理员帐号**：登入「商家后台 → 员工帐号」。删除帐号无法复原。
- **修改后台密码**：目前没有做密码修改的画面（只有创建帐号时设定），如果要改某个帐号的密码，
  最简单的方式是用 `railway run` 连进 Railway 执行一段小脚本，或直接删除旧帐号、新增一个同名新帐号。
  之后如果需要，可以再请我加一个「修改密码」的介面。
- **查看营运数据**：「商家后台 → 总览」有近 7 日积分发放/核销趋势图与关键指标；
  「积分记录」可以查全部历史纪录并依类型筛选。
- **修改 schema.prisma 后同步数据库**：改完欄位，本机执行 `npx prisma db push`（会直接套用到
  `.env` 指到的数据库），或部署后用 `railway run npm run prisma:push` 套用到正式环境。

---

## 五、环境变量总表

见 `.env.example`，每个变量都有中文注解。正式环境请务必：

1. `JWT_SECRET` 换成自己产生的长随机字符串（不要用范本里的值）。
2. `SEED_ADMIN_PASSWORD` 上线后尽快登入后台改用其他帐号，或至少确认这组预设帐密没有外流。
3. `NODE_ENV=production`，这样 cookie 会加上 `Secure` 旗标（只能透过 HTTPS 传送），Railway 预设就是 HTTPS。

---

## 六、安全性备注 / 之后可以再加强的地方

这套系统已经包含：密码用 bcrypt 加盐雜湊、JWT 存在 httpOnly cookie、店员/管理员登入有速率限制防暴力破解、
签到码由服务器端产生并有效期限制、SQL 皆透过 Prisma 参数化查询（无 SQL Injection 风险）。

如果之后要更进一步強化，可以考虑：

- **修改密码 / 忘记密码流程**：目前后端已经有 `POST /api/auth/staff/change-password` 这支 API，
  只是前端还没有画面，之后可以加一个「帐号设定」页面。
- **签到码防截图重复使用**：目前同一组码在有效期内可以被多人使用（例如顾客把画面截图传给朋友）；
  如果想更严谨，可以把签到码换成「店员帮每位顾客个别产生一次性验证码」的模式（第一轮沟通时讨论过的方案）。
- **审计纪录 / 操作纪录**：目前 `Transaction` 有记录是哪个店员处理的，但没有记录「谁改了积分规则」，
  未来可以再加一张 `AuditLog` 表。
- **多店铺支援**：目前设计是单一门店；如果之后要开分店，`Rule`、`CheckinCode` 需要改成每个门店一份，
  `Member` 也要能跨店共用积分或分开计算，这会是比较大的架构调整，需要再讨论。

---

## 七、常见问题

**Q: 顾客端按「使用 LINE 帐号继续」没反应或跳出「尚未设定 LINE_CHANNEL_ID」？**
A: 还没在 `.env`（本地）或 Railway 环境变量填 LINE_CHANNEL_ID / LINE_CHANNEL_SECRET，见第二节。

**Q: 部署后打开网站，API 都回「500」或「找不到资料表」？**
A: 忘记跑 `railway run npm run prisma:push` 建表，见第三节第 5 步。

**Q: LINE 登入跳回来变成「登入验证失败」？**
A: 通常是 Callback URL 没对上 —— 检查 LINE Developers 后台填的网址，跟 `APP_BASE_URL` 拼出来的
`{APP_BASE_URL}/api/auth/line/callback` 是否完全一致（包含 https、有没有结尾斜线）。

**Q: 想把「元」换成其他货币符号或单位？**
A: 全部集中在 `public/app.js` 里搜寻「元」字即可，是纯前端文字显示，不影响后端逻辑（后端只存数字）。

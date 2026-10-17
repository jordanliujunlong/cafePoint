# 本町咖啡积分系统 · 后端 + 前端

一个可以直接上线的 LINE 会员积分系统：顾客用 LINE 帐号登入、每天自己在手机上签到领积分（连续签到 5 天、10 天有额外奖励）、
每次消费自动累积积分、结账时可以用积分折抵金额。包含三个角色：

- **顾客端**（`/`，手机视角）：LINE Login 登入、查看积分余额与消费记录、每日签到（含连续签到进度）、出示会员二维码、邀请好友
- **店员收银台**（帐号密码登入）：扫描顾客的会员二维码后收银结账（含积分折抵）、查看今日流水
- **商家后台**（管理员帐号登入）：营运总览图表、会员列表、积分规则设定、完整积分记录、员工帐号管理

技术栈：**Node.js + Express + PostgreSQL（Prisma ORM）**，前端是纯 HTML/CSS/JavaScript（无框架），
由同一个 Express 服务器直接提供静态档案，所以整个系统只需要部署「一个」Railway 服务。

---

## 目录结构

```
benmachi-backend/
├─ prisma/
│  ├─ schema.prisma      数据库结构（Member / StaffUser / Rule / InviteCode / Transaction；CheckinCode 已停用）
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
│  ├─ services/            LINE OAuth、积分计算、连续签到规则等共用逻辑
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

Railway 服务部署起来之后，数据库还是空的，需要从你自己的电脑跑一次建表指令。

> ⚠️ **不要直接用 Railway 变量里的 `DATABASE_URL`**：它的主机名是 `postgres.railway.internal`，
> 这是 Railway 内部私有网络的地址，只有跑在 Railway 里的服务连得到；在你自己的电脑执行会出现
> `P1001: Can't reach database server at postgres.railway.internal:5432`。
> `railway run ...` 也一样（它只是把 Railway 的变量带到本机执行，主机名还是内部的）。
> 本机要连的是 **公开网址**：

1. Railway 项目里点 **Postgres 服务 → Variables**（或 **Connect** 分页），复制 **`DATABASE_PUBLIC_URL`**
   （样子像 `postgresql://postgres:密码@xxxx.proxy.rlwy.net:12345/railway`）。
2. 在本机项目资料夹，**只在这个终端窗口里**暂时覆盖 `DATABASE_URL`，然后跑两个指令：

   Windows PowerShell：

   ```powershell
   $env:DATABASE_URL = "贴上 DATABASE_PUBLIC_URL 的值"
   npm run prisma:push
   npm run seed
   ```

   macOS / Linux：

   ```bash
   export DATABASE_URL="贴上 DATABASE_PUBLIC_URL 的值"
   npm run prisma:push
   npm run seed
   ```

   （终端里已设定的环境变量会优先于 `.env` 档，所以不用改 `.env`；关掉终端就恢复。
   如果你习惯直接改 `.env`，做完记得改回去，并且不要把含密码的 `.env` 提交到 Git。）
3. 看到「Your database is now in sync with your Prisma schema」以及「已建立管理员帐号：xxx / xxx」
   就代表成功了。Railway 上跑的服务不需要改，它的 `DATABASE_URL` 继续用 `${{Postgres.DATABASE_URL}}`
   （内部网址，更快也不收对外流量费）。

之后用这组帐号密码登入「商家后台」，记得尽快到 **员工帐号** 分页新增自己要用的帐号、或至少改掉预设密码。

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

## 签到与连续奖励规则

- 顾客每天在手机上按一次「立即签到」，获得「每日签到积分」（预设 5 点，可在后台调整）。
- 连续签到第 **5** 天，当天额外加「第 5 天奖励」（预设 +5）；连续第 **10** 天，当天额外加「第 10 天奖励」（预设 +10）。
- 第 10 天领完后，连续天数重置，隔天重新从第 1 天算起；**中途漏签任何一天**，连续天数也会归零，下次签到从第 1 天算起。
- 「一天」以 `STORE_TZ`（预设 `Asia/Taipei`）的日期为准，过了午夜 00:00 就是新的一天。
- 奖励积分会在积分记录里单独列为「奖励」，基本签到积分列为「签到」。后台把某档奖励设为 0 就是关闭那一档。

> **从旧版升级的人请注意**：这个版本在数据库里新增了 3 个栏位（`Member.checkinStreak`、`Rule.streak5Bonus`、`Rule.streak10Bonus`），
> 都有预设值，不会动到现有资料。**部署新版程序码之前（或同时）**，要先在自己电脑上用 `DATABASE_PUBLIC_URL`
> 跑一次 `npm run prisma:push`（做法见第三节第 5 步），否则线上会因为缺少栏位而报错。
> 旧的 `CheckinCode` 数据表会保留但不再使用，这样 `prisma:push` 不会出现「删除数据表」的警告。

## 会员二维码与收银台扫码

**顾客端**：LINE 里「会员码」页面会显示一个二维码（首页右上角的「会员码」按钮，或底部的「会员码」标签）。
二维码每 60 秒自动换一张，每一张只有 90 秒有效，所以截图传给别人没有用。

**收银台**：打开「收银结账」，点「开启相机扫码」，对准顾客的二维码，识别成功后自动选定会员，接着输入订单金额、
决定是否用积分折抵、确认收款。也可以：

- 用 **USB / 蓝牙扫码枪**：光标停在「用扫码枪，或手动贴上会员码」那一栏（电脑和平板会自动停在那里），扫一下就会自动送出。
- 扫不了时，点「改用姓名或电话搜寻」临时选会员。

注意事项：

- 相机需要 **https** 网址（Railway 的网址本来就是 https）。第一次使用时，浏览器会问要不要允许相机，请选允许。
  iPhone 请用 Safari，Android 建议用 Chrome。
- 二维码内容是后端签名的临时凭证，用的是由 `JWT_SECRET` 衍生出的另一把密钥，不能拿来当登入凭证，也无法伪造；
  请务必把 `JWT_SECRET` 设成一长串随机字符。
- 这次新增了 `public/vendor/` 里的两个函式库（qrcode-generator、jsQR），已经放在项目里，不需要另外安装或连外部 CDN。
- （这个功能本身没有数据库变动；邀请码那一版才有，见下一节。）

## 邀请好友（邀请码）

- **每次消费**，收银台确认收款后，系统会为这位顾客产生一组 8 位邀请码（例如 `K7M4-Q9XT`），并显示在收银台画面上，
  店员口头告知或让顾客看画面即可；顾客也能随时在 LINE 首页的「邀请好友」里看到、复制邀请码或邀请链接。
- **只限新会员使用**：新朋友在登录页的「有邀请码？」栏位填入（或直接打开邀请链接 `/?invite=XXXXXXXX`），
  再用 LINE 帐号登入，**第一次加入成功**后，邀请人得 **100** 积分、新会员得 **200** 积分（另外还有原本的新会员礼 20 积分）。
  这两个数字可在「商家后台 → 积分规则」调整，设为 0 就是关闭。
- **一组码只能用一次**，用过就失效；**不能邀请自己**；已经是会员的人带码登入，不会消耗这组码，也拿不到奖励。
  多人同时抢同一组码时，只有一位会成功。
- 奖励会出现在双方的积分记录里（类型「奖励」）。
- 邀请码字母表不含容易看错的 `0 O 1 I`，8 位共约 1.1 万亿种组合，无法靠猜测命中；登入页检查码的接口也有速率限制。
- 无法完全防止有人用多个 LINE 帐号自己邀请自己领奖励，但每组码都要先有一笔真实消费才拿得到，成本不低；
  如果之后发现有人滥用，可以在后台加上「邀请奖励需被邀请人也有一笔消费才发放」之类的条件。

> **这一版有数据库变动**（新增 `InviteCode` 数据表、`Rule.inviterBonus`、`Rule.inviteeBonus`），都是新增、不会动到现有资料。
> 部署前请先在自己电脑上用 `DATABASE_PUBLIC_URL` 跑一次 `npm run prisma:push`（做法见第三节第 5 步），否则收银结账会报错。

## 四、日常维运

- **调整积分规则**（消费兑换比例、每日签到积分、连续 5 / 10 天奖励、折抵比例上限）：登入「商家后台 → 积分规则」，
  改了立刻生效，不用重新部署。
- **新增 / 删除店员或管理员帐号**：登入「商家后台 → 员工帐号」。删除帐号无法复原。
- **修改后台密码**：目前没有做密码修改的画面（只有创建帐号时设定），如果要改某个帐号的密码，
  最简单的方式是直接删除旧帐号、新增一个同名新帐号（「商家后台 → 员工帐号」）。
  之后如果需要，可以再请我加一个「修改密码」的介面。
- **查看营运数据**：「商家后台 → 总览」有近 7 日积分发放/核销趋势图与关键指标；
  「积分记录」可以查全部历史纪录并依类型筛选。
- **修改 schema.prisma 后同步数据库**：改完欄位，本机执行 `npx prisma db push`（会直接套用到
  `.env` 指到的数据库），或照第三节第 5 步，用 `DATABASE_PUBLIC_URL` 从本机套用到正式环境。

---

## 五、环境变量总表

见 `.env.example`，每个变量都有中文注解。正式环境请务必：

1. `JWT_SECRET` 换成自己产生的长随机字符串（不要用范本里的值）。
2. `SEED_ADMIN_PASSWORD` 上线后尽快登入后台改用其他帐号，或至少确认这组预设帐密没有外流。
3. `NODE_ENV=production`，这样 cookie 会加上 `Secure` 旗标（只能透过 HTTPS 传送），Railway 预设就是 HTTPS。

---

## 六、安全性备注 / 之后可以再加强的地方

这套系统已经包含：密码用 bcrypt 加盐雜湊、JWT 存在 httpOnly cookie、店员/管理员登入有速率限制防暴力破解、
每日签到由服务器端以门店时区判断日期（同一天只能签一次、并发重复点击也只会成功一次）、SQL 皆透过 Prisma 参数化查询（无 SQL Injection 风险）。

如果之后要更进一步強化，可以考虑：

- **修改密码 / 忘记密码流程**：目前后端已经有 `POST /api/auth/staff/change-password` 这支 API，
  只是前端还没有画面，之后可以加一个「帐号设定」页面。
- **签到不要求人在店内**：改成每日自助签到后，顾客在家里也能签到拿积分（这是目前的设计选择）。
  如果之后想限制「必须到店才能签」，可以再加回店内签到码、固定的店内 QR Code，或限制 IP / 定位。
- **审计纪录 / 操作纪录**：目前 `Transaction` 有记录是哪个店员处理的，但没有记录「谁改了积分规则」，
  未来可以再加一张 `AuditLog` 表。
- **多店铺支援**：目前设计是单一门店；如果之后要开分店，`Rule` 需要改成每个门店一份，
  `Member` 也要能跨店共用积分或分开计算，这会是比较大的架构调整，需要再讨论。

---

## 七、常见问题

**Q: 顾客端按「使用 LINE 帐号继续」没反应或跳出「尚未设定 LINE_CHANNEL_ID」？**
A: 还没在 `.env`（本地）或 Railway 环境变量填 LINE_CHANNEL_ID / LINE_CHANNEL_SECRET，见第二节。

**Q: 部署后打开网站，API 都回「500」或「找不到资料表」？**
A: 忘记建表，见第三节第 5 步（用 `DATABASE_PUBLIC_URL` 从本机跑 `npm run prisma:push`）。

**Q: 本机执行 `prisma db push` 出现 `P1001: Can't reach database server at postgres.railway.internal`？**
A: 那是 Railway 内部网址，本机连不到。改用 Postgres 服务里的 `DATABASE_PUBLIC_URL`，见第三节第 5 步。

**Q: LINE 登入跳回来变成「登入验证失败」？**
A: 通常是 Callback URL 没对上 —— 检查 LINE Developers 后台填的网址，跟 `APP_BASE_URL` 拼出来的
`{APP_BASE_URL}/api/auth/line/callback` 是否完全一致（包含 https、有没有结尾斜线）。

**Q: 想把「元」换成其他货币符号或单位？**
A: 全部集中在 `public/app.js` 里搜寻「元」字即可，是纯前端文字显示，不影响后端逻辑（后端只存数字）。

# 站点登录

访问站点需要先输入站点账号和密码，之后才能使用已连接的 TapTap 账号。所有业务页面、收益接口和账号管理接口均受服务端中间件保护。匿名接口请求返回 401，匿名页面请求跳转到 `/access`。

在服务器 `.env.production` 中配置以下变量，该文件不应提交到 Git：

- `SITE_AUTH_USERNAME`：站点账号名。
- `SITE_AUTH_PASSWORD_HASH`：`salt:hash`，盐为 16 个随机字节的十六进制字符串，哈希为 `scryptSync(password, salt, 64)` 的十六进制字符串。
- `SITE_AUTH_SECRET`：独立生成的随机签名密钥，至少 32 个字符。

可用 Node.js 的 `randomBytes(32).toString('hex')` 生成签名密钥。缺少有效配置时，业务页面和接口返回 503。修改账号、密码哈希或签名密钥后重启服务，已有会话随即失效。不要修改用于加密 TapTap Cookie 的 `SESSION_SECRET` 来轮换站点密码。

登录会话使用签名 Cookie，有效期为 7 天，启用 HttpOnly、SameSite=Lax，生产环境同时启用 Secure，需通过 HTTPS 登录。顶部“退出”按钮清除当前浏览器的站点会话，不删除服务器保存的 TapTap 账号。

同一来源地址在 15 分钟内登录失败 10 次后会被暂时限制。此限制存于当前服务进程内，重启会重置；多实例部署应改用共享限流存储。

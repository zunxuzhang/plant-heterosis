# Nginx 部署说明

这个站点是纯静态网站，不需要 Node.js、Python、数据库或后端服务。服务器只需要 Nginx。

## 1. 上传网站文件

需要保留以下结构：

```text
plant-heterosis/
├── index.html
├── styles.css
├── app.js
├── data.js
└── assets/
    └── leaf-mark.svg
```

Linux 常用目录：

```bash
sudo mkdir -p /var/www/plant-heterosis
sudo chown -R "$USER":"$USER" /var/www/plant-heterosis
```

然后把 `index.html`、`styles.css`、`app.js`、`data.js` 和 `assets/` 上传到该目录。

## 2. 添加 Nginx 站点配置

复制 `nginx.conf.example` 到 Nginx 配置目录，并把 `server_name` 与 `root` 改成服务器实际值。

Ubuntu / Debian：

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/plant-heterosis
sudo ln -s /etc/nginx/sites-available/plant-heterosis /etc/nginx/sites-enabled/plant-heterosis
sudo nginx -t
sudo systemctl reload nginx
```

RHEL / Rocky / AlmaLinux：

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/conf.d/plant-heterosis.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 3. 开放端口

云服务器安全组需要放行入方向 `TCP 80` 和 `TCP 443`。

Ubuntu / Debian 防火墙：

```bash
sudo ufw allow 'Nginx Full'
```

RHEL 系列防火墙：

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 4. 用浏览器访问

尚未绑定域名时：

```text
http://服务器公网IP
```

绑定域名后，在 DNS 服务商处添加 A 记录：

```text
@      -> 服务器公网IP
www    -> 服务器公网IP
```

DNS 生效后访问：

```text
http://example.com
```

## 5. 配置 HTTPS

域名解析生效后，在 Ubuntu / Debian 上执行：

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

Certbot 会自动修改 Nginx 配置并启用 HTTPS。

## Windows 服务器

Windows Nginx 的配置写法相同，但路径需要改成 Windows 格式，例如：

```nginx
root C:/nginx/html/plant-heterosis;
```

在 `nginx.exe` 所在目录执行：

```powershell
.\nginx.exe -t
.\nginx.exe
.\nginx.exe -s reload
.\nginx.exe -s stop
```

Windows 防火墙放行端口：

```powershell
New-NetFirewallRule -DisplayName "HTTP 80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS 443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

Windows 版 Nginx 默认不是系统服务。正式环境可使用 NSSM 或 WinSW 将 `nginx.exe` 注册为开机启动服务。

## 中国大陆服务器

使用中国大陆云服务器并通过域名提供网站服务时，通常需要完成 ICP 备案。备案完成前，可临时用“公网 IP + 浏览器”访问。

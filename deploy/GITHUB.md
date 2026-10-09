# 使用 GitHub 发布或部署

项目已经包含两套 GitHub Actions 工作流：

- `.github/workflows/pages.yml`：发布到 GitHub Pages，不需要自己的服务器。
- `.github/workflows/deploy-nginx.yml`：推送到 GitHub 后自动同步到 Nginx 服务器。

## 方案一：GitHub Pages

适合直接获得公网访问地址，不需要管理服务器。

1. 在 GitHub 新建仓库，例如 `plant-heterosis`。
2. 把项目文件推送到 `main` 分支。
3. 打开仓库的 `Settings` -> `Pages`。
4. 在 `Build and deployment` 中选择 `GitHub Actions`。
5. 等待 `Deploy Static Site to GitHub Pages` 工作流完成。
6. 访问：

```text
https://用户名.github.io/plant-heterosis/
```

如果仓库名称是 `用户名.github.io`，访问地址为：

```text
https://用户名.github.io/
```

## 方案二：GitHub 自动部署到 Nginx

该方案要求服务器能够通过 SSH、rsync 和 `sudo nginx` 完成部署。

先在服务器创建站点目录并配置 Nginx：

```bash
sudo mkdir -p /var/www/plant-heterosis
sudo chown -R "$USER":"$USER" /var/www/plant-heterosis
```

确认服务器用户可以不输入密码执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

然后在 GitHub 仓库的 `Settings` -> `Secrets and variables` -> `Actions` 添加：

| Secret | 示例 | 说明 |
| --- | --- | --- |
| `SERVER_HOST` | `123.45.67.89` | 服务器公网 IP 或域名 |
| `SERVER_PORT` | `22` | SSH 端口 |
| `SERVER_USER` | `ubuntu` | 部署用户 |
| `SERVER_SSH_KEY` | 私钥全文 | 能登录服务器的 SSH 私钥 |
| `SERVER_TARGET` | `/var/www/plant-heterosis` | Nginx 网站根目录 |

推送代码到 `main` 后，工作流会：

1. 通过 SSH 连接服务器。
2. 使用 `rsync` 同步静态文件。
3. 执行 `nginx -t` 检查配置。
4. 重载 Nginx。

服务器需安装：

```bash
sudo apt update
sudo apt install -y rsync openssh-server nginx
```

## 初始化 Git 并推送

在项目目录执行：

```powershell
git init -b main
git add .
git commit -m "Initial plant heterosis library"
git remote add origin https://github.com/用户名/plant-heterosis.git
git push -u origin main
```

GitHub 不再接受账户密码进行 Git 推送。推荐使用 GitHub CLI、GitHub Desktop、SSH Key 或 Personal Access Token。

## 注意事项

- GitHub Pages 上的站点是公开可访问的，即使源码仓库设置为私有。
- GitHub Pages 适合展示和访问，不适合运行后端程序或数据库。
- 使用自定义域名时，需要在 Pages 设置中填写域名，并在 DNS 服务商处配置相应记录。
- GitHub Actions 自动部署到 Nginx 时，务必只授予部署账号必要权限，不要使用 root 登录。

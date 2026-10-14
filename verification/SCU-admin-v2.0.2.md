# 后台重做与 SCU 部署验收：2.0.2

2026-10-14：以下两个账号已完成部署；线上健康接口均返回版本 2.0.2。发布源码提交为 6b5264e。

## 设计

本项目后台已重做为蓝白日程控制台，包括活动列表、活动编辑、分类管理、错误和确认状态。另一项目使用独立的结构与视觉系统。

设计技能参考：[frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)。实际打开并检查了 [Tabler 纵向布局](https://preview.tabler.io/layout-vertical.html) 与 [工作板示例](https://super211.github.io/kanban/)；对应源码为 [Tabler](https://github.com/tabler/tabler) 和 [Kanban 示例](https://github.com/super211/kanban)。前者借鉴侧栏和内容层级，后者借鉴状态分组；示例行业不同，均未直接复制其代码、数据或外部服务。

字体、照片及其原有许可证保留；未引入新的运行依赖。

## 账号与访问地址

| 账号 | 后台 | 实际版本标签 |
| --- | --- | --- |
| kzhao11 | https://24833154.it.scu.edu.au/scg-a3/admin/ | backend-v2.0.2-kzhao11 |
| tzhou14 | https://24833196.it.scu.edu.au/scg-a3/admin/ | backend-v2.0.2-tzhou14 |

## 发布与数据保留

- 使用用户现有 Chrome，分别重新登录并核对 Current User、Primary Domain 与 Home Directory。
- 每个账号先校验上一版本全部运行文件，再将 adminside 和两个包版本文件备份至 /home/账号/.site-backups/scg-a3-admin-v2.0.1-20261014.tar.gz。
- 只解压 7 个后台及版本文件，随后通过现有应用的 api/tmp/restart.txt 重启。未重新导入 SQL，未安装新依赖。
- 发布后 36 个运行文件的 SHA-256 均与本地运行包清单一致；每个账号的发布前后数据库每张表完整行摘要一致。
- 每个账号均保留10 个活动、11 条报名、22 张票。私有 .env 文件摘要及 0600 权限均一致。
- 公共网站文件与上一版本清单逐项一致。运行包的文件名、文本与照片元数据扫描通过，项目文档、测试、工具及私有凭据未包含在发布包中。

## 验证

- Node 18：8 项测试通过。浏览器检查搜索、状态筛选、编辑与分类；本地检查保存、校验与重置。
- 四个线上后台均能加载真实活动；浏览器记录无脚本错误、无损坏照片。两套实际编辑页面显示原有报名信息。
- 390 像素手机视口验证：列表、编辑与分类均无页面水平溢出；验证结束后恢复默认浏览器视口。

## 发布包摘要

| 账号 | 文件数 | SHA-256 |
| --- | --- | --- |
| kzhao11 | 7 | 42169932687b71cf3ff1986d6b00a6a74f15d5750bf658d1062db78f2d369de7 |
| tzhou14 | 7 | 42169932687b71cf3ff1986d6b00a6a74f15d5750bf658d1062db78f2d369de7 |

## 证据

- kzhao11：[发布前](scu-admin-v2.0.2/kzhao11-before.jpg)、[发布后](scu-admin-v2.0.2/kzhao11-after.jpg)、[实际后台](scu-admin-v2.0.2/kzhao11-admin.jpg)。
- tzhou14：[发布前](scu-admin-v2.0.2/tzhou14-before.jpg)、[发布后](scu-admin-v2.0.2/tzhou14-after.jpg)、[实际后台](scu-admin-v2.0.2/tzhou14-admin.jpg)。
- [实际编辑页](scu-admin-v2.0.2/kzhao11-editor.jpg)、[实际手机页面](scu-admin-v2.0.2/kzhao11-mobile.jpg)。

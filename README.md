# 北境季风

以山河、季风与云海为灵感的云端盛宴预约网站。

公开入口：https://north-monsoon-atelier.onrender.com/

听风入境：同一批粒子从远近叠落的山脊卷入风暴，在近处舒展羽翼，再归入月下水面。滚动控制连续形变与镜头运动，时间驱动光流。所有几何和运动由 `scripts/compose-wind.mjs` 生成，不读取图片或模型。CPU 与 GPU 使用同一份几何定义。Canvas 渲染复用轨迹位置和视图变换，页面不可见时暂停，并遵循减少动态效果的系统设置。

本地检查：`npm run check`；构建：`npm run build`；测试：`npm test`。


## 两个独立版本

- 山河珍藏（经典优化版）：网站根目录，默认雪山云海首屏。
- 月下回响（动漫融入版）：`/encore/`，单独编译的入口和资源；没有运行时切换开关。
- `npm run build` 同时构建两个入口；`npm run build:classic` / `npm run build:reverie` 只构建指定版本。
- `edition.json` 为独立包的默认版本；独立包使用 `npm run build:single` 也能重建同一版。

两版使用已有订单 API（`/api/*`）和同一订单后台；页面文字不同，料理 ID 仍为 `mist/wind/cloud`。部署为纯静态站时，需要沿用现有的 `/api/*` 转发和 `/admin` 到 `admin.html` 的重写规则。独立包中包含源码、已构建 `dist/`、环境变量示例和部署说明，不包含任何口令或真实订单数据。

## 视觉设计与彩蛋

两版共用深墨蓝、月白、暖金、宋体标题、细线雕刻。首屏为独立绘制的雪山云海场景；粒子只出现在风土之旅。粒子新增远景空气、近景柔焦、纵深衰减和鼠标视差，仍使用同一固定种子池连续演化，支持 Canvas 回退和减少动态设置。

月下回响的原创细线图案和文案分别呼应：MyGO 的《春日影》与拾石、迷宫饭的行走菇和旅途料理、金牌得主的祈与光及冰刀奖牌、Ave Mujica 的五张面具和五个舞台名。没有使用动画截图、原作角色立绘、原曲或自动播放音频。
参考：
- https://anime.bang-dream.com/mygo/story/
- https://bang-dream.com/artist/avemujica/
- https://delicious-in-dungeon.com/recipe.html
- https://medalist-pr.com/tv/character-s1.html

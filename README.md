# 北境季风

以山河、季风与云海为灵感的云端盛宴预约网站。

公开入口：https://north-monsoon-atelier.onrender.com/

听风入境：同一批粒子从远近叠落的山脊卷入风暴，在近处舒展羽翼，再归入月下水面。滚动控制连续形变与镜头运动，时间驱动光流。所有几何和运动由 `scripts/compose-wind.mjs` 生成，不读取图片或模型。CPU 与 GPU 使用同一份几何定义。Canvas 渲染复用轨迹位置和视图变换，页面不可见时暂停，并遵循减少动态效果的系统设置。

本地检查：`npm run check`；构建：`npm run build`；测试：`npm test`。

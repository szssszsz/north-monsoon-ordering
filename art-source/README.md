# 山河有信

画稿采用内置图像创作生成，原图为 [monsoon-master.png](./monsoon-master.png)。网站不把四张图片淡入淡出，而是把画面的明暗分布转换成固定数量的光点，由同一组粒子沿连续曲线迁移。位置、颜色与近远关系都来自画稿；粒子的身份、数量、透明度和尺寸在整段叙事中保持不变。

四幕依次为：月照雪岭、风过沙海、鹤渡云霞、山水归光。前两幕由冷转暖，第三幕展开霞色，最后在水面倒影中收束。版面以诗句和留白陪衬画面。

`scripts/bake-art.py` 使用 Pillow 与 NumPy，把原图转换为两个不透明 PNG 数据纹理。Hilbert 顺序的等质量映射让每幅画都有相同数量的目标点，邻近的粒子尽量一起迁移。运行时不需要 Python，也不使用外部图片服务。

## 画稿生成提示词

Use case: stylized-concept. Asset type: a single four-panel master painting atlas for an ultra-refined Chinese landscape particle artwork on a luxury nature-inspired dining website. Create ONE 1536x1024 image, exactly four equal 768x512 landscape paintings in a seamless 2x2 grid, no margins or dividers. Each quadrant is a complete, separately readable composition. This is one coherent cycle of poetic landscapes: top left 'moon over snow ridges', top right 'wind crosses the golden desert', bottom left 'cloud tides catch the rose dawn', bottom right 'sunlight returns to a secluded mountain water'. No text anywhere.

Fine-art direction: exquisite contemporary Chinese shanshui, mineral-pigment painting and delicate gold-leaf engraving on deep midnight ink, with the cinematic depth and restraint of an exceptional luxury art installation. Masterful asymmetric composition, solid vs empty space, layers of far and near, hazy atmospheric perspective, extremely fine luminous contours, rich natural detail, painterly and emotionally evocative rather than 3D synthetic sculpture. All four paintings must share a very dark midnight-navy background with the outer 8% of every quadrant dissolving organically into almost black #030b15, not rectangular painted frames. Light, mist, dunes and mountains must have clear natural silhouettes and soft luminous brushwork. Most of the detail should be in the middle 70% of each quadrant, with a generous open sky and elegant quiet gaps.

TOP LEFT: a small pearl moon off-centre to the right, a majestic jagged snow massif on the left, cascading fine silver-blue ridges receding into jade darkness on the right, very thin mist meandering through the valley like a breath. Glacial ivory, celadon, midnight blue, tiny champagne touches.

TOP RIGHT: the mountain slopes have become a vast desert of subtly illuminated flowing dunes, wind traces in pale champagne and muted copper, a faint far-off blue mountain, the small moon now lower, a breathtaking sweep of space.

BOTTOM LEFT: an immense sea of softly billowing clouds seen from a high cliff, luminous lavender, pale rose, celadon and mother-of-pearl, a restrained amber light on the horizon, a tiny pair of distant white cranes as two delicate brush marks over the far mist; no giant birds.

BOTTOM RIGHT: mountain silhouettes part around a quiet lake and low clouds, a small pale-gold sun to the left, a narrow broken golden reflection draws the eye into the distance, rich dark jade shores, warm champagne lit mist, the mood of arriving somewhere exceptionally private and serene.

Constraints: gallery-level beauty, emotional stillness, palpable natural atmosphere; no food, tables, buildings, labels, calligraphy, logos, borders, typography, watermarks, neon sci-fi, laser beams, particle dots, geometric torus rings, ribbons, wireframes, plastic 3D mountains, mirrored symmetry, or obvious model-like sculpture.

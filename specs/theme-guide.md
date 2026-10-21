# Visual Design Guide: 孩子气真心话大冒险卡牌游戏

## 1. 核心设计原则 (Design Principles)

**品牌与情绪目标 (Brand & Emotional Goals)**
- **Playful (顽童感)**：保留真实桌游的“孩子气”，消除严肃感。
- **Intimate (亲密破冰)**：通过手绘涂鸦和温和的色彩，营造朋友聚会、轻松对谈的安全感氛围。
- **Tactile (物理触感)**：强烈的“纸牌”隐喻，从签桶中抽出的实体签条体验。

**视觉方向设定 (Visual Direction)**
- **Track**: Reference Extraction (基于提供的实体卡牌进行高保真数字化)
- **Layout Vibe**: UTILITY (专注单卡牌信息呈现，高密度排版但视觉整洁)
- **Corner Philosophy**: SOFT (卡牌与按钮圆角设定在 16px，强化亲和力)
- **Accent Temperature**: WARM (核心色为 Crimson Red #CC1B1B)
- **Depth Strategy**: LAYERED (需要表现卡牌叠加在签桶背景上的物理景深)
- **Register**: Energy: Playful | Finish: Raw (手绘元素) | Density: Dense (信息密集) | Weight: Light (卡片感) | Seriousness: Playful

## 2. 色彩系统 (Color Palette)

完全基于实体卡牌提取的 60/30/10 法则。

- **Primary Accent (`colors.brand.primary`)**: Crimson Red `#CC1B1B` (卡牌背面主色、正面强调色、Logo)
- **Surface Front (`colors.surface.front`)**: Cream/Off-white `#F5F0EB` (带有轻微暖色调的米白，模拟纸张)
- **Surface Back (`colors.surface.back`)**: Crimson Red `#CC1B1B` (背面背景)
- **Text Primary (`colors.text.primary`)**: Near Black `#1A1A1A` (正面问题大字)
- **Text Secondary (`colors.text.secondary`)**: Dark Gray `#666666` (英文翻译、辅助说明)
- **Text Inverse (`colors.text.inverse`)**: White `#FFFFFF` (背面纯白文字，及正面红底白字区域)
- **Doodle Outline Light (`colors.border.doodle-light`)**: Light Gray `#E5DFD8` (正面手绘纹理)
- **Doodle Outline Dark (`colors.border.doodle-dark`)**: Dark Red `#B31616` (背面手绘纹理，或使用白色的透明度)

## 3. 排版系统 (Typography)

**比例约束 (Ratio: Major Third 1.250)**
- Body Base: 16px
- `caption` (13px): 辅助英文、替换词英文 (`text-secondary`)
- `body` (16px): 替换词中文内容
- `body-lg` (20px): `替换词：` 小标题
- `h3` (25px): (备用)
- `h2` (31px): 卡牌主问题 (加粗，行高紧凑)
- `h1` (39px): (备用)
- `display` (61px): (备用)

**字体家族 (Font Families)**
- **Latin (Google Fonts)**: `Manrope` (现代、几何感略带圆润，适合双语排版)
- **CJK (emfont)**: `jfOpenHuninn` (jf open 粉圓) — 强烈推荐。完美契合“孩子气”品牌名，圆润的黑体不仅保留了可读性，还极大地增强了卡牌的顽皮感和聚会轻松感。
  - *Fallback*: `ui-sans-serif, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif`

## 4. 组件配方 (Component Recipes)

### 卡牌主体 (Card Container)
**默认状态**: 
```css
/* Card Front */
bg-[#F5F0EB] text-[#1A1A1A] rounded-[16px] shadow-lg border border-black/5 overflow-hidden relative aspect-[1/3.5] flex flex-col justify-between p-snug
/* 添加伪元素或背景图实现 Doodle 纹理 */
bg-[url('/doodle-pattern-light.svg')] bg-repeat
```

```css
/* Card Back */
bg-[#CC1B1B] text-[#FFFFFF] rounded-[16px] shadow-lg border border-white/10 overflow-hidden relative aspect-[1/3.5] flex flex-col justify-between p-snug
bg-[url('/doodle-pattern-dark.svg')] bg-repeat
```

**交互状态**:
- **Hover/Active (翻牌区)**: 卡牌作为一个整体是可点击的翻转触发器。`cursor-pointer transition-transform duration-300 ease-out active:scale-[0.98]`
- **3D 翻转包裹器 (Wrapper)**: 需要 `perspective: 1000px`，内部正反两面 absolute 定位并使用 `backface-visibility: hidden`。

### 底部操作按钮 (Bottom Action CTA - "再抽一张")
**默认状态**:
```css
bg-white text-[#CC1B1B] font-bold text-body-lg rounded-full py-snug px-comfortable shadow-[0_4px_12px_rgba(204,27,27,0.2)] border-2 border-[#CC1B1B] flex items-center justify-center gap-2 transition-all duration-200
```
**Hover/Active**:
```css
hover:-translate-y-[2px] hover:shadow-[0_6px_16px_rgba(204,27,27,0.3)]
active:translate-y-0 active:scale-[0.98] active:shadow-[0_2px_8px_rgba(204,27,27,0.2)]
```

## 5. 动效与行为 (Motion & Behavior)

**Motion Purpose Test**: 
- **Guidance & Brand Expression**: 抽签动画是核心体验。从底部/签桶位置“拔出”卡牌飞向屏幕中央。
- **Feedback**: 卡牌翻面 3D 动画，直接响应用户点击。

**抽签出场 (Draw Animation)**:
```css
/* 从屏幕下方飞入并放大 */
@keyframes card-draw {
  from {
    transform: translateY(100vh) scale(0.5) rotate(-5deg);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1) rotate(0deg);
    opacity: 1;
  }
}
/* Spring 参数参考: stiffness: 200, damping: 20 (带有轻微的抽出惯性) */
```

**翻面动画 (Flip Animation)**:
```css
/* Y轴翻转 */
.flip-container { transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
.flipped { transform: rotateY(180deg); }
```

## 6. 质量审核点 (Quality Gate)

- [x] **色彩**: 纯正提取的红色 #CC1B1B 与米白底色，无任何紫色/赛博朋克 AI 痕迹。
- [x] **字体**: 统一的比例缩放 (Major Third)，明确分离了中英文字体栈。
- [x] **排版层级**: 忠实还原了实体卡牌极高密度的信息层级（小眉批 -> Logo -> 问题 -> 英文 -> 替换词模块）。
- [x] **交互**: 保留了真实纸牌的触感（3D翻转，active:scale-[0.98]）。

## 7. 注意事项 (Implementation Notes)

- 背景的手绘涂鸦 (Doodle) 对于还原参考至关重要。实现阶段需预备相应的 SVG Pattern 或使用 CSS 混合模式处理透明度图案，作为 `bg-image` 铺在卡牌底层。
- 卡牌的长宽比非常修长（近似 1:3.5 到 1:4 的签条形），在移动端需使用 `max-height` 或 `aspect-ratio` 限制，确保在小屏手机上一屏能完整展示而无需内部滚动。

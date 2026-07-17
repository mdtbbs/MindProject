# MindProject CNB 主部署链路设计文档

**日期:** 2026-07-17
**主题:** 让当前生产主链路从 CNB 拉取时不再触发 EasyManager 子模块
**状态:** 已确认

---

## 一、背景与目标

当前 `MindProject` 根仓库已经把主生产链路中的两个关键子模块切到了 CNB：

- `MindAuth` → CNB
- `MindFourm` → CNB

但根仓库仍然保留了 `EasyManager` 子模块，并且部分部署命令还在使用：

```bash
git pull --recurse-submodules
git submodule update --init --recursive
```

这会导致服务器即使只想部署当前实际启用的主链路，也仍然尝试递归触发 `EasyManager`，从而重新依赖 GitHub，不符合“当前上线链路尽量走 CNB”的目标。

### 目标

本次仅整理 **当前生产实际使用的主部署链路**，目标是：

1. 服务器从 **CNB 的 `MindProject`** 拉取根仓库
2. 子模块初始化时 **只拉 `MindAuth` 和 `MindFourm`**
3. 当前生产部署流程 **不再因为 `EasyManager` 被递归初始化而触发 GitHub 访问**
4. 不扩大到暂停模块的仓库治理，不改 `EasyManager` 的仓库归属和恢复方案

### 非目标

本次不做以下事项：

- 不移除 `EasyManager` 子模块定义
- 不把 `EasyManager` 迁移到 CNB
- 不处理 `download-site` / MindFileList 的仓库镜像策略
- 不恢复 EasyManager 的功能、脚本或部署链路
- 不重构根仓库结构

---

## 二、已评估方案

### 方案 A1：仅收紧当前生产拉取链路（采用）

保留现有 `.gitmodules` 结构不变，但将部署入口改为 **显式只初始化 `MindAuth` 和 `MindFourm`**，不再使用 `--recursive`。

**优点：**
- 改动最小
- 与当前“EasyManager 暂停”状态一致
- 不触碰暂停模块的仓库管理策略
- 能直接解决生产服务器从 CNB 拉取时误触 `EasyManager` 的问题

**缺点：**
- 根仓库中仍然存在 `EasyManager` 子模块定义
- 需要把部署文档和脚本写清楚，避免后续再次使用 `--recursive`

### 方案 A2：把 EasyManager 也切到 CNB

保留递归拉取方式，但把 `.gitmodules` 中的 `EasyManager` URL 也换成 CNB。

**优点：**
- 用户依然可以继续使用递归子模块命令
- 部署入口不需要改使用方式

**缺点：**
- 已超出这次只整理当前生产链路的范围
- 会触碰暂停模块治理边界

### 方案 A3：彻底移除 EasyManager 子模块

从根仓库移除 `EasyManager`，只保留当前活跃服务子模块。

**优点：**
- 根仓库边界最清晰
- 递归拉取不会再踩坑

**缺点：**
- 属于更大的仓库结构决策
- 不符合这次“只做当前上线链路最小整理”的范围

### 方案结论

采用 **方案 A1：仅收紧当前生产拉取链路**。

---

## 三、设计概览

### 目标状态

调整后，生产部署链路应为：

1. 服务器从 CNB clone / pull 根仓库 `MindProject`
2. 部署脚本和部署文档都不再使用递归子模块命令
3. 子模块初始化改为显式指定：
   - `MindAuth`
   - `MindFourm`
4. `EasyManager` 保持留在 `.gitmodules` 中，但不属于当前生产主链路
5. `download-site` 继续作为独立仓库，不纳入本次根仓库部署链路

### 设计原则

- **最小改动**：只改会影响生产拉取链路的脚本和文档
- **不扩大范围**：不触碰暂停模块的仓库策略
- **让正确做法默认可见**：把部署入口写成显式的双子模块初始化方式
- **避免隐式递归**：去掉会自动碰到 `EasyManager` 的命令

---

## 四、具体改动范围

### 1. 部署脚本

**文件：`deploy.sh`**

将以下命令：

```bash
git pull --recurse-submodules
git submodule update --init --recursive
```

替换为只面向当前生产主链路的显式命令，例如：

```bash
git pull
git submodule update --init MindAuth MindFourm
git submodule update --remote MindAuth MindFourm
```

这样部署时不会再递归触发 `EasyManager`。

> 具体是否保留 `--remote`，由实施时根据根仓库是否依赖固定子模块指针来决定；无论哪种写法，都必须保证**不会递归拉取 EasyManager**。

### 2. 部署文档

**文件：`DEPLOYMENT.md`**

需要把所有示例命令中的递归子模块拉取方式改为：

- clone 根仓库后，只初始化 `MindAuth` 和 `MindFourm`
- 更新代码时，只更新当前生产主链路需要的两个子模块

文档中还应明确说明：

- `EasyManager` 当前不属于生产部署链路
- `download-site` 继续独立部署
- 不要使用 `git submodule update --init --recursive` 作为当前生产部署默认命令

### 3. 文案边界

本次不修改 `.gitmodules`，因为 A1 的核心不是改变仓库结构，而是改变 **部署入口行为**。

因此文档必须清楚表达：

- 仓库里仍然存在 `EasyManager` 子模块定义
- 但生产部署时应只初始化 `MindAuth` 和 `MindFourm`

---

## 五、执行顺序

### 第一步：修改部署脚本

先把 `deploy.sh` 中会递归触发全部子模块的命令替换掉，确保脚本本身不再碰 `EasyManager`。

### 第二步：修改部署文档

同步更新 `DEPLOYMENT.md` 中的 clone / update 指令与注意事项，使人工部署和脚本部署保持一致。

### 第三步：验证主链路命令表达

确认仓库中对外暴露的主部署命令已经变成：

- `git clone <CNB MindProject>`
- `git submodule update --init MindAuth MindFourm`

并且不存在把当前生产部署继续引向 `--recursive` 的文档主路径。

---

## 六、验证标准

完成后应满足以下标准：

### 部署入口成功标准

- `deploy.sh` 不再使用 `git pull --recurse-submodules`
- `deploy.sh` 不再使用 `git submodule update --init --recursive`
- `DEPLOYMENT.md` 中的主路径命令不再要求递归初始化所有子模块

### 生产链路成功标准

- 当前生产部署只需要：
  - `MindProject`
  - `MindAuth`
  - `MindFourm`
- 当前生产链路不会因为默认命令而访问 `EasyManager`

### 范围控制成功标准

- `.gitmodules` 保持不动
- `EasyManager` 仍为暂停模块
- 不把 `download-site` 纳入本次根仓库主拉取链路

---

## 七、回退与后续扩展

### 回退

如果需要恢复旧行为，只需把部署脚本和文档中的显式双子模块初始化方式改回递归命令即可。但这会重新把 `EasyManager` 引回默认部署路径。

### 后续扩展方向

如果未来希望真正做到“根仓库递归拉取也完全 CNB 化”，再单独做以下其一：

1. 把 `EasyManager` 子模块也迁移到 CNB
2. 从根仓库彻底移除 `EasyManager` 子模块
3. 为 `download-site` 建立 CNB 镜像并补齐完整部署文档

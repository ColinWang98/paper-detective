# arXiv论文下载指南 - Golden Dataset扩展

**Date**: 2026-02-10
**Purpose**: Download 5 new papers for Golden Dataset testing
**Status**: Ready for download

---

## 📋 待下载论文清单

### 1. ResNet (Computer Vision)

**Title**: "Deep Residual Learning for Image Recognition"
- **Authors**: Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun
- **Year**: 2015
- **Venue**: CVPR 2016
- **arXiv**: https://arxiv.org/abs/1512.03385
- **PDF**: https://arxiv.org/pdf/1512.03385.pdf
- **Citations**: 160,000+
- **Domain**: CV (Computer Vision)

**下载命令**:
```bash
cd tests/fixtures/pdfs
curl -L -o resnet.pdf "https://arxiv.org/pdf/1512.03385.pdf"
```

**预期Clue Cards**:
- Hypothesis: "Deep residual learning can ease training of very deep networks"
- Method: "Residual learning framework with skip connections"
- Finding: "ResNet-152 achieves 3.57% top-5 error on ImageNet (28% relative improvement)"

---

### 2. U-Net (Medical Imaging / Interdisciplinary)

**Title**: "U-Net: Convolutional Networks for Biomedical Image Segmentation"
- **Authors**: Olaf Ronneberger, Philipp Fischer, Thomas Brox
- **Year**: 2015
- **Venue**: MICCAI 2015
- **arXiv**: https://arxiv.org/abs/1505.04597
- **PDF**: https://arxiv.org/pdf/1505.04597.pdf
- **Citations**: 70,000+
- **Domain**: Bioinformatics / CV (跨学科)

**下载命令**:
```bash
cd tests/fixtures/pdfs
curl -L -o unet.pdf "https://arxiv.org/pdf/1505.04597.pdf"
```

**预期Clue Cards**:
- Hypothesis: "Encoder-decoder architecture with skip connections can segment biomedical images"
- Method: "U-shaped architecture with contracting and expanding paths"
- Finding: "Wins ISBI cell tracking challenge 2015 with 92% overlap"

---

### 3. BioBERT (Biomedical NLP)

**Title**: "BioBERT: a pre-trained biomedical language representation for biomedical text mining"
- **Authors**: Jinhyuk Lee et al.
- **Year**: 2019
- **Venue**: Bioinformatics
- **arXiv**: https://arxiv.org/abs/1901.08746
- **PDF**: https://arxiv.org/pdf/1901.08746.pdf
- **Citations**: 3,000+
- **Domain**: Bioinformatics / NLP (跨学科)

**下载命令**:
```bash
cd tests/fixtures/pdfs
curl -L -o biobert.pdf "https://arxiv.org/pdf/1901.08746.pdf"
```

**预期Clue Cards**:
- Hypothesis: "Domain-specific pre-training improves biomedical text mining performance"
- Method: "BERT pre-trained on PubMed abstracts and PMC full-text articles"
- Finding: "BioBERT achieves state-of-the-art on BC5CDR-disease, NCBI-disease, JNLPBA"

---

### 4. YOLO (Object Detection)

**Title**: "You Only Look Once: Unified, Real-Time Object Detection"
- **Authors**: Joseph Redmon, Santosh Divvala, Ross Girshick, Ali Farhadi
- **Year**: 2015
- **Venue**: CVPR 2016
- **arXiv**: https://arxiv.org/abs/1506.02640
- **PDF**: https://arxiv.org/pdf/1506.02640.pdf
- **Citations**: 30,000+
- **Domain**: CV (Computer Vision)

**下载命令**:
```bash
cd tests/fixtures/pdfs
curl -L -o yolo.pdf "https://arxiv.org/pdf/1506.02640.pdf"
```

**预期Clue Cards**:
- Hypothesis: "Object detection can be framed as a single regression problem"
- Method: "Single neural network predicts bounding boxes and class probabilities"
- Finding: "YOLO achieves 45 FPS on mAP 63.4 on PASCAL VOC 2007"

---

### 5. Graph Neural Networks Survey (Survey Paper)

**Title**: "A Comprehensive Survey on Graph Neural Networks"
- **Authors**: Zonghan Wu et al.
- **Year**: 2020
- **Venue**: IEEE TNNLS (or arXiv survey)
- **arXiv**: https://arxiv.org/abs/1901.00596 (example)
- **PDF**: https://arxiv.org/pdf/1901.00596.pdf
- **Citations**: 5,000+
- **Domain**: ML / Systems (综述论文)

**下载命令**:
```bash
cd tests/fixtures/pdfs
curl -L -o gnn-survey.pdf "https://arxiv.org/pdf/1901.00596.pdf"
```

**预期Clue Cards**:
- Hypothesis: "GNNs can be categorized into spectral and spatial approaches"
- Method: "Survey methodology: systematic review of GNN literature"
- Finding: "Identified 4 main GNN families: GCN, GAT, GraphSAGE, GIN"

---

## 🔽 批量下载脚本

### Windows (PowerShell)

```powershell
# 创建目录
New-Item -ItemType Directory -Force -Path "tests/fixtures/pdfs"

# 下载论文
cd tests/fixtures/pdfs

Invoke-WebRequest -Uri "https://arxiv.org/pdf/1512.03385.pdf" -OutFile "resnet.pdf"
Invoke-WebRequest -Uri "https://arxiv.org/pdf/1505.04597.pdf" -OutFile "unet.pdf"
Invoke-WebRequest -Uri "https://arxiv.org/pdf/1901.08746.pdf" -OutFile "biobert.pdf"
Invoke-WebRequest -Uri "https://arxiv.org/pdf/1506.02640.pdf" -OutFile "yolo.pdf"
Invoke-WebRequest -Uri "https://arxiv.org/pdf/1901.00596.pdf" -OutFile "gnn-survey.pdf"

# 验证下载
Get-ChildItem -Filter *.pdf | Format-Table Name, Length
```

### Linux/macOS (Bash)

```bash
# 创建目录
mkdir -p tests/fixtures/pdfs

# 下载论文
cd tests/fixtures/pdfs

curl -L -o resnet.pdf "https://arxiv.org/pdf/1512.03385.pdf"
curl -L -o unet.pdf "https://arxiv.org/pdf/1505.04597.pdf"
curl -L -o biobert.pdf "https://arxiv.org/pdf/1901.08746.pdf"
curl -L -o yolo.pdf "https://arxiv.org/pdf/1506.02640.pdf"
curl -L -o gnn-survey.pdf "https://arxiv.org/pdf/1901.00596.pdf"

# 验证下载
ls -lh *.pdf
```

---

## 📊 领域分布更新

### 下载后的最终分布 (10-11篇):

| Domain | Count | Papers |
|--------|-------|--------|
| **Computer Science** | **6-7** (60-70%) | Transformer, BERT, GPT-3, Attention, ResNet, YOLO, GNN Survey |
| **Biomedical** | **2** (20%) | U-Net, BioBERT |
| **Interdisciplinary** | **2** (20%) | U-Net (Bio+CV), BioBERT (Bio+NLP) |

**语言分布**:
- English: 10-11 papers
- Chinese: 0 papers (可从团队贡献获取)

**论文类型**:
- Research: 8-9 papers
- Survey: 1-2 papers (GNN Survey)

---

## ✅ 下载验证清单

下载完成后，请验证每篇论文:

- [ ] **resnet.pdf** - 文件大小 ~2MB
- [ ] **unet.pdf** - 文件大小 ~3MB
- [ ] **biobert.pdf** - 文件大小 ~2MB
- [ ] **yolo.pdf** - 文件大小 ~2MB
- [ ] **gnn-survey.pdf** - 文件大小 ~5MB

**PDF质量检查**:
1. 使用PDF.js打开每篇论文
2. 验证文本层可提取（不是扫描图片）
3. 验证页码正确
4. 验证图表/公式清晰

---

## 🔄 下一步

**下载完成后**:
1. 验证PDF质量（使用PDF.js）
2. 提取文本内容（使用PDF text extraction service）
3. 开始标注工作（Day 15-17）

**团队贡献论文**（Day 15收集）:
- Senior-developer: 系统架构论文
- Frontend-engineer: 前端技术论文
- HCI-researcher: HCI/UX论文
- Planner: 项目管理论文
- Code-reviewer: 软件工程论文

---

**准备开始下载！** 🚀

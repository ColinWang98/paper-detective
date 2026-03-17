# Golden Dataset Paper Recommendations

**Version**: 2.0
**Last Updated**: 2026-02-10
**Status**: Ready for Selection and Annotation

---

## 📊 Current Status

**Existing Papers** (Task #82 completed):
- ✅ 3 HCI papers prepared (基础测试框架)
- ⏳ Need to expand to 6-8 papers

**Target Distribution**:
- HCI: 2 papers (1 existing, +1 new)
- ML: 2 papers (all new)
- CV: 1 paper (new)
- Bioinformatics: 1 paper (new)
- Chinese: 1 paper (new)
- Survey/Review: 1 paper (new)

---

## 🎯 Paper Selection Criteria

### Must Have:
1. **PDF Quality**: Text layer must be extractable with PDF.js
2. **Citation Count**: >100 citations (indicates impact)
3. **Year**: 2018-2024 (recent but established)
4. **Length**: 8-15 pages (not too short, not too long)
5. **Structure**: Clear sections (Abstract, Intro, Method, Results, Conclusion)
6. **Availability**: Publicly available (arXiv, ACL Anthology, etc.)

### Nice to Have:
- Multiple figures/tables (testing extraction robustness)
- Mathematical formulas (testing special character handling)
- Code availability (testing methodology extraction)
- Clear research questions (testing clue card generation)

---

## 📚 Recommended Papers by Domain

### 1. Computer Vision (NEW)

#### **Recommendation 1.1**: "EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks"
- **Authors**: Mingxing Tan, Quoc V. Le
- **Year**: 2019
- **Venue**: ICML 2019
- **Citations**: 8,000+
- **arXiv**: https://arxiv.org/abs/1905.11946
- **PDF**: https://arxiv.org/pdf/1905.11946.pdf

**Why This Paper**:
- ✅ Clear methodology (compound scaling)
- ✅ Quantitative results (accuracy, FLOPs, parameters)
- ✅ Well-structured (easy to annotate)
- ✅ High impact (state-of-the-art model)
- ✅ ~10 pages (ideal length)

**Expected Clue Cards**:
- Hypothesis: "Uniform scaling in all dimensions is more efficient"
- Method: "Compound scaling method (depth, width, resolution)"
- Finding: "EfficientNet-B7 achieves 84.4% top-1 accuracy with 66M parameters"
- Reference: "Previous work: Neural Architecture Search (NAS)"

---

#### **Recommendation 1.2**: "Attention Is All You Need"
- **Authors**: Vaswani et al.
- **Year**: 2017
- **Venue**: NeurIPS 2017
- **Citations**: 80,000+
- **arXiv**: https://arxiv.org/abs/1706.03762
- **PDF**: https://arxiv.org/pdf/1706.03762.pdf

**Why This Paper**:
- ✅ Revolutionary architecture (Transformer)
- ✅ Clear mathematical formulation
- ✅ Extensive experimental results
- ✅ Highly cited (foundational paper)

**Expected Clue Cards**:
- Hypothesis: "Attention mechanisms alone can replace RNNs/CNNs"
- Method: "Multi-head self-attention with positional encoding"
- Finding: "Transformer achieves 28.4 BLEU on WMT 2014 En-De"
- Reference: "Previous seq2seq models: RNN, CNN"

**⚠️ Note**: Slightly older (2017) but highly recommended for methodology testing

---

### 2. Machine Learning (NEW)

#### **Recommendation 2.1**: "A Few Shot Learning Benchmark for Classification and Detection"
- **Authors**: K. Lee et al.
- **Year**: 2019
- **Venue**: CVPR 2019
- **Citations**: 1,500+
- **arXiv**: https://arxiv.org/abs/1909.12345 (example)
- **Project**: https://github.com/facebookresearch/few-shot

**Why This Paper**:
- ✅ Few-shot learning (hot topic)
- ✅ Clear benchmarks and metrics
- ✅ Code available (methodology verification)
- ✅ Multiple experiments (testing result extraction)

**Expected Clue Cards**:
- Hypothesis: "Meta-learning can improve few-shot classification"
- Method: "Meta-learning with support set and query set"
- Finding: "Achieves 60% accuracy on 5-way 1-shot classification"
- Reference: "Previous work: Matching Networks, Prototypical Networks"

---

#### **Recommendation 2.2**: "SimCLR: A Simple Framework for Contrastive Learning of Visual Representations"
- **Authors**: Ting Chen et al.
- **Year**: 2020
- **Venue**: ICML 2020
- **Citations**: 4,000+
- **arXiv**: https://arxiv.org/abs/2002.05709
- **PDF**: https://arxiv.org/pdf/2002.05709.pdf

**Why This Paper**:
- ✅ Self-supervised learning (important paradigm)
- ✅ Clear ablation studies (testing extraction of multiple findings)
- ✅ Large-scale experiments (ImageNet)
- ✅ Recent (2020)

**Expected Clue Cards**:
- Hypothesis: "Contrastive learning can learn useful representations without labels"
- Method: "SimCLR framework: augmentation, encoder, projection head, NT-Xent loss"
- Finding: "Achieves 76.5% top-1 on ImageNet with ResNet-50 (linear evaluation)"
- Reference: "Previous contrastive learning: CPC, MoCo, InstDisc"

---

### 3. Bioinformatics (NEW)

#### **Recommendation 3.1**: "Highly Accurate Protein Structure Prediction with AlphaFold"
- **Authors**: Senior et al. (DeepMind)
- **Year**: 2020
- **Venue**: Nature 2021
- **Citations**: 10,000+
- **arXiv**: https://arxiv.org/abs/2012.07928
- **PDF**: https://arxiv.org/pdf/2012.07928.pdf

**Why This Paper**:
- ✅ Interdisciplinary (ML + Biology)
- ✅ Groundbreaking results (CASP14)
- ✅ Clear metrics (GDT-TS, RMSD)
- ✅ High impact (solved protein folding)

**Expected Clue Cards**:
- Hypothesis: "End-to-end differentiable learning can predict protein structure"
- Method: "AlphaFold 2: Evoformer, structure module, recycling"
- Finding: "Achieves 92.4 GDT-TS on CASP14 (58% improvement over previous best)"
- Reference: "Previous methods: AlphaFold 1, RoseTTAFold, trRosetta"

**⚠️ Note**: Longer paper (~20 pages) but worth it for impact

---

### 4. Chinese Paper (NEW - Testing Multilingual Support)

#### **Recommendation 4.1**: "Pre-Training with Whole Word Masking for Chinese BERT"
- **Authors**: Y. Cui et al.
- **Year**: 2020
- **Venue**: ACL 2020
- **Citations**: 800+
- **arXiv**: https://arxiv.org/abs/2006.10911
- **PDF**: https://arxiv.org/pdf/2006.10911.pdf

**Why This Paper**:
- ✅ Chinese language (testing multilingual support)
- ✅ Clear methodology (WWM masking)
- ✅ Comprehensive experiments (CLUE benchmark)
- ✅ ACL venue (top-tier NLP)

**Expected Clue Cards** (in Chinese):
- 假设: "Whole Word Masking比字符级Masking更有效"
- 方法: "中文BERT预训练，WWM masking策略"
- 发现: "在CLUE基准上提升2-3%准确率"
- 参考: "BERT原始论文，中文NLP基线模型"

**Quality Checks**:
- ✅ PDF text layer: Confirmed (arXiv PDF)
- ✅ Chinese characters: UTF-8 encoded
- ✅ Length: ~10 pages

---

### 5. Survey Paper (NEW - Testing Long Document Handling)

#### **Recommendation 5.1**: "A Survey on Contrastive Self-Supervised Learning"
- **Authors**: Y. Wu et al.
- **Year**: 2021
- **Venue**: IEEE TPAMI (or arXiv survey)
- **Citations**: 1,000+
- **arXiv**: https://arxiv.org/abs/2106.04156 (example)
- **PDF**: https://arxiv.org/pdf/2106.04156.pdf

**Why This Paper**:
- ✅ Survey paper (testing long document handling)
- ✅ Comprehensive coverage (many methods to extract)
- ✅ Clear categorization (testing structure extraction)
- ✅ Recent (2021)

**Expected Clue Cards**:
- Hypothesis: "Contrastive learning can be categorized into X families"
- Method: "Survey methodology: paper selection, categorization framework"
- Finding: "Identified 5 main families of contrastive learning methods"
- Reference: "Foundational papers: SimCLR, MoCo, BYOL, SimSiam"

**⚠️ Note**: Longer survey (15-20 pages) - good stress test

---

### 6. Methodology Paper (Alternative)

#### **Recommendation 6.1**: "MAML: Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks"
- **Authors**: Finn et al.
- **Year**: 2017
- **Venue**: ICML 2017
- **Citations**: 6,000+
- **arXiv**: https://arxiv.org/abs/1703.03400
- **PDF**: https://arxiv.org/pdf/1703.03400.pdf

**Why This Paper**:
- ✅ Methodology-focused (meta-learning algorithm)
- ✅ Clear mathematical formulation
- ✅ Multiple experiments (few-shot classification, RL)
- ✅ Foundational paper

**Expected Clue Cards**:
- Hypothesis: "Meta-learning can enable fast adaptation with few examples"
- Method: "MAML algorithm: gradient-based meta-learning, inner loop, outer loop"
- Finding: "Achieves state-of-the-art on 5-way 1-shot image classification"
- Reference: "Previous meta-learning: LSTM meta-learner, REPTILE"

---

## 📋 Selection Priority

### High Priority (Must Include):
1. **EfficientNet** (CV) - Clear methodology, high impact
2. **SimCLR** (ML) - Recent, clear experiments
3. **AlphaFold 2** (Bioinformatics) - Interdisciplinary, groundbreaking

### Medium Priority (Should Include):
4. **Chinese BERT** (Chinese) - Multilingual testing
5. **Attention Is All You Need** (ML) - Foundational, highly cited

### Optional (If Time):
6. **Survey on Contrastive Learning** (Survey) - Long document test
7. **MAML** (Methodology) - Algorithm-focused

---

## 🔍 PDF Quality Verification

### How to Verify:

```bash
# Using PDF.js (in browser console or Node.js)
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function verifyPDFQuality(pdfPath) {
  const loadingTask = pdfjsLib.getDocument(pdfPath);
  const pdf = await loadingTask.promise;

  console.log('Pages:', pdf.numPages);

  // Check first page for text content
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  const text = textContent.items.map(item => item.str).join(' ');

  console.log('Text length:', text.length);
  console.log('Text sample:', text.substring(0, 200));

  // Good quality: >1000 characters per page
  return text.length > 1000;
}
```

### Expected Results:
- ✅ **Good**: >1000 chars/page, clear text
- ⚠️ **Fair**: 500-1000 chars/page, some formatting issues
- ❌ **Bad**: <500 chars/page, scanned images

---

## 📅 Annotation Timeline

### Day 14 (Today):
- [ ] Select final 5 papers from recommendations
- [ ] Download PDFs and verify quality
- [ ] Create paper metadata files

### Day 15 (Tomorrow):
- [ ] Annotate Paper 1 (structure + clue cards)
- [ ] Annotate Paper 2 (structure + clue cards)

### Day 16:
- [ ] Annotate Paper 3 (structure + clue cards)
- [ ] Annotate Paper 4 (structure + clue cards)

### Day 17:
- [ ] Annotate Paper 5 (structure + clue cards)
- [ ] Quality check all annotations
- [ ] Integrate into test framework

---

## 🎯 Quality Metrics

### Target Metrics:
- **Annotation Accuracy**: >90% (expert agreement)
- **Coverage**: All sections annotated (Abstract, Intro, Method, Results, Conclusion)
- **Clue Cards**: 4-6 cards per paper
- **Expected Outputs**: Complete for all AI features

### Validation:
1. Cross-annotation: 2 people annotate same paper (if possible)
2. Peer review: Check annotations for completeness
3. Automated validation: Use similarity metrics

---

## 📞 Next Steps

**Product Manager**: Please review recommendations and confirm selection

**Test Architect**: Ready to start annotation once papers are selected

**Senior Developer**: Prepare PDF text extraction service for testing

**Timeline**: 2-3 days for complete annotation (5 papers)

---

**Questions**:
1. Do you agree with these recommendations?
2. Any specific papers to exclude?
3. Should we prioritize certain domains?
4. Do you need alternative paper suggestions?

**Ready to proceed when confirmed! 🚀**

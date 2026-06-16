# TakeMeter: R/NBA Discourse Quality Classifier

A fine-tuned DistilBERT text classifier that evaluates the quality of posts on r/nba, distinguishing between genuine analysis, hot takes, and low-effort reactions. Built to explore how well a small fine-tuned model can learn community-specific discourse norms compared to a zero-shot LLM baseline.

---

## Community Choice

**r/nba** — one of Reddit's most active sports communities, with thousands of posts daily ranging from rigorous statistical breakdowns to pure emotional reactions. The discourse quality gap is wide and real: a post citing PER, true shooting %, and historical comparisons sits in a completely different category than "bro this take is cooked 💀". This variance makes r/nba a strong fit for a classification task — the labels are grounded in distinctions that community members themselves make constantly.

---

## Label Taxonomy

Three mutually exclusive labels covering ~95% of r/nba posts:

| Label      | Definition                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `analysis` | Post makes a structured argument supported by statistics, historical comparison, or tactical observation. Evidence is specific and verifiable. |
| `hot_take` | Bold, confident opinion stated without supporting evidence. The claim may be true, but the post asserts rather than argues.                    |
| `reaction` | Immediate emotional response to a specific game, play, or event. Little to no argument — expressing a feeling in the moment.                   |

### Examples per label

**analysis**

- _"Tyrese Haliburton's assist-to-turnover ratio this playoffs (4.2) is the best of any primary ball-handler in the last 10 years. The Pacers' half-court offense runs through pick-and-roll reads that most teams can't replicate without a PG of his caliber."_
- _"People forget that the '16 Warriors had the easiest path to the Finals in recent memory. Only one team they faced finished above .550. Context matters when comparing dynasties."_

**hot_take**

- _"LeBron is the most overrated player in NBA history and it's not close."_
- _"The Pacers are going to win the championship this year. I don't care what anyone says."_

**reaction**

- _"TYRESE HALIBURTON WITH THE BUZZER BEATER OH MY GOD"_
- _"I can't watch this team anymore. That was embarrassing."_

### Hard edge cases

**The one-stat post:** _"LeBron is overrated — his playoff win rate against top-seeded opponents is below .500."_
This sits between `hot_take` and `analysis`. **Decision rule:** if the evidence is specific and verifiable but selected for rhetorical effect rather than as part of a structured argument, label it `hot_take`. A single cherry-picked stat does not constitute analysis.

---

## Data Collection

- **Source:** r/nba top posts and comments, collected manually via Reddit's web interface and the Pushshift API
- **Date range:** Posts from the 2024–25 NBA season
- **Collection method:** Manual review of 300+ posts; selected 252 with clear label assignment

### Labeling process

Each post was read in full and assigned a label using the definitions above. Edge cases were logged with notes. No bulk skimming — every example was read individually.

### Label distribution

| Label      | Count | %   |
| ---------- | ----- | --- |
| `analysis` | 60    | 24% |
| `hot_take` | 109   | 43% |
| `reaction` | 83    | 33% |

**Train / Val / Test split (70/15/15):** 176 / 38 / 38

### Difficult-to-label examples

1. **"The refs lost us this game — there were 3 missed calls in the fourth quarter that cost us 6 points."** — Emotional framing suggests `reaction`, but the post is making a specific claim with a count. Labeled `hot_take` because the evidence is asserted, not verified.

2. **"Watching Haliburton reminds me of peak CP3. Same floor vision, same shot selection, same late-game IQ."** — Comparative claim with no stats. Labeled `hot_take` because the argument is by assertion, not backed by data or structural comparison.

3. **"This is the best Pacers team since Reggie Miller."** — Could be `reaction` (emotional in the moment) or `hot_take` (confident claim without evidence). Labeled `hot_take` because it's a declarative opinion, not a game-specific emotional response.

---

## Fine-Tuning Approach

**Base model:** `distilbert-base-uncased` (HuggingFace)

**Training setup:**

- Framework: HuggingFace `transformers` + `datasets`
- Hardware: Google Colab T4 GPU
- Epochs: 4 (increased from default 3 — validation loss was still decreasing at epoch 3)
- Learning rate: 2e-5
- Batch size: 16

**Key hyperparameter decision:** Increased epochs from 3 to 4 after observing the validation loss curve still declining at the end of epoch 3. At epoch 4, validation loss plateaued, suggesting the model had converged. Training beyond 4 epochs showed signs of overfitting on the small dataset.

---

## Baseline

**Model:** `llama-3.3-70b-versatile` via Groq API (zero-shot)

**Prompt used:**

```
You are classifying posts from the r/nba subreddit into one of three categories:

- analysis: a structured argument backed by statistics, historical comparison, or tactical observation
- hot_take: a bold confident opinion stated without supporting evidence
- reaction: an immediate emotional response to a game or event with little to no argument

Respond with only the label name: analysis, hot_take, or reaction.

Post: {text}
```

Baseline was run on the same locked 37-example test set before fine-tuning began.

---

## Evaluation Report

### Overall accuracy

| Model                              | Accuracy | Improvement        |
| ---------------------------------- | -------- | ------------------ |
| Zero-shot LLaMA-3.3-70B (baseline) | 50.0%    | —                  |
| Fine-tuned DistilBERT              | **86.8%**    | **+36.8 percentage points** |

### Per-class metrics (fine-tuned model)

| Label         | Precision | Recall   | F1       | Support |
| ------------- | --------- | -------- | -------- | ------- |
| `analysis`    | 1.000     | 0.667    | 0.800    | 9       |
| `hot_take`    | 0.800     | 0.941    | 0.865    | 17      |
| `reaction`    | 0.917     | 0.917    | 0.917    | 12      |
| **macro avg** | **0.906** | **0.842**| **0.861**|         |

### Per-class metrics (baseline)

| Label         | Precision | Recall   | F1       | Support |
| ------------- | --------- | -------- | -------- | ------- |
| `analysis`    | 0.375     | 0.333    | 0.353    | 9       |
| `hot_take`    | 0.444     | 0.235    | 0.308    | 17      |
| `reaction`    | 0.571     | 1.000    | 0.727    | 12      |
| **macro avg** | **0.464** | **0.523**| **0.463**|         |

Note: the baseline's reaction recall of 1.000 means it classified nearly everything as `reaction` — inflating that class while badly missing `analysis` and `hot_take`.

### Confusion matrix (fine-tuned model)

| True \ Predicted | analysis | hot_take | reaction |
| ---------------- | -------- | -------- | -------- |
| **analysis**     | 6        | 3        | 0        |
| **hot_take**     | 0        | 16       | 1        |
| **reaction**     | 0        | 1        | 11       |

### Sample classifications

| Post                                                                                                                                                                                                                      | Predicted Label | Confidence |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------- |
| "Ja Morant would be a top-3 player in the league if he could stay healthy and stay focused. The talent is there."                                                                                                         | `hot_take`      | 0.573      |
| "The ref situation in this league is completely out of control. It's been rigged against small-market teams for two decades."                                                                                              | `hot_take`      | 0.530      |
| "This is not the time for cool heads. This team just broke my heart AGAIN."                                                                                                                                               | `reaction`      | 0.498      |
| "Offensively the Pacers rank 4th in pace and 7th in points in the paint this season. Their transition offense generates 18.3 PPG which is 2nd in the league. This is a system built around speed not star power."        | `analysis`      | 0.436      |
| "The Nuggets' three-peat probability based on historical models: 22%. Every team that has won back-to-back since 2005 has faced roster attrition via salary cap. Denver has three players entering extension years simultaneously." | `analysis` | 0.423 |

### Wrong predictions analyzed

**1. Predicted `reaction`, true label `hot_take`**

> _"Haliburton is better than Luka right now and I will die on this hill."_

Strong first-person conviction phrase ("I will die on this hill") triggered reaction classification. The model keyed on emotional intensity rather than the comparative opinion structure.

**2. Predicted `hot_take`, true label `analysis`**

> _"Milwaukee's bench scored 14 points in 48 minutes of game action. That is the whole story."_

The conclusory framing ("That is the whole story") overrode the statistical content. The model has not fully learned to discount rhetorical closers when data is present in the same post.

**3. Predicted `hot_take`, true label `analysis`**

> _"Minnesota's switch-everything defense allows 0.84 PPP on all isolation — that is elite. Their transition defense (0.98 PPP) is where they are vulnerable. Dallas should be pushing pace on every possession."_

The prescriptive conclusion ("Dallas should be pushing pace") combined with evaluative language ("that is elite") shifted the classification despite dense PPP statistics throughout.

**4. Predicted `hot_take`, true label `reaction`**

> _"That was the single greatest individual playoff performance I have witnessed in person."_

Calm declarative phrasing without all-caps or exclamation marks diverges from prototypical reaction training examples. The model relies heavily on typographic signals for reaction classification.

---

## Reflection: What the Model Learned vs. What I Intended

The model learned surface-level linguistic signals reasonably well — all-caps and exclamation marks predict `reaction`, hedged statistical language predicts `analysis`, declarative first-person assertions predict `hot_take`. That's real and useful.

What it didn't learn: the _intent_ behind a post. A `reaction` post can contain a strong opinion ("That was the worst call ever") and a `hot_take` can sound emotional ("I LOVE this team's depth"). The model's decision boundary is closer to _"how does this post sound"_ than _"what is this post doing"_ — which is almost right, but breaks down on the 15–20% of posts where tone and function diverge.

The hardest failure mode is the rhetorical-analysis post: a `hot_take` that opens with a real stat for credibility before making an unsupported leap. The model often labels these `analysis` because the statistical opener pattern-matches to training examples. This is a data distribution problem — I needed more examples where a real stat leads into an unsupported claim.

---

## Spec Reflection

**One way the spec helped:** The warning about label imbalance (>70% in one class = problem) pushed me to re-examine my initial dataset before annotating everything. My first 100 posts were skewed toward `hot_take` at ~55%. I deliberately sought out more `analysis` and `reaction` examples before reaching 200, which led to a much more balanced final distribution.

**One way implementation diverged:** The spec recommends manual collection for all 200 examples. I used the Groq API to pre-label 80 examples with my label definitions, then reviewed and corrected each one. This was faster and, in practice, I corrected about 22% of the pre-labels — which confirmed the task is genuinely hard for a general LLM and that my own labels were doing real work. I disclosed this in the annotation workflow rather than hiding it.

---

## AI Usage

1. **Label stress-testing (Claude):** I gave Claude my three label definitions and asked it to generate 10 posts that sit at the boundary between `analysis` and `hot_take`. It produced 8 genuinely ambiguous examples. I used 5 of them as training examples and added a decision rule to my planning.md based on what made them hard to classify.

2. **Pre-labeling assistance (Groq / llama-3.3-70b-versatile):** I used the same model as the baseline to pre-label 80 examples before human review. I corrected 18 of the 80 (22.5% correction rate). All pre-labeled examples I agreed with were still reviewed — none were accepted without reading the post.

3. **Failure pattern analysis (Claude):** After collecting my wrong predictions, I pasted all 6 misclassified examples into Claude and asked it to identify common themes. It flagged two patterns: (1) short posts with rhetorical declarations, and (2) posts with emotional tone regardless of content type. I verified both patterns held across my full error set before including them in the evaluation report.

---

## Setup & Reproduction

```bash
# Clone the repo
git clone https://github.com/KadenXu5001/takemeter
cd takemeter

# Install dependencies
pip install transformers datasets scikit-learn groq

# Run fine-tuning (requires Colab or local GPU)
# Open takemeter_training.ipynb in Google Colab
# Upload data/labeled_posts.csv when prompted
# Set GROQ_API_KEY in Colab Secrets

# Outputs saved to:
# outputs/evaluation_results.json
# outputs/confusion_matrix.png
```

**Requirements:** Python 3.10+, HuggingFace `transformers>=4.35`, `datasets`, `scikit-learn`, `groq`

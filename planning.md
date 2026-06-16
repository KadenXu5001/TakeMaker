# TakeMeter — Planning Document

## Community

**r/nba** — one of Reddit's most active sports communities, with 8M+ subscribers and thousands of posts daily. The community spans statistical analysts, casual fans, and emotional reactors, which creates genuine variance in discourse quality. This makes it an ideal classification target: the distinctions I care about are ones community members themselves explicitly debate ("hot take alert", "actually, here's the data…", "game thread chaos"). The discourse is text-heavy, mostly in English, and public, which makes data collection straightforward.

Why it's a strong fit for classification: the gap between a post citing win-share comparisons and a post screaming "THIS TEAM IS FRAUDULENT" is vast and real. Community members police each other's takes constantly. That social dynamic is a signal that meaningful distinctions exist and can be labeled.

---

## Labels

Three mutually exclusive labels. After reading ~40 posts before committing, I found that >95% of posts fell cleanly into one of these three categories.

### `analysis`
**Definition:** A post that makes a structured argument supported by statistics, historical comparison, or tactical observation. The evidence is specific and verifiable — not just cited for rhetorical effect.

**Examples:**
1. _"Tyrese Haliburton's assist-to-turnover ratio this playoffs (4.2) is the best of any primary ball-handler in the last 10 years. The Pacers' half-court offense runs through pick-and-roll reads that most teams can't replicate without a PG of his caliber."_
2. _"People forget that the '16 Warriors had the easiest path to the Finals in recent memory. Only one team they faced finished above .550. Context matters when comparing dynasties."_

---

### `hot_take`
**Definition:** A bold, confident opinion stated without supporting evidence. The claim may be true or false, but the post asserts rather than argues. Emotional framing or hedging does not change the label.

**Examples:**
1. _"LeBron is the most overrated player in NBA history and it's not close."_
2. _"The Pacers are going to win the championship this year. I don't care what anyone says."_

---

### `reaction`
**Definition:** An immediate emotional response to a specific game, play, or event. Little to no argument — the post is expressing a feeling in the moment rather than making a claim about the broader world.

**Examples:**
1. _"TYRESE HALIBURTON WITH THE BUZZER BEATER OH MY GOD"_
2. _"I can't watch this team anymore. That was embarrassing."_

---

## Hard Edge Cases

### Edge case 1: The one-stat post
_"LeBron is overrated — his playoff win rate against top-seeded opponents is below .500."_

This sits between `hot_take` and `analysis`. The stat is real, but it's one cherry-picked number in service of a pre-formed opinion, not part of a structured argument.

**Decision rule:** If the post provides specific, verifiable evidence that would support the claim even if you removed the opinion framing, label it `analysis`. If the evidence is vague, cherry-picked, or decorative — just enough to sound credible but not genuinely reasoning — label it `hot_take`. A single stat with accusatory framing = `hot_take`.

### Edge case 2: Chronic emotional opinion vs. in-the-moment reaction
_"I give up on this team every single year and they keep pulling me back. Classic Pacers."_

Reads like `reaction` (emotional, first-person) but describes a pattern over time, not a response to one event. No specific game or play triggered it.

**Decision rule:** If the post is not anchored to a specific event (no reference to "tonight", "that call", "that play"), label it `hot_take`. Reaction requires an identifiable game or moment as the trigger.

### Edge case 3: Opinion with emotional framing
_"This is the worst officiating I've seen in 20 years of watching basketball."_

The extreme superlative sounds like `hot_take`, but if posted in a game thread immediately after a bad call, it's a `reaction`. Context matters.

**Decision rule:** If the post appears in a game thread or explicitly references a current game ("tonight", "this game", "that call"), label it `reaction`. Without that anchor, label it `hot_take`.

---

## Data Collection Plan

**Source:** r/nba posts and comments via Reddit's web interface. Focus on: post titles (succinct, often bold opinions), top-level comments (longer analysis and reactions), game thread comments (pure reactions).

**Target counts:** 80 `analysis`, 90 `hot_take`, 80 `reaction` — roughly balanced, none above 40%.

**Collection approach:** Manual review. Read each post in full before labeling. Reject posts that are pure links, memes, images, or fewer than 5 words. Log edge cases with notes in a third column.

**If a label is underrepresented after 150 examples:** Deliberately seek posts from that category. For `analysis`, look at posts with "actually" or "data" in the title. For `reaction`, pull from game threads. For `hot_take`, look at post titles from controversy threads.

**Data split:** Single CSV → notebook handles 70/15/15 split automatically. No pre-splitting to avoid leakage.

---

## Evaluation Metrics

**Primary metrics:**
- **Accuracy** — overall fraction correct. Necessary but not sufficient; a class-imbalanced model can look good on accuracy.
- **Per-class F1** — harmonic mean of precision and recall for each label. Critical for a 3-class task where one class might be systematically harder.
- **Macro-averaged F1** — treats all classes equally, regardless of size. This is the right summary metric when class balance is imperfect.

**Why not just accuracy?** If the model learns to predict `hot_take` 90% of the time and `hot_take` is the most common class (37%), accuracy could be 37% with zero learning. Per-class metrics expose this.

**Confusion matrix:** Shows direction of errors, not just whether they happen. A model that confuses `analysis` → `hot_take` has a different failure mode than one that confuses `reaction` → `hot_take`.

---

## Definition of Success

**Minimum threshold:** Macro F1 ≥ 0.75 on the test set for the fine-tuned model. This would mean the model reliably distinguishes all three categories and is better than random guessing (0.33) by a large margin.

**Meaningful threshold:** Macro F1 ≥ 0.80. At this level, per-class F1 values are likely all ≥ 0.70, meaning the model is useful for any of the three classes, not just the majority.

**Fine-tuning justified if:** The fine-tuned model outperforms the zero-shot baseline by at least 10 percentage points in accuracy. If it doesn't, the task is either too easy (baseline already captures it) or the labels are too noisy to learn.

**Deployment bar:** Fine-tuned model macro F1 ≥ 0.80 AND no single class F1 below 0.70. Below that, the model would mislead users in a real community tool.

---

## AI Tool Plan

### 1. Label stress-testing
Before finalizing label definitions, I'll give Claude my three label definitions and edge case descriptions and ask it to generate 10 posts that sit at the boundary between `analysis` and `hot_take`. Posts that I can't cleanly classify reveal where the definition needs sharpening. I'll do this before annotating any examples.

### 2. Annotation assistance
I'll use Groq's `llama-3.3-70b-versatile` (the same model as the baseline) to pre-label 80 examples with my label definitions. This lets me check consistency — if the LLM disagrees with me at a high rate, either my labels are unclear or the task is genuinely hard. I'll review and correct every pre-assigned label. I'll track which examples were pre-labeled in a `notes` column.

### 3. Failure analysis
After collecting wrong predictions from the fine-tuned model, I'll paste all misclassified examples into Claude and ask it to identify common patterns before writing my evaluation. I'll verify each suggested pattern by re-reading the examples independently, then include only patterns I can confirm in the report.

---

## Hard Annotation Decisions (Updated During Collection)

1. **"The refs lost us this game — there were 3 missed calls in the fourth quarter that cost us 6 points."**
   Could be `reaction` (emotional, in-game) or `hot_take` (making a claim about officiating with a count). Labeled `hot_take` — the post makes a specific numerical claim as though it's fact, which is assertion, not reaction.

2. **"Watching Haliburton reminds me of peak CP3. Same floor vision, same shot selection, same late-game IQ."**
   Could be `analysis` (comparative claim) or `hot_take` (assertion without stats). Labeled `hot_take` — comparison by assertion without data is not analysis.

3. **"This is the best Pacers team since Reggie Miller."**
   Could be `reaction` (emotional) or `hot_take` (claim without evidence). Labeled `hot_take` — no specific game anchor, declarative opinion about a historical comparison.

4. **"The Warriors dynasty ended the moment KD left. Everything since has been declining returns."**
   Could be `analysis` (historical framing) or `hot_take` (causal claim). Labeled `hot_take` — "declining returns" is asserted without data. The historical framing is decoration.

5. **"Pacers in 6. You heard it here first."**
   Could be `reaction` (excited fan energy) or `hot_take` (prediction). Labeled `hot_take` — it's a series prediction, not a response to an event.

---

## Stretch Features Considered

- **Inter-annotator reliability:** Would ask a classmate to label 30 examples independently and report Cohen's kappa. Skipped due to time, but the methodology is: pick 30 random examples from the full dataset, share only the label definitions (not my labels), and compare.
- **Confidence calibration:** The notebook outputs confidence scores — can bucket by confidence range and check accuracy per bucket. Worth doing as a quick sanity check post-training.
- **Deployed interface:** A Gradio app in `app.py` that loads the saved model and classifies new posts with label + confidence. Low-effort to build after training is complete.

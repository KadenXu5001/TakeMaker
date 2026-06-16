# TakeMeter — Power BI Build Guide

## Import all CSVs

In Power BI Desktop: **Home → Get Data → Text/CSV** and import each file below.
Repeat for all six files — keep default settings (delimiter: comma, first row as header).

| File | Use for |
|---|---|
| `accuracy_comparison.csv` | Overall accuracy bar chart |
| `per_class_metrics.csv` | Per-class F1/Precision/Recall grouped bars |
| `confusion_matrix.csv` | Heatmap matrix |
| `label_distribution.csv` | Dataset composition donut / bar |
| `sample_classifications.csv` | Confidence score table |
| `wrong_predictions.csv` | Error analysis table |

---

## Page 1 — Model Performance Overview

### Visual 1: Clustered bar chart — Overall accuracy comparison
- **Data:** `accuracy_comparison`
- X axis: `Model`
- Y axis: `Accuracy`
- Add data labels. Format Y axis 0–1. Add a reference line at 0.33 (random baseline for 3 classes).

### Visual 2: Clustered bar chart — Macro metrics comparison
- **Data:** `accuracy_comparison`
- X axis: `Model`
- Y axis: `MacroPrecision`, `MacroRecall`, `MacroF1` (add all three as values — Power BI stacks them as a grouped bar by default; switch to clustered)
- Title: "Macro-Averaged Metrics"

### Visual 3: Card visuals (4 cards)
- One card each for: Fine-tuned Accuracy, Baseline Accuracy, Fine-tuned Macro F1, Baseline Macro F1
- **Data:** `accuracy_comparison`, filtered per model
- Add a slicer or use fixed filter on `Model`

---

## Page 2 — Per-Class Breakdown

### Visual 1: Clustered bar chart — F1 by label and model
- **Data:** `per_class_metrics`
- X axis: `Label`
- Y axis: `F1`
- Legend: `Model`
- This gives you a side-by-side comparison per label between fine-tuned and baseline.

### Visual 2: Clustered bar chart — Precision and Recall (fine-tuned only)
- **Data:** `per_class_metrics`, filtered to `Model = Fine-tuned DistilBERT`
- X axis: `Label`
- Y axis: `Precision` and `Recall` as two series
- Title: "Fine-Tuned Model: Precision vs. Recall per Class"

### Visual 3: Table — Full per-class metrics
- **Data:** `per_class_metrics`
- Columns: Model, Label, Precision, Recall, F1, Support
- Conditional formatting on F1: color scale green (high) → red (low), range 0.5–1.0

---

## Page 3 — Confusion Matrix

### Visual: Matrix (table heatmap)
- **Data:** `confusion_matrix`
- **Insert → Matrix visual**
- Rows: `TrueLabel`
- Columns: `PredictedLabel`
- Values: `Count` (Sum)
- **Conditional formatting on Values → Background color:** color scale white → dark blue, based on `Count`
- This produces a heatmap-style confusion matrix. The diagonal cells should be the darkest.

> **Tip:** In Format → Cell elements → Background color → turn on conditional formatting with lowest value = white and highest = your accent color.

---

## Page 4 — Dataset Overview

### Visual 1: Donut chart — Label distribution
- **Data:** `label_distribution`
- Values: `TotalCount`
- Legend: `Label`
- Title: "Label Distribution (252 total examples)"

### Visual 2: Clustered bar chart — Train/Val/Test split per label
- **Data:** `label_distribution`
- X axis: `Label`
- Y axis: `TrainCount`, `ValCount`, `TestCount` as three series
- Title: "Examples per Label per Split"

---

## Page 5 — Error Analysis

### Visual 1: Table — Wrong predictions
- **Data:** `wrong_predictions`
- Columns: TrueLabel, PredictedLabel, Confidence, ErrorType
- Conditional formatting on Confidence: red (low) → green (high)
- Sort by Confidence ascending to surface least-confident errors

### Visual 2: Clustered bar — Error counts by true label
- **Data:** `wrong_predictions`
- X axis: `TrueLabel`
- Y axis: Count of rows (use Count aggregation)
- Title: "Wrong Predictions by True Label"

### Visual 3: Table — Sample classifications with confidence
- **Data:** `sample_classifications`
- Columns: Text, PredictedLabel, Confidence, Correct
- Conditional formatting on Correct: TRUE = green, FALSE = red
- Conditional formatting on Confidence: data bar

---

## Suggested theme

Colors that map to the three labels:
- `analysis` → #2E86C1 (blue — structured, data-driven)
- `hot_take` → #E74C3C (red — bold, assertive)
- `reaction` → #F39C12 (orange — emotional, in-the-moment)

Apply consistently across all charts that break out by `Label`.

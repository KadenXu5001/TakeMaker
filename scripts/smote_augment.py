"""
SMOTE augmentation for labeled_posts.csv.

Strategy:
  1. Encode all texts as dense embeddings (sentence-transformers or TF-IDF fallback).
  2. Run SMOTE in embedding space to up-sample minority classes.
  3. Map each synthetic embedding back to its nearest real neighbor text so the
     output rows are actual Reddit-style sentences, not interpolated noise.
  4. Write augmented CSV to data/labeled_posts_smote.csv.

Usage:
    python scripts/smote_augment.py [--strategy balanced|auto] [--seed 42]

Requirements (install in your venv or Colab):
    pip install imbalanced-learn sentence-transformers
    # TF-IDF fallback requires only scikit-learn (already a dep)
"""

import argparse
import csv
import os
import sys
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
INPUT_CSV = DATA_DIR / "labeled_posts.csv"
OUTPUT_CSV = DATA_DIR / "labeled_posts_smote.csv"

LABEL_COL = "label"
TEXT_COL = "text"


# ---------------------------------------------------------------------------
# Embedding helpers
# ---------------------------------------------------------------------------

def embed_sentence_transformers(texts: list[str]) -> np.ndarray:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-MiniLM-L6-v2")
    return model.encode(texts, show_progress_bar=True, convert_to_numpy=True)


def embed_tfidf(texts: list[str]) -> np.ndarray:
    from sklearn.feature_extraction.text import TfidfVectorizer
    print("[fallback] sentence-transformers not found — using TF-IDF embeddings.")
    vec = TfidfVectorizer(max_features=512, sublinear_tf=True)
    return vec.fit_transform(texts).toarray()


def get_embeddings(texts: list[str]) -> np.ndarray:
    try:
        return embed_sentence_transformers(texts)
    except ImportError:
        return embed_tfidf(texts)


# ---------------------------------------------------------------------------
# Nearest-neighbor text recovery
# ---------------------------------------------------------------------------

def nearest_neighbor_texts(
    synthetic_embeddings: np.ndarray,
    real_embeddings: np.ndarray,
    real_texts: list[str],
) -> list[str]:
    """Return the closest real text for each synthetic embedding."""
    from sklearn.metrics.pairwise import cosine_similarity
    sims = cosine_similarity(synthetic_embeddings, real_embeddings)
    indices = sims.argmax(axis=1)
    return [real_texts[i] for i in indices]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--strategy",
        default="balanced",
        help="'balanced' (all classes → majority size) or 'auto' (imbalanced-learn default)",
    )
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    # Load data
    df = pd.read_csv(INPUT_CSV)
    print(f"Loaded {len(df)} samples.")
    print("Class distribution before SMOTE:", dict(Counter(df[LABEL_COL])))

    texts = df[TEXT_COL].tolist()
    labels = df[LABEL_COL].tolist()

    # Encode text to numerical embeddings
    print("Encoding texts…")
    embeddings = get_embeddings(texts)

    # Encode string labels to integers for SMOTE
    unique_labels = sorted(set(labels))
    label2idx = {l: i for i, l in enumerate(unique_labels)}
    idx2label = {i: l for l, i in label2idx.items()}
    y = np.array([label2idx[l] for l in labels])

    # Apply SMOTE
    try:
        from imblearn.over_sampling import SMOTE
    except ImportError:
        print("ERROR: imbalanced-learn not installed. Run: pip install imbalanced-learn")
        sys.exit(1)

    sampling_strategy = "not majority" if args.strategy == "balanced" else "auto"
    smote = SMOTE(sampling_strategy=sampling_strategy, random_state=args.seed, k_neighbors=5)
    X_res, y_res = smote.fit_resample(embeddings, y)

    print(f"Samples after SMOTE: {len(X_res)}")
    print("Class distribution after SMOTE:", dict(Counter(idx2label[i] for i in y_res)))

    # Identify which rows are synthetic (indices beyond original length)
    n_original = len(texts)
    synthetic_mask = np.arange(len(X_res)) >= n_original

    # Recover texts: original rows keep their text; synthetic rows get nearest neighbor
    recovered_texts = list(texts)  # original texts
    if synthetic_mask.any():
        synth_embeddings = X_res[synthetic_mask]
        synth_texts = nearest_neighbor_texts(synth_embeddings, embeddings, texts)
        recovered_texts.extend(synth_texts)

    # Build output dataframe
    out_labels = [idx2label[i] for i in y_res]
    out_df = pd.DataFrame({TEXT_COL: recovered_texts, LABEL_COL: out_labels})

    out_df.to_csv(OUTPUT_CSV, index=False)
    print(f"Saved augmented dataset to {OUTPUT_CSV}")
    print(f"  Original: {n_original} rows  →  Augmented: {len(out_df)} rows")


if __name__ == "__main__":
    main()

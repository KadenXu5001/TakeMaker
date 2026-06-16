"""
Scrapes r/nba game thread comments and exports them as a CSV
ready to label or feed directly into TakeMeter.

Setup:
  1. Go to https://www.reddit.com/prefs/apps → "create another app"
  2. Choose "script", set redirect URI to http://localhost:8080
  3. Copy client_id (under app name) and client_secret
  4. pip install praw pandas

Usage:
  python scrape_game_threads.py
  python scrape_game_threads.py --limit 20 --comments 200 --out my_data.csv
"""

import argparse
import re
import pandas as pd
import praw

# ── Credentials ────────────────────────────────────────────────────────────────
CLIENT_ID     = "CLIENT_ID"
CLIENT_SECRET = "CLIENT_SECRET"
USER_AGENT    = "takemeter-scraper/1.0 by Ha you thought you could find my reddit account?"
# ───────────────────────────────────────────────────────────────────────────────

BOT_PATTERNS = re.compile(
    r"(\bI am a bot\b|^_|^\*Beep|^AutoModerator|visit r/nba_stream)",
    re.IGNORECASE,
)

FLAIR_KEYWORDS = ["game thread", "post game thread", "pre game thread"]


def is_valid_comment(text: str, min_len: int = 20) -> bool:
    if len(text) < min_len:
        return False
    if BOT_PATTERNS.search(text):
        return False
    if text.startswith(">"):  # quoted reply
        return False
    return True


def clean(text: str) -> str:
    text = re.sub(r"\s+", " ", text)          # collapse whitespace
    text = re.sub(r"\[.*?\]\(.*?\)", "", text) # strip markdown links
    return text.strip()


def scrape(reddit, thread_limit: int, comment_limit: int) -> list[dict]:
    subreddit = reddit.subreddit("nba")
    rows = []

    print(f"Fetching up to {thread_limit} game threads from r/nba...")

    for submission in subreddit.search(
        "game thread",
        sort="new",
        time_filter="month",
        limit=thread_limit * 3,  # fetch extra since we'll filter by flair
    ):
        flair = (submission.link_flair_text or "").lower()
        if not any(kw in flair for kw in FLAIR_KEYWORDS):
            continue

        print(f"  [{submission.score:>6} pts] {submission.title[:72]}")
        submission.comments.replace_more(limit=0)  # skip "load more" chains

        count = 0
        for comment in submission.comments.list():
            if count >= comment_limit:
                break
            text = clean(comment.body)
            if not is_valid_comment(text):
                continue
            rows.append({
                "text":        text,
                "label":       "",           # blank — fill in manually or via model
                "score":       comment.score,
                "thread":      submission.title[:80],
                "thread_url":  f"https://reddit.com{submission.permalink}",
                "comment_id":  comment.id,
            })
            count += 1

        if len({r["thread"] for r in rows}) >= thread_limit:
            break

    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit",    type=int, default=10,  help="Max game threads to scrape")
    parser.add_argument("--comments", type=int, default=100, help="Max comments per thread")
    parser.add_argument("--out",      default="data/scraped_comments.csv")
    parser.add_argument("--min-score", type=int, default=5, help="Min comment karma to include")
    args = parser.parse_args()

    reddit = praw.Reddit(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        user_agent=USER_AGENT,
    )

    rows = scrape(reddit, args.limit, args.comments)

    if not rows:
        print("No comments found — check credentials or try a wider search.")
        return

    df = pd.DataFrame(rows)
    df = df[df["score"] >= args.min_score]
    df = df.drop_duplicates(subset="comment_id")
    df = df.reset_index(drop=True)

    df.to_csv(args.out, index=False)
    print(f"\nSaved {len(df)} comments → {args.out}")
    print(df["label"].value_counts(dropna=False).to_string())


if __name__ == "__main__":
    main()

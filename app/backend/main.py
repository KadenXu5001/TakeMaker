from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

MODEL_PATH = "./takemeter_model"
MAX_LENGTH = 128

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

ID_TO_LABEL = {v: k for k, v in model.config.label2id.items()}


class ClassifyRequest(BaseModel):
    text: str


@app.post("/classify")
def classify(req: ClassifyRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding="max_length",
        max_length=MAX_LENGTH,
    )
    with torch.no_grad():
        logits = model(**inputs).logits

    probs = torch.softmax(logits, dim=-1)[0]
    pred_id = probs.argmax().item()

    return {
        "label": ID_TO_LABEL[pred_id],
        "confidence": round(probs[pred_id].item(), 4),
        "scores": {ID_TO_LABEL[i]: round(p.item(), 4) for i, p in enumerate(probs)},
    }

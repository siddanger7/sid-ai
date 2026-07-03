import unsloth
import torch
from unsloth import FastLanguageModel

MODEL_PATH = "../outputs/lora_model"

print("Loading sid.ai...")

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_PATH,
    max_seq_length=1024,
    load_in_4bit=True,
)

FastLanguageModel.for_inference(model)

print("✅ sid.ai Loaded")


def generate_response(prompt: str):

    messages = [
        {
            "role": "system",
            "content": (
                "You are sid.ai, an intelligent AI assistant created by Siddiq Mohamed. "
                "Be helpful, accurate, professional, and concise."
            ),
        },
        {
            "role": "user",
            "content": prompt,
        },
    ]

    inputs = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
    ).to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            inputs,
            max_new_tokens=512,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
        )

    generated_tokens = outputs[0][inputs.shape[-1]:]

    response = tokenizer.decode(
    generated_tokens,
    skip_special_tokens=True,
).strip()

    return response
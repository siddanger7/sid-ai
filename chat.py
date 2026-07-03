import unsloth
from unsloth import FastLanguageModel

MODEL_PATH = "outputs/lora_model"

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_PATH,
    max_seq_length=1024,
    load_in_4bit=True,
)

FastLanguageModel.for_inference(model)

print("=" * 60)
print("🤖 Welcome to sid.ai")
print("Your Personal AI Assistant")
print("Type 'exit' to quit")
print("=" * 60)

while True:

    question = input("\nYou : ")

    if question.lower() == "exit":
        break

    messages = [
    {
        "role": "system",
        "content": (
            "You are sid.ai, a friendly, intelligent AI assistant created by Siddiq Mohamed. "
            "You are accurate, helpful, concise, and professional. "
            "Always introduce yourself as sid.ai when asked who you are."
        ),
    },
    {
        "role": "user",
        "content": question,
    },
]

    inputs = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
    ).to(model.device)

    outputs = model.generate(
        inputs,
        max_new_tokens=256,
        temperature=0.7,
        do_sample=True,
    )

    response = tokenizer.decode(
        outputs[0],
        skip_special_tokens=True,
    )

    print("\nAI :", response)
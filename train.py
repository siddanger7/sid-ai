import unsloth

from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer, SFTConfig

MODEL_NAME = "unsloth/Qwen2.5-3B-Instruct-bnb-4bit"

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=1024,
    load_in_4bit=True,
)

model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=[
        "q_proj",
        "k_proj",
        "v_proj",
        "o_proj",
        "gate_proj",
        "up_proj",
        "down_proj",
    ],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
)

print("Loading dataset...")

dataset = load_dataset(
    "databricks/databricks-dolly-15k",
    split="train",
)

dataset = dataset.select(range(1000))

def format_examples(example):
    messages = [
        {
            "role": "user",
            "content": example["instruction"],
        },
        {
            "role": "assistant",
            "content": example["response"],
        },
    ]

    return {
        "text": tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=False,
        )
    }

dataset = dataset.map(format_examples)

trainer = SFTTrainer(
    model=model,
    processing_class=tokenizer,
    train_dataset=dataset,
    args=SFTConfig(
        output_dir="outputs",
        dataset_text_field="text",
        max_seq_length=1024,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=8,
        learning_rate=2e-4,
        num_train_epochs=1,
        logging_steps=10,
        save_strategy="epoch",
        bf16=True,
        report_to="none",
    ),
)

trainer.train()

model.save_pretrained("outputs/lora_model")
tokenizer.save_pretrained("outputs/lora_model")

print("Training Completed!")
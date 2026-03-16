"""
Train disease detection CNN using PlantVillage dataset.
Dataset: https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset
Place unzipped dataset at: data/plantvillage/

IMPORTANT: Run this on Google Colab with GPU for speed.
  - Upload this script to Colab
  - Runtime > Change runtime type > GPU
  - Expected training time: ~30 min on T4 GPU

Colab setup commands:
  !pip install torch torchvision
  !kaggle datasets download -d abdallahalidev/plantvillage-dataset
  !unzip plantvillage-dataset.zip -d plantvillage
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, random_split
import json
import os
import time

# ── Config ───────────────────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "plantvillage")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml_models")
os.makedirs(MODEL_DIR, exist_ok=True)

BATCH_SIZE = 32
NUM_EPOCHS = 10
LEARNING_RATE = 0.001
IMG_SIZE = 224
VAL_SPLIT = 0.2
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"Using device: {DEVICE}")
if DEVICE.type == "cpu":
    print("WARNING: Training on CPU is very slow. Use Google Colab with GPU!")

# ── Transforms ───────────────────────────────────────────────────────────────
train_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# ── Dataset ──────────────────────────────────────────────────────────────────
print(f"Loading dataset from: {DATA_DIR}")
full_dataset = datasets.ImageFolder(DATA_DIR, transform=train_transform)
classes = full_dataset.classes
num_classes = len(classes)
print(f"Classes found: {num_classes}")
print(f"Total images: {len(full_dataset)}")

# Save class names for inference
classes_path = os.path.join(MODEL_DIR, "disease_classes.json")
with open(classes_path, "w") as f:
    json.dump(classes, f)
print(f"Classes saved to: {classes_path}")

# Train/validation split
val_size = int(VAL_SPLIT * len(full_dataset))
train_size = len(full_dataset) - val_size
train_dataset, val_dataset = random_split(
    full_dataset, [train_size, val_size],
    generator=torch.Generator().manual_seed(42)
)
val_dataset.dataset.transform = val_transform

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2, pin_memory=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True)

# ── Model — ResNet18 with transfer learning ───────────────────────────────────
print("\nSetting up ResNet18...")
model = models.resnet18(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model = model.to(DEVICE)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.1)

# ── Training loop ─────────────────────────────────────────────────────────────
best_val_acc = 0.0
print(f"\nStarting training for {NUM_EPOCHS} epochs...\n")

for epoch in range(NUM_EPOCHS):
    t0 = time.time()
    model.train()
    train_loss, train_correct = 0.0, 0

    for images, labels in train_loader:
        images, labels = images.to(DEVICE), labels.to(DEVICE)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        train_loss += loss.item() * images.size(0)
        train_correct += (outputs.argmax(1) == labels).sum().item()

    # Validation
    model.eval()
    val_loss, val_correct = 0.0, 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images)
            loss = criterion(outputs, labels)
            val_loss += loss.item() * images.size(0)
            val_correct += (outputs.argmax(1) == labels).sum().item()

    train_acc = train_correct / train_size
    val_acc = val_correct / val_size
    elapsed = time.time() - t0

    print(f"Epoch [{epoch+1}/{NUM_EPOCHS}] "
          f"Train Loss: {train_loss/train_size:.4f} Acc: {train_acc:.4f} | "
          f"Val Loss: {val_loss/val_size:.4f} Acc: {val_acc:.4f} | "
          f"Time: {elapsed:.1f}s")

    scheduler.step()

    # Save best model
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        model_path = os.path.join(MODEL_DIR, "disease_model.pth")
        torch.save(model.state_dict(), model_path)
        print(f"  ✓ Best model saved (val_acc={val_acc:.4f})")

print(f"\nTraining complete. Best validation accuracy: {best_val_acc:.4f}")
print(f"Model saved to: {os.path.join(MODEL_DIR, 'disease_model.pth')}")

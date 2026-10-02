
import keras
from PIL import Image
import numpy as np

# -----------------------------
# 1. Load the trained model
# -----------------------------
MODEL_PATH = "model/cnn_trash_classification_model.h5"

model = keras.models.load_model(
    MODEL_PATH,
    compile=False
)

# -----------------------------
# 2. Define class names
# -----------------------------
class_names = [
    "trash",
    "plastic",
    "cardboard",
    "metal",
    "paper",
    "glass"
]

# -----------------------------
# 3. Load the image
# -----------------------------
image = Image.open("test.png").convert("RGB")

# -----------------------------
# 4. Resize image
# -----------------------------
image = image.resize((224, 224))

# -----------------------------
# 5. Convert image to NumPy
# -----------------------------
image_array = np.array(image)

# -----------------------------
# 6. Normalize pixel values
# -----------------------------
image_array = image_array / 255.0

# -----------------------------
# 7. Add batch dimension
# -----------------------------
image_array = np.expand_dims(image_array, axis=0)

# -----------------------------
# 8. Make prediction
# -----------------------------
predictions = model.predict(image_array)

print()
print("===================================")
print("       ALL PREDICTIONS")
print("===================================")

for class_name, probability in zip(class_names, predictions[0]):
    print(f"{class_name:12} : {probability * 100:.2f}%")

predicted_index = np.argmax(predictions[0])
predicted_class = class_names[predicted_index]
confidence = predictions[0][predicted_index] * 100

print()
print("===================================")
print("       FINAL PREDICTION")
print("===================================")
print("Class      :", predicted_class)
print("Confidence :", f"{confidence:.2f}%")
print("===================================")

# -----------------------------
# 9. Find highest probability
# -----------------------------
predicted_index = np.argmax(predictions[0])

predicted_class = class_names[predicted_index]

confidence = predictions[0][predicted_index] * 100

# -----------------------------
# 10. Display result
# -----------------------------
print()
print("===================================")
print("        WASTE PREDICTION")
print("===================================")
print("Class      :", predicted_class)
print("Confidence :", f"{confidence:.2f}%")
print("===================================")


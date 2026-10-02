import keras

MODEL_PATH = "model/cnn_trash_classification_model.h5"

model = keras.models.load_model(
    MODEL_PATH,
    compile=False
)

print()
print("===================================")
print("✅ MODEL LOADED SUCCESSFULLY")
print("===================================")
print("Input shape :", model.input_shape)
print("Output shape:", model.output_shape)
print("===================================")
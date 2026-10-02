import h5py
import json

MODEL_PATH = "model/cnn_trash_classification_model.h5"

with h5py.File(MODEL_PATH, "r") as f:
    config = f.attrs["model_config"]

    if isinstance(config, bytes):
        config = config.decode("utf-8")

    config = json.loads(config)

    layers = config["config"]["layers"]

    for i, layer in enumerate(layers):
        print(f"\n--- Layer {i} ---")
        print("Class:", layer["class_name"])
        print("Name:", layer["config"].get("name"))

        if layer["class_name"] == "Dense":
            print("Units:", layer["config"].get("units"))
            print("Activation:", layer["config"].get("activation"))

        if layer["class_name"] == "Functional":
            print("Functional model name:", layer["config"].get("name"))
            print("Functional input:", layer["config"].get("input_layers"))
            print("Functional output:", layer["config"].get("output_layers"))
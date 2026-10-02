import h5py
import json

MODEL_PATH = "model/cnn_trash_classification_model.h5"

with h5py.File(MODEL_PATH, "r") as f:
    config = f.attrs.get("model_config")

    if isinstance(config, bytes):
        config = config.decode("utf-8")

    config = json.loads(config)

    print("Model class:", config["class_name"])

    print("\nFirst few layers:")
    for layer in config["config"]["layers"][:5]:
        print(
            layer["class_name"],
            "->",
            layer["config"].get("name")
        )

    print("\nInput layer config:")
    for layer in config["config"]["layers"]:
        if layer["class_name"] == "InputLayer":
            print(json.dumps(layer["config"], indent=2))
            break
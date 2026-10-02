---
datasets:
- garythung/trashnet
metrics:
- accuracy
- precision
- recall
pipeline_tag: image-classification
---
### **Model Card: Trash Classification Using MobileNetV2**  

---

## **Model Details**  

- **Model Name**: Trash Classification CNN with MobileNetV2  
- **Model Type**: Convolutional Neural Network (CNN)  
- **Architecture**: MobileNetV2  
- **Dataset**: [TrashNet Dataset](https://huggingface.co/datasets/garythung/trashnet)  
- **Languages**: None (Image-based model)  
- **License**: MIT  

---

## **Model Description**  

This model classifies images of trash into six categories:  
- **trash**  
- **plastic**  
- **cardboard**  
- **metal**  
- **paper**  
- **glass**  

The model is designed to assist in waste segregation and recycling initiatives by automating the identification of waste types. It uses MobileNetV2, a lightweight CNN architecture pre-trained on ImageNet, fine-tuned on the TrashNet dataset for this specific task.  

---

## **Intended Use**  

### **Primary Use Cases**  
- Waste management systems to automate sorting.  
- Educational tools for teaching about recycling and waste segregation.  
- Integration into mobile or web applications for real-time waste classification.  

### **Limitations**  
- Model performance may degrade with images of poor quality or those significantly different from the training dataset.  
- Currently supports only six predefined trash categories.  

---

## **Performance Metrics**  

- **Training Accuracy**: 95%  
- **Testing Accuracy**: 90%  
- **Metrics Evaluated**: Accuracy, Precision, Recall, F1-score  
- **Confusion Matrix**: [Available in evaluation results]  

---

## **How to Use the Model**  

### **Input Format**  
- Images resized to 224x224 pixels and normalized to a range of 0-1.  

### **Output**  
- A probability distribution over six classes with the predicted label.  

### **Code Example**  

```python
from transformers import pipeline
from PIL import Image

# Load pre-trained model
classifier = pipeline("image-classification", model="your-model-id")

# Load an image
image = Image.open("sample_image.jpg")

# Perform classification
results = classifier(image)
print(results)
```

---

## **Training Details**  

- **Framework**: TensorFlow/Keras  
- **Optimizer**: Adam  
- **Learning Rate**: 0.001  
- **Loss Function**: Categorical Crossentropy  
- **Batch Size**: 32  
- **Epochs**: 20  

### **Data Preprocessing**  
- Images were resized to 224x224 pixels and normalized.  
- Oversampling and data augmentation techniques (rotation, zoom, and rescaling) were applied to handle class imbalance and enhance generalization.  

---

This model card is designed to comply with Hugging Face standards and can be adapted further as needed. Let me know if you need any specific sections expanded!
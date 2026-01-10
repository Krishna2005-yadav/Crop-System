import streamlit as st
import tensorflow as tf
import numpy as np
import os

# Tensorflow Model Prediction
def model_prediction(test_image):
    try:
        # Try to load the model, if not found, use the .h5 version
        try:
            model = tf.keras.models.load_model("trained_plant_disease_model.keras")
        except:
            model = tf.keras.models.load_model("plant_disease_model.h5")
        
        image = tf.keras.preprocessing.image.load_img(test_image, target_size=(128, 128))
        input_arr = tf.keras.preprocessing.image.img_to_array(image)
        input_arr = np.array([input_arr])  # convert single image to batch
        predictions = model.predict(input_arr)
        
        # Get confidence score
        confidence = np.max(predictions) * 100
        
        return np.argmax(predictions), confidence  # return index and confidence
    except Exception as e:
        st.error(f"Error in prediction: {str(e)}")
        return None, None

# Simple plant detection (basic validation)
def is_likely_plant_image(image_array):
    """
    Basic validation to check if image might be a plant
    This is a simple heuristic - not perfect but helps catch obvious non-plants
    """
    try:
        # Convert to grayscale for analysis
        gray = np.mean(image_array, axis=-1)
        
        # Check if image has reasonable plant-like characteristics
        # Plants typically have green/brown colors and texture
        
        # Simple color analysis
        r, g, b = np.mean(image_array, axis=(0, 1))
        
        # Plants typically have more green than red/blue
        if g > r and g > b and g > 50:  # Green dominant
            return True, "Plant-like colors detected"
        elif r > 100 and g > 100 and b > 100:  # Too bright/white
            return False, "Image appears too bright/white for a plant"
        elif r < 30 and g < 30 and b < 30:  # Too dark
            return False, "Image appears too dark to identify plant features"
        else:
            return True, "Image appears to be a plant"
            
    except Exception as e:
        return True, "Unable to validate image - proceeding with prediction"

# Get class names dynamically from the dataset
def get_class_names():
    # Use the actual classes from your dataset directly
    return [
        'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
        'Corn_(maize)___Common_rust_',
        'Corn_(maize)___Northern_Leaf_Blight',
        'Corn_(maize)___healthy',
        'Potato___Early_blight',
        'Potato___Late_blight',
        'Potato___healthy'
    ]

# Sidebar
st.sidebar.title("Dashboard")
app_mode = st.sidebar.selectbox("Select Page", ["Home", "About", "Disease Recognition"])

# Main Page
if app_mode == "Home":
    st.header("PLANT DISEASE RECOGNITION SYSTEM")
    
    # Check if home page image exists
    image_path = "home_page.jpeg"
    if os.path.exists(image_path):
        st.image(image_path, use_column_width=True)
    else:
        st.info("Home page image not found. Please add 'home_page.jpeg' to your project directory.")
    
    st.markdown("""
    Welcome to the Plant Disease Recognition System! 🌿🔍
    
    Our mission is to help in identifying plant diseases efficiently. Upload an image of a plant, and our system will analyze it to detect any signs of diseases. Together, let's protect our crops and ensure a healthier harvest!

    ### How It Works
    1. **Upload Image:** Go to the **Disease Recognition** page and upload an image of a plant with suspected diseases.
    2. **Analysis:** Our system will process the image using advanced algorithms to identify potential diseases.
    3. **Results:** View the results and recommendations for further action.

    ### Supported Plants
    Our system currently supports:
    - **Corn (Maize):** Cercospora leaf spot, Common rust, Northern Leaf Blight, and healthy states
    - **Potato:** Early blight, Late blight, and healthy states

    ### Why Choose Us?
    - **Accuracy:** Our system utilizes state-of-the-art machine learning techniques for accurate disease detection.
    - **User-Friendly:** Simple and intuitive interface for seamless user experience.
    - **Fast and Efficient:** Receive results in seconds, allowing for quick decision-making.

    ### Get Started
    Click on the **Disease Recognition** page in the sidebar to upload an image and experience the power of our Plant Disease Recognition System!

    ### About Us
    Learn more about the project, our team, and our goals on the **About** page.
    """)

# About Project
elif app_mode == "About":
    st.header("About")
    st.markdown("""
                #### About Dataset
                This dataset is recreated using offline augmentation from the original dataset. The original dataset can be found on this github repo.
                This dataset consists of about 87K rgb images of healthy and diseased crop leaves which is categorized into **7 different classes**.
                The total dataset is divided into 80/20 ratio of training and validation set preserving the directory structure.
                A new directory containing test images is created later for prediction purpose.
                
                #### Content
                1. **train** (13,018 images) - Located in `New Plant Diseases Dataset(Augmented)/train/`
                2. **validation** (17,572 images) - Located in `New Plant Diseases Dataset(Augmented)/valid/`
                3. **test** (Various test images) - Located in `test/test/`
                
                #### Dataset Structure
                The dataset contains images of **Corn (Maize)** and **Potato** plants:
                
                **Corn (Maize):**
                - Cercospora leaf spot Gray leaf spot
                - Common rust
                - Northern Leaf Blight
                - Healthy
                
                **Potato:**
                - Early blight
                - Late blight
                - Healthy
                
                #### Model Information
                - **Architecture:** Convolutional Neural Network (CNN)
                - **Input Size:** 128x128 RGB images
                - **Classes:** 7 different plant disease categories
                - **Training:** Uses the augmented dataset for better generalization
                - **Supported Crops:** Corn (Maize) and Potato only
                """)

# Prediction Page
elif app_mode == "Disease Recognition":
    st.header("Disease Recognition")
    
    # Get class names dynamically
    class_names = get_class_names()
    
    if class_names:
        st.info(f"Model supports {len(class_names)} different plant disease categories")
        st.write("**Supported Classes:**")
        for i, class_name in enumerate(class_names):
            if "healthy" in class_name.lower():
                st.write(f"🟢 {i+1}. {class_name}")
            else:
                st.write(f"🔴 {i+1}. {class_name}")
    
    test_image = st.file_uploader("Choose an Image:", type=['jpg', 'jpeg', 'png'])
    
    if test_image is not None:
        if st.button("Show Image"):
            st.image(test_image, use_column_width=True)
        
        # Predict button
        if st.button("Predict"):
            if test_image is not None:
                st.snow()
                st.write("Our Prediction")
                
                with st.spinner("Analyzing image..."):
                    result_index, confidence = model_prediction(test_image)
                
                if result_index is not None and result_index < len(class_names):
                    predicted_class = class_names[result_index]
                    
                    # Basic image validation
                    image_array = tf.keras.preprocessing.image.img_to_array(
                        tf.keras.preprocessing.image.load_img(test_image, target_size=(128, 128))
                    )
                    is_plant, validation_msg = is_likely_plant_image(image_array)
                    
                    if not is_plant:
                        st.warning("⚠️ **Warning:** This image doesn't appear to be a plant leaf!")
                        st.info(f"**Validation:** {validation_msg}")
                        st.info("**Recommendation:** Please upload a clear image of a corn or potato leaf for accurate disease detection.")
                        st.warning("**Note:** The prediction below may be incorrect for non-plant images.")
                    
                    st.success(f"Model is Predicting it's a **{predicted_class}**")
                    st.info(f"**Confidence:** {confidence:.1f}%")
                    
                    # Add confidence score (optional)
                    st.info(f"Prediction completed successfully!")
                    
                    # Show specific disease information based on the exact prediction
                    if "healthy" in predicted_class.lower():
                        st.success("🌱 This plant appears to be healthy!")
                    elif "corn" in predicted_class.lower():
                        if "healthy" in predicted_class.lower():
                            st.success("🌽 Your corn plant is healthy!")
                        elif "cercospora" in predicted_class.lower():
                            st.error("🍂 Your corn plant has **Cercospora Leaf Spot Gray Leaf Spot** disease!")
                            st.info("**Symptoms:** Gray to brown spots with yellow halos on leaves")
                            st.info("**Treatment:** Apply fungicide, improve air circulation, remove infected leaves")
                        elif "common rust" in predicted_class.lower():
                            st.error("🍂 Your corn plant has **Common Rust** disease!")
                            st.info("**Symptoms:** Reddish-brown pustules on leaves and stems")
                            st.info("**Treatment:** Apply fungicide, plant resistant varieties, avoid overhead watering")
                        elif "northern leaf blight" in predicted_class.lower():
                            st.error("🍂 Your corn plant has **Northern Leaf Blight** disease!")
                            st.info("**Symptoms:** Cigar-shaped gray to tan lesions on leaves")
                            st.info("**Treatment:** Apply fungicide, rotate crops, remove crop debris")
                    elif "potato" in predicted_class.lower():
                        if "healthy" in predicted_class.lower():
                            st.success("🥔 Your potato plant is healthy!")
                        elif "early blight" in predicted_class.lower():
                            st.error("🍂 Your potato plant has **Early Blight** disease!")
                            st.info("**Symptoms:** Dark brown spots with concentric rings on leaves")
                            st.info("**Treatment:** Apply fungicide, improve air circulation, avoid overhead watering")
                        elif "late blight" in predicted_class.lower():
                            st.error("🍂 Your potato plant has **Late Blight** disease!")
                            st.info("**Symptoms:** Water-soaked lesions that turn brown, white fungal growth")
                            st.info("**Treatment:** Apply fungicide immediately, remove infected plants, improve drainage")
                    else:
                        st.warning("⚠️ This plant shows signs of disease. Consider consulting with a plant expert.")
                        
                    # Add confidence warning
                    if confidence < 70:
                        st.warning("⚠️ **Low confidence warning:** This prediction has low confidence ({:.1f}%). The image might not be a clear plant leaf or might be of a different plant type.")
                        st.info("**Recommendation:** Upload a clearer image of a corn or potato leaf for better results.")
                else:
                    st.error("Prediction failed. Please try again with a different image.")
            else:
                st.error("Please upload an image first!")
    else:
        st.info("Please upload an image to get started with disease recognition.")

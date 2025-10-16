import streamlit as st
import spacy
import pandas as pd

# --- Configuración de la Página ---
st.set_page_config(
    page_title="Extractor de Entidades",
    page_icon="🔍",
    layout="centered"
)

# --- Título y Descripción ---
st.title("🔍 Extractor de Entidades Nombradas (NER)")
st.write(
    "Esta herramienta usa NLP para identificar y extraer entidades (como nombres de productos, "
    "organizaciones, lugares, etc.) directamente de un texto."
)

# --- Carga del Modelo (con caché para eficiencia) ---
@st.cache_resource
def load_spacy_model():
    print("Cargando modelo de spaCy...")
    model = spacy.load("es_core_news_lg")
    print("¡Modelo cargado exitosamente!")
    return model

nlp = load_spacy_model()

# --- Interfaz de Usuario ---
ejemplo_descripcion = (
    "Cyberpunk 2077 es un RPG de acción y aventura de mundo abierto ambientado en Night City, "
    "una megalópolis obsesionada con el poder y el glamur. Fue desarrollado por CD Projekt Red y "
    "lanzado para PlayStation 5, Xbox Series y PC."
)

texto_usuario = st.text_area(
    "Pega la descripción del juego aquí:",
    height=200,
    value=ejemplo_descripcion
)

# --- Lógica de Procesamiento y Visualización ---
if st.button("Extraer Entidades") and texto_usuario:
    st.divider()
    st.subheader("✅ Entidades Encontradas")
    st.write("Estas son todas las entidades que el modelo de NLP ha identificado en el texto y su clasificación:")
    
    doc = nlp(texto_usuario)
    
    if not doc.ents:
        st.warning("No se encontraron entidades en el texto proporcionado.")
    else:
        # Prepara los datos para la tabla usando list comprehensions
        data = {
            "Entidad (Texto)": [ent.text for ent in doc.ents],
            "Tipo (Clasificación)": [ent.label_ for ent in doc.ents]
        }
        
        # Crea un DataFrame de pandas
        df = pd.DataFrame(data)
        
        # Muestra la tabla en Streamlit, ocupando todo el ancho del contenedor
        st.dataframe(df, use_container_width=True)

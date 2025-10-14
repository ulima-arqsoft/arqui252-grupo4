from fastapi import FastAPI
from azure.cosmos import CosmosClient
import os

app = FastAPI()

# Variables de entorno (puedes reemplazar con tus valores reales de Azure)
URL = os.getenv("COSMOSDB_URL", "https://<TU_CUENTA>.documents.azure.com:443/")
KEY = os.getenv("COSMOSDB_KEY", "<TU_LLAVE_PRIMARIA>")
DB_NAME = "GameVault"
CONTAINER_NAME = "Products"

# Conexión a Cosmos DB
client = CosmosClient(URL, credential=KEY)
database = client.get_database_client(DB_NAME)
container = database.get_container_client(CONTAINER_NAME)

# Endpoints de prueba
@app.post("/add_product")
async def add_product(item: dict):
    container.create_item(body=item)
    return {"message": "Producto agregado exitosamente"}

@app.get("/products")
async def list_products():
    query = "SELECT * FROM c WHERE c.category = 'Retro'"
    items = list(container.query_items(query=query, enable_cross_partition_query=True))
    return {"products": items}

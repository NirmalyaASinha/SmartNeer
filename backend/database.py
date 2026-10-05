import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load credentials
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'atlas-credentials.env'))

MONGO_URI = os.getenv("MONGODB_URI")
if not MONGO_URI:
    raise ValueError("MONGODB_URI not found in atlas-credentials.env")

client = AsyncIOMotorClient(MONGO_URI)
db = client.smartneer

# Collections
users_collection = db.get_collection("users")
nodes_collection = db.get_collection("nodes")
telemetry_collection = db.get_collection("telemetry")
alerts_collection = db.get_collection("alerts")
tickets_collection = db.get_collection("tickets")

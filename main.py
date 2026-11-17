import os
import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException

load_dotenv()
app = FastAPI()
UNKEY_ROOT_KEY = os.getenv("UNKEY_ROOT_KEY")


async def verify_key(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="API key missing")

    key = authorization.removeprefix("Bearer ")

    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.unkey.com/v2/keys.verifyKey",
            headers={"Authorization": f"Bearer {UNKEY_ROOT_KEY}"},
            json={"key": key},
        )

    data = r.json().get("data", {})
    if not data.get("valid"):
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/protected", dependencies=[Depends(verify_key)])
async def protected():
    return {"message": "Your API key is valid!"}
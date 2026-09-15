import os

os.environ["DATABASE_URL"] = "sqlite:///./test_docflow.db"
os.environ["STORAGE_ROOT"] = "./test_storage"

import pytest
from fastapi.testclient import TestClient

from app.db.session import Base, engine
from app.main import app


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


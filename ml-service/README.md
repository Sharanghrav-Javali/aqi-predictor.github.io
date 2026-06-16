Setup and run (Windows PowerShell)

1. Create a virtual environment:

```powershell
python -m venv .venv
```

2. Activate the venv (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Copy and fill `.env` from the example:

```powershell
copy .env.example .env
# then edit .env to set your keys
```

5. Run the service (development):

```powershell
# run with Uvicorn (recommended)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

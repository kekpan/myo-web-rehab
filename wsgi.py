# Windows Registry issue
import mimetypes

# Development server
from werkzeug import run_simple

from application import build_app

# Windows Registry issue
mimetypes.add_type("text/javascript", ".js")

app = build_app()

# Development server
if __name__ == "__main__":
    run_simple(
        "127.0.0.1", 5000, app, use_reloader=True, use_debugger=True, use_evalex=True
    )

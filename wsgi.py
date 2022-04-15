# TODO: Check Windows Registry Issue
import mimetypes

from application import create_app

# TODO: Check Windows Registry Issue
mimetypes.add_type('text/javascript', '.js')

app = create_app()

from flask import Flask, redirect, jsonify, request, render_template, abort, send_from_directory
from werkzeug.middleware.proxy_fix import ProxyFix
from datetime import datetime
from functools import wraps
import secrets
import json
import os

# Setup

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.environ.get("SECRET_KEY", secrets.token_hex(32))
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax'
)
nfc_links = {
    1: "https://flipper.net",
}

if not os.path.exists("ips.json") or os.stat("ips.json").st_size == 0:
    with open("ips.json", "w") as f:
        json.dump([], f)

with open("ips.json", "r") as f:
    try:
        ips = json.load(f)
    except Exception as e:
        with open("error_log.txt", "a") as f:
            f.write(f"app.py - [{datetime.now().isoformat()}] - Error reading ips.json: {str(e)}\n")
        ips = []

# Decorators

def ip_restricted(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if request.remote_addr not in ips:
            abort(403)
        return func(*args, **kwargs)
    return wrapper

# Remove trailing slashes

@app.before_request
def remove_trailing_slash():
    if request.path != '/' and request.path.endswith('/') and request.method == 'GET':
        return redirect(request.path[:-1]), 301

#@app.before_request
#def ip_restrict():
#    if request.remote_addr not in ["127.0.0.1"]:
#        abort(403)

# Main pages

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html"), 200

@app.route("/calc", methods=["GET"])
def calc():
    return render_template("calc.html"), 200

@app.route("/fih", methods=["GET"])
def fih():
    return render_template("fih.html"), 200

# Redirects

@app.route("/status", methods=["GET"])
def status():
    return redirect("https://status.xangey.dev/"), 301

# File sharing

@app.route("/s/<file>", methods=["GET"])
def share(file):
    dl = request.args.get("dl")

    return send_from_directory("files", file, as_attachment=(dl == "1"))

# NFC tags

@app.route("/nfc/<int:nfc>")
def nfc(nfc):
    link = nfc_links[nfc]

    if link:
        return redirect(link), 302
    else:
        return abort(404)


# API

@app.route("/api", methods=["GET"])
def api():
    return jsonify({
        "name": "Xangey's API",
        "description": "Welcome to the API documentation! Here are the available endpoints:",
        "version": "1.2",
        "endpoints": {
            "/api": {
                "description": "Returns this API documentation.",
                "parameters": {},
                "type": "GET"
            },
            "/api/ip": {
                "description": "Returns the client's IP address.",
                "parameters": {},
                "example_response": {
                    "ip": "123.123.123.123"
                },
                "type": "GET"
            }
        }
    }), 200

@app.route("/api/ip", methods=["GET"])
def api_ip():
    return jsonify({"ip": request.remote_addr}), 200

# Error handlers

@app.errorhandler(401)
def unauthorized(e):
    return render_template("error/401.html"), 401

@app.errorhandler(403)
def forbidden(e):
    return render_template("error/403.html"), 403

@app.errorhandler(404)
def not_found(e):
    return render_template("error/404.html"), 404

@app.errorhandler(413)
def payload_too_large(e):
    return render_template("error/413.html"), 413

@app.errorhandler(429)
def too_many_requests(e):
    return render_template("error/429.html"), 429

@app.errorhandler(451)
def unavailable_for_legal_reasons(e):
    return render_template("error/451.html"), 451

@app.errorhandler(500)
def server_error(e):
    return render_template("error/500.html"), 500

@app.errorhandler(502)
def bad_gateway(e):
    return render_template("error/502.html"), 502

@app.errorhandler(503)
def service_unavailable(e):
    return render_template("error/503.html"), 503

# Preview error page

@app.route("/error/<int:code>", methods=["GET"])
def preview_error(code):
    if code not in [401, 403, 404, 413, 429, 451, 500, 502, 503]:
        abort(404)
    return render_template(f"error/{code}.html"), code

# Run the app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

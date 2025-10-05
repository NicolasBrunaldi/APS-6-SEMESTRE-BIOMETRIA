from flask import Flask

app = Flask(__name__)


@app.route("/inicio")
def olaMundo ():
    return "<h1>Ola Mundo</h1>"

app.run()
from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")
@app.route("/about")
def about():
    return render_template("about.html")
#@app.route("/new-page")
#def new_page():
#    return render_template("new-page.html")

if __name__ == "__main__":
    app.run(debug=True)

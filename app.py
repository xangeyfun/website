from flask import Flask, render_template

# Initialize the Flask application
app = Flask(__name__)

# Route definitions
@app.route("/")
def home():
    """Render the home page"""
    return render_template("index.html")

@app.route("/about")
def about():
    """Render the about page"""
    return render_template("about.html")

@app.route("/projects")
def projects():
    """Render the projects page"""
    return render_template("projects.html")

@app.route("/contact")
def contact():
    """Render the contact page"""
    return render_template("contact.html")

@app.route("/blog")
def blog():
    """Render the blog page"""
    return render_template("blog.html")

# Run the application
if __name__ == "__main__":
    app.run(debug=True)

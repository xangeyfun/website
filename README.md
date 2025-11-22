# Simple Flask Website

A small Flask website created by me to experiment with Python, HTML, and CSS.

## Features

- Home page with welcome message
- About page describing the project
- Simple CSS styling via `static/style.css`
- Designed as a playground for learning Flask and GitHub workflow

## Project Structure

```
website/
├── LICENSE
├── README.md
├── app.py
├── static
│   └── style.css
└── templates
    ├── about.html
    └── index.html

```

## Getting Started

### Install Flask

```bash
python3 -m pip install flask
```

### Run the website locally

```bash
python3 app.py
```

Open your browser and go to `http://127.0.0.1:5000/` to see the home page.

### Modify or Add Pages

1. Add new HTML files to the `templates/` folder.
2. Add new routes in `app.py`:

```python
@app.route("/new-page")
def new_page():
    return render_template("new-page.html")
```

## License

Do whatever you want with it.
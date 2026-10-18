# 🤖 AI Code Reviewer

An AI-powered code review application that analyzes source code using **Google Gemini** and returns structured review feedback to help developers identify potential issues and improve code quality.

## ✨ Overview

AI Code Reviewer provides a simple web interface for submitting source code for AI-assisted analysis. The FastAPI backend sends the code to Google's Gemini model with a structured review prompt and returns the parsed review results as JSON.

The project combines a lightweight frontend with a Python backend to demonstrate how generative AI can be integrated into a developer productivity tool.

## 🚀 Features

- **AI-powered code review:** Uses Google Gemini to analyze submitted source code.
- **Language-aware review:** Accepts source code and its programming language.
- **Structured feedback:** Returns parsed review issues in JSON format.
- **REST API backend:** Built with FastAPI.
- **Interactive web interface:** Uses HTML, CSS, and JavaScript.
- **Environment-based configuration:** Supports secure API key configuration through environment variables.
- **Local development support:** Run the backend with Uvicorn and automatic reloading.

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Programming language | Python |
| Backend framework | FastAPI |
| AI model integration | Google Gemini API |
| AI client library | Google Gen AI SDK |
| Frontend | HTML, CSS, JavaScript |
| Data validation | Pydantic |
| Development server | Uvicorn |

## 📁 Project Structure

```text
AI-code-reviewer/
│
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── .gitignore
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following before running the project:

- Python 3.10 or later
- pip
- A Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/sandeepklr12345-gif/AI-code-reviewer.git
cd AI-code-reviewer
```

### 2. Set up the backend

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure the Gemini API key

Set your API key as an environment variable in PowerShell:

```powershell
$env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

Replace `YOUR_GEMINI_API_KEY` with your own valid API key.

**Security:** Never commit API keys, passwords, or other credentials to GitHub. Keep secrets in environment variables or an untracked `.env` file if your application is configured to load one.

### 4. Start the backend server

From the `backend` directory, run:

```bash
uvicorn main:app --reload --port 8000
```

The backend should be available at:

- API server: `http://127.0.0.1:8000`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

### 5. Launch the frontend

Open `frontend/index.html` in your browser or serve the `frontend` directory through a local HTTP server.

For example, from the project root, open a separate terminal and run:

```bash
python -m http.server 5500 --directory frontend
```

Then visit:

`http://127.0.0.1:5500`

Ensure that the frontend's API URL points to the running backend. If the browser blocks requests, configure the frontend and backend origins consistently with the application's CORS settings.

## 🔄 How It Works

1. **Submit code:** The user provides source code and its programming language through the web interface.
2. **Send request:** The frontend sends the code to the FastAPI backend.
3. **Analyze code:** The backend constructs a structured review prompt and sends it to Google Gemini.
4. **Parse results:** The backend processes the model's response into structured JSON.
5. **Return feedback:** The frontend can present the returned review issues to the user.

## 🔐 Security Considerations

- Keep the Gemini API key private.
- Never hardcode API keys in source files or frontend JavaScript.
- Do not commit `.env` files or virtual environments.
- Validate user input and handle API errors appropriately.
- Treat AI-generated feedback as suggestions that require developer verification.

## 🗺️ Future Improvements

Potential enhancements include:

- Support for additional programming languages.
- Categorization of issues by severity.
- Code quality and maintainability suggestions.
- Suggested fixes and improved code snippets.
- Review history and downloadable reports.
- Automated testing and continuous integration.
- Deployment to a cloud hosting platform.

These are possible future enhancements and are not necessarily implemented in the current version.

## 🎯 Project Objective

The goal of AI Code Reviewer is to explore the integration of generative AI with web application development and provide developers with a convenient way to obtain structured, AI-assisted feedback on source code.

## 👨‍💻 Author

**Sandeep K**

GitHub: [@sandeepklr12345-gif](https://github.com/sandeepklr12345-gif)

---

*Built with Python, FastAPI, JavaScript, and Google Gemini.*

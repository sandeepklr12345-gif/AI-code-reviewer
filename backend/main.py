"""
AI Code Reviewer — backend

Single endpoint that takes source code + language, sends it to Gemini
with a structured-output prompt, and returns parsed review issues as JSON.

Run:
    pip install -r requirements.txt

PowerShell:
    $env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

Start:
    uvicorn main:app --reload --port 8000 --reload-exclude "venv/*"
"""

import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from google import genai
from google.genai import types


app = FastAPI(title="AI Code Reviewer")


# ---------- CORS ----------

# Allow the local frontend (or any origin, for a student project)
# to call this API.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Gemini Configuration ----------

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY environment variable is not set."
    )

client = genai.Client(api_key=GEMINI_API_KEY)

MODEL = "gemini-3.6-flash"


# ---------- Request / Response Models ----------

class ReviewRequest(BaseModel):
    code: str = Field(
        ...,
        description="Source code or diff to review"
    )

    language: str = Field(
        default="auto",
        description="e.g. python, javascript, java"
    )

    filename: Optional[str] = Field(
        default="submitted_code",
        description="Display name for the file"
    )


class Issue(BaseModel):
    file: str
    line_start: int
    line_end: int
    severity: str
    category: str
    title: str
    explanation: str
    suggested_fix: str
    code_snippet: str


class Summary(BaseModel):
    total_issues: int
    critical: int
    warning: int
    suggestion: int


class ReviewResponse(BaseModel):
    issues: List[Issue]
    summary: Summary


# ---------- Prompt ----------

PROMPT_TEMPLATE = """You are an expert software code reviewer.

Analyze the following source code and identify:

- Bugs
- Security vulnerabilities
- Style violations
- Performance issues

For each issue found, provide:

- The exact file and line number(s)
- A severity level:
  "critical" = serious bugs or security vulnerabilities
  "warning" = real issues that should be fixed
  "suggestion" = style, readability, or performance improvements
- A category:
  "security", "bug", "style", or "performance"
- A short title under 10 words
- A clear explanation of WHY it is an issue
- A concrete suggested fix
- The offending code snippet

Rules:

- Only flag real issues.
- Do not invent problems.
- Do not nitpick trivial formatting.
- Be specific.
- Reference exact variable and function names from the code.
- If the code has no issues, return an empty issues array.
- Do not force feedback.
- Line numbers must correspond to the numbered code below.
- Count source code lines starting from line 1.
- Do not include the added line numbers in code_snippet.

Filename: {filename}

Language: {language}

Code to review:

{numbered_code}
"""


# ---------- Helper Functions ----------

def number_lines(code: str) -> str:
    lines = code.splitlines()
    width = len(str(len(lines))) if lines else 1

    return "\n".join(
        f"{str(i + 1).rjust(width)}: {line}"
        for i, line in enumerate(lines)
    )


def build_summary(issues: List[Issue]) -> Summary:
    return Summary(
        total_issues=len(issues),
        critical=sum(1 for i in issues if i.severity == "critical"),
        warning=sum(1 for i in issues if i.severity == "warning"),
        suggestion=sum(1 for i in issues if i.severity == "suggestion"),
    )


# ---------- Review Endpoint ----------

@app.post(
    "/api/review",
    response_model=ReviewResponse
)
def review_code(req: ReviewRequest):

    # Validate input
    if not req.code.strip():
        raise HTTPException(
            status_code=400,
            detail="No code provided"
        )

    # Build review prompt
    prompt = PROMPT_TEMPLATE.format(
        filename=req.filename,
        language=req.language,
        numbered_code=number_lines(req.code),
    )

    # ---------- Gemini API Call ----------

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ReviewResponse,
            ),
        )

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error: {e}"
        )

    # ---------- Use the SDK's typed, pre-validated result ----------
    # Since response_schema=ReviewResponse was passed above, the SDK already
    # parses and validates the JSON into a ReviewResponse for us — no need
    # to re-parse response.text ourselves, and no need for a manual
    # markdown-fence-stripping step.

    review: Optional[ReviewResponse] = getattr(response, "parsed", None)

    if review is None:
        # Structured parsing failed on Gemini's side (e.g. the model was
        # blocked or returned something outside the schema). Surface a
        # clear error instead of crashing on a None access.
        raise HTTPException(
            status_code=502,
            detail=(
                "Gemini did not return a structured response. "
                "Try again or reduce input size."
            )
        )

    # Recompute the summary ourselves rather than trusting the model's
    # count, in case it miscounted.
    review.summary = build_summary(review.issues)

    return review


# ---------- Health Check ----------

@app.get("/api/health")
def health():
    return {"status": "ok"}


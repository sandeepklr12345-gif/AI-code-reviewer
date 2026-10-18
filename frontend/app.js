// ============================================================
// AI Code Reviewer — frontend logic
// Point this at your running FastAPI backend.
// ============================================================

const API_BASE = window.REVIEWER_API_BASE || "http://localhost:8000";

const el = {
  filename: document.getElementById("filename"),
  language: document.getElementById("language"),
  codeInput: document.getElementById("code-input"),
  reviewBtn: document.getElementById("review-btn"),
  intakeStatus: document.getElementById("intake-status"),
  intake: document.getElementById("intake"),
  results: document.getElementById("results"),
  newReviewBtn: document.getElementById("new-review-btn"),
  emptyBackBtn: document.getElementById("empty-back-btn"),
  errorBackBtn: document.getElementById("error-back-btn"),
  topbarStatus: document.getElementById("topbar-status"),
  statGrid: document.getElementById("stat-grid"),
  issueList: document.getElementById("issue-list"),
  sidebarFilename: document.getElementById("sidebar-filename"),
  codePane: document.getElementById("code-pane"),
  codeFilenameLabel: document.getElementById("code-filename-label"),
  codeMeta: document.getElementById("code-meta"),
  emptyState: document.getElementById("empty-state"),
  errorState: document.getElementById("error-state"),
  errorMessage: document.getElementById("error-message"),
};

el.reviewBtn.addEventListener("click", runReview);
el.newReviewBtn.addEventListener("click", resetToIntake);
el.emptyBackBtn.addEventListener("click", resetToIntake);
el.errorBackBtn.addEventListener("click", resetToIntake);

function resetToIntake() {
  el.results.classList.add("hidden");
  el.emptyState.classList.add("hidden");
  el.errorState.classList.add("hidden");
  el.newReviewBtn.classList.add("hidden");
  el.topbarStatus.textContent = "";
  el.intake.classList.remove("hidden");
}

async function runReview() {
  const code = el.codeInput.value;
  if (!code.trim()) {
    setIntakeStatus("Paste some code first.");
    return;
  }

  setLoading(true);
  setIntakeStatus("Reviewing...");

  try {
    const res = await fetch(`${API_BASE}/api/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language: el.language.value,
        filename: el.filename.value || "submitted_code",
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Request failed (${res.status})`);
    }

    const data = await res.json();
    setLoading(false);
    setIntakeStatus("");

    if (!data.issues || data.issues.length === 0) {
      showEmptyState();
    } else {
      renderResults(code, el.filename.value || "submitted_code", data.issues, data.summary);
    }
  } catch (err) {
    setLoading(false);
    showErrorState(err.message || "Could not reach the review service.");
  }
}

function setLoading(isLoading) {
  el.reviewBtn.disabled = isLoading;
  el.reviewBtn.querySelector(".btn-label").textContent = isLoading ? "Reviewing..." : "Run review";
}

function setIntakeStatus(text) {
  el.intakeStatus.textContent = text;
}

function showEmptyState() {
  el.intake.classList.add("hidden");
  el.errorState.classList.add("hidden");
  el.emptyState.classList.remove("hidden");
  el.newReviewBtn.classList.remove("hidden");
  el.topbarStatus.textContent = "0 findings";
}

function showErrorState(message) {
  el.intake.classList.add("hidden");
  el.emptyState.classList.add("hidden");
  el.errorMessage.textContent = message;
  el.errorState.classList.remove("hidden");
  el.newReviewBtn.classList.remove("hidden");
  el.topbarStatus.textContent = "";
}

function renderResults(code, filename, issues, summary) {
  el.intake.classList.add("hidden");
  el.emptyState.classList.add("hidden");
  el.errorState.classList.add("hidden");
  el.results.classList.remove("hidden");
  el.newReviewBtn.classList.remove("hidden");

  const sorted = [...issues].sort((a, b) => a.line_start - b.line_start);

  el.sidebarFilename.textContent = filename;
  el.codeFilenameLabel.textContent = filename;
  el.codeMeta.textContent = `${code.split("\n").length} lines`;
  el.topbarStatus.textContent = `${summary.total_issues} finding${summary.total_issues === 1 ? "" : "s"}`;

  renderStatGrid(summary);
  renderIssueList(sorted);
  renderCode(code, sorted);
}

function renderStatGrid(summary) {
  el.statGrid.innerHTML = `
    <div class="stat-cell critical">
      <span class="stat-count">${summary.critical}</span>
      <span class="stat-label">Critical</span>
    </div>
    <div class="stat-cell warning">
      <span class="stat-count">${summary.warning}</span>
      <span class="stat-label">Warning</span>
    </div>
    <div class="stat-cell suggestion">
      <span class="stat-count">${summary.suggestion}</span>
      <span class="stat-label">Suggest</span>
    </div>
  `;
}

function renderIssueList(sortedIssues) {
  el.issueList.innerHTML = sortedIssues
    .map(
      (issue, idx) => `
    <div class="issue-list-item" data-idx="${idx}">
      <span class="issue-dot ${issue.severity}"></span>
      <div class="issue-item-text">
        <div class="issue-item-title">${escapeHtml(issue.title)}</div>
        <div class="issue-item-line">L${issue.line_start}${issue.line_end !== issue.line_start ? "-" + issue.line_end : ""} &middot; ${issue.category}</div>
      </div>
    </div>
  `
    )
    .join("");

  el.issueList.querySelectorAll(".issue-list-item").forEach((item) => {
    item.addEventListener("click", () => {
      const idx = item.dataset.idx;
      const thread = document.getElementById(`thread-${idx}`);
      if (!thread) return;

      document.querySelectorAll(".issue-list-item").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      document.querySelectorAll(".thread.open").forEach((t) => t.classList.remove("open"));
      thread.classList.add("open");
      thread.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

function renderCode(code, sortedIssues) {
  const lines = code.split("\n");
  const width = String(lines.length).length;

  // Map each ending line number to the issues whose thread should appear there.
  const issuesByEndLine = {};
  sortedIssues.forEach((issue, idx) => {
    const key = issue.line_end;
    if (!issuesByEndLine[key]) issuesByEndLine[key] = [];
    issuesByEndLine[key].push({ ...issue, idx });
  });

  // Map each line number to its (highest-priority) severity for the flagged-line tint.
  const lineSeverity = {};
  const rank = { critical: 3, warning: 2, suggestion: 1 };
  sortedIssues.forEach((issue) => {
    for (let n = issue.line_start; n <= issue.line_end; n++) {
      if (!lineSeverity[n] || rank[issue.severity] > rank[lineSeverity[n]]) {
        lineSeverity[n] = issue.severity;
      }
    }
  });

  let html = "";
  lines.forEach((line, i) => {
    const n = i + 1;
    const sev = lineSeverity[n];
    const cls = sev ? `code-line flagged ${sev}` : "code-line";
    html += `<div class="${cls}"><span class="line-num">${String(n).padStart(width, " ")}</span><span class="line-content">${escapeHtml(line) || " "}</span></div>`;

    if (issuesByEndLine[n]) {
      issuesByEndLine[n].forEach((issue) => {
        html += buildThread(issue, issue.idx);
      });
    }
  });

  el.codePane.innerHTML = html;

  el.codePane.querySelectorAll(".thread-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".thread").classList.toggle("open");
    });
  });
}

function buildThread(issue, idx) {
  return `
    <div class="thread ${issue.severity}" id="thread-${idx}">
      <button class="thread-toggle" type="button">
        <span class="thread-chevron">&#9656;</span>
        <span class="thread-category">${issue.category}</span>
        <span class="thread-title">${escapeHtml(issue.title)}</span>
      </button>
      <div class="thread-body">
        <p class="thread-explanation">${escapeHtml(issue.explanation)}</p>
        <div class="thread-fix-label">Suggested fix</div>
        <div class="thread-fix">${escapeHtml(issue.suggested_fix)}</div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
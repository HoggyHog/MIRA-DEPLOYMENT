import os
from openai import OpenAI
from langsmith import traceable, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
assert OPENAI_API_KEY, "OPENAI_API_KEY environment variable is not set"

openai_client = OpenAI(api_key=OPENAI_API_KEY)
langsmith_client = Client()

# 1. Topic and Terminology Extractor Agent
@traceable(client=langsmith_client, project_name="Mira-Content-Summarization")
def extract_topics_and_terminology(text_chunk: str) -> str:
    prompt = f"""
You are a CBSE academic analyst. Given the following educational content, identify the **main topics and subtopics** as well as **key definitions and terminology** that are essential for understanding.

- Output a bullet list of topics and subtopics in the order they appear.
- For each topic, highlight any important definitions or concepts in bold.
- Do not simplify technical information.
- Maintain academic tone, aligned with NCERT CBSE pedagogy.

Content:
{text_chunk}
"""
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": prompt}],
        max_tokens=1500,
        temperature=0.2
    )
    return response.choices[0].message.content or ""

# 2. Example and Problem Extractor Agent
@traceable(client=langsmith_client, project_name="Mira-Content-Summarization")
def extract_examples_and_problems(text_chunk: str) -> str:
    prompt = f"""
You are a CBSE assistant teacher. Extract all examples or problems (if any) present in the given content, and provide brief model solutions. Your tone should match NCERT standards for the appropriate grade.

- Do not invent examples, only extract what's present.
- Keep solutions short and concept-oriented.

Content:
{text_chunk}
"""
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": prompt}],
        max_tokens=1500,
        temperature=0.2
    )
    return response.choices[0].message.content or ""

# 3. Pedagogical Formatter Agent
@traceable(client=langsmith_client, project_name="Mira-Content-Summarization")
def pedagogical_formatter(topics_data: str, examples_data: str, grade: str, subject: str) -> str:
    prompt = f"""
You are a CBSE pedagogy expert. Given the topics, definitions, and examples below, create a structured summary that would be easy for a student of {grade} in the subject {subject} to understand and remember.

- Use proper headings and subheadings.
- Highlight definitions and keywords in **bold**.
- Ensure language and tone are suitable for {grade} level.
- Keep structure similar to NCERT summaries.
- Use bullet points and short paragraphs.

Input:
Topics & Definitions: {topics_data}
Examples & Solutions: {examples_data}
"""
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": prompt}],
        max_tokens=3000,
        temperature=0.2
    )
    return response.choices[0].message.content or ""

def format_summary_as_markdown(data: dict) -> str:
    md = ""

    '''
    if "topics_and_terminology" in data:
        md += "## 📚 Topics and Terminology\n\n"
        md += data["topics_and_terminology"].strip() + "\n\n"

    if "examples_and_problems" in data:
        md += "## 💡 Examples and Problems\n\n"
        md += data["examples_and_problems"].strip() + "\n\n"
    '''

    if "pedagogical_summary" in data:
        md += "## 📝 Final Summary\n\n"
        md += data["pedagogical_summary"].strip()

    return md

import re

def clean_markdown(md: str) -> str:
    # 1. Normalize LaTeX inline math: (...) → \( ... \) safely
    md = re.sub(
        r"(?<!\\)\(([^()\n]+?)\)",  # match non-nested () not already escaped
        lambda m: f"\\({m.group(1).replace(',', '').strip()}\\)",
        md
    )

    # 2. Fix double backslashes (\\( → \()
    md = md.replace("\\\\(", "\\(").replace("\\\\)", "\\)")

    # 3. Convert improperly bolded LaTeX units: **Amperes \(A\)** → **Amperes (A)**
    md = re.sub(r"\*\*([A-Za-z ]+?)\\\((.*?)\\\)\*\*", r"**\1 (\2)**", md)

    # 4. Normalize math symbols: convert (Ω) → \Omega inside math
    md = re.sub(r"\\text\{([A-Za-z]+)\}", r"\1", md)

    # 5. Replace $$ blocks (if any) with \[ \] to stay consistent with KaTeX plugin
    md = re.sub(r"\$\$(.*?)\$\$", r"\\[\1\\]", md, flags=re.DOTALL)

    # 6. Clean accidental spaces around math
    md = re.sub(r"\\\(\s*", r"\\(", md)
    md = re.sub(r"\s*\\\)", r"\\)", md)
    md = re.sub(r"\\\[\s*", r"\\[", md)
    md = re.sub(r"\s*\\\]", r"\\]", md)
    return md


# Orchestrator class to run the full summarization pipeline
class SummarizationOrchestrator:
    def __init__(self, grade: str = "10", subject: str = "General Studies"):
        self.grade = grade
        self.subject = subject

    @traceable(client=langsmith_client, project_name="Mira-Content-Summarization")
    def summarize(self, text_chunk: str) -> dict:
        topics = extract_topics_and_terminology(text_chunk)
        examples = extract_examples_and_problems(text_chunk)
        summary = pedagogical_formatter(topics, examples, self.grade, self.subject)
        raw_output = {
        "topics_and_terminology": topics,
        "examples_and_problems": examples,
        "pedagogical_summary": summary
        }

        raw_output["markdown"] = clean_markdown(format_summary_as_markdown(raw_output))
        print(raw_output["markdown"])

        return raw_output
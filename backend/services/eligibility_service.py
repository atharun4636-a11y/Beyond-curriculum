from typing import Tuple, Dict, Any

def evaluate_employee_eligibility(hackathon_data: Dict[str, Any]) -> Tuple[str, str]:
    """
    Evaluates whether a hackathon/opportunity is eligible for working company employees.

    Returns:
        (status, reason)
        where status is 'eligible', 'not_eligible', or 'uncertain'.
    """
    if not hackathon_data:
        return "uncertain", "Missing opportunity payload"

    # Extract all text sources
    elig_str = str(hackathon_data.get("eligibility") or "").strip()
    part_type = str(hackathon_data.get("participantType") or hackathon_data.get("applicantType") or "").strip()
    edu_level = str(hackathon_data.get("educationLevel") or hackathon_data.get("userType") or "").strip()
    title = str(hackathon_data.get("name") or hackathon_data.get("title") or "").strip()
    desc = str(hackathon_data.get("description") or hackathon_data.get("statement") or "").strip()
    tags = str(hackathon_data.get("tags") or hackathon_data.get("category") or "").strip()

    combined_text = f"{elig_str} {part_type} {edu_level} {title} {desc} {tags}".lower()
    elig_lower = elig_str.lower()

    # 1. Check for Explicit Employee / Professional / Open-to-All Inclusions
    eligible_keywords = [
        "working professional", "working professionals",
        "professional", "professionals",
        "employee", "employees", "corporate", "industry professional", "industry professionals",
        "developer", "developers", "engineer", "engineers", "graduates",
        "open to all", "open for all", "anyone", "public", "individuals", "any individual",
        "above 18", "18+", "professionals and students", "students and professionals",
        "students and working professionals"
    ]

    has_eligible_keyword = any(kw in combined_text for kw in eligible_keywords)

    # 2. Check for Explicit Student-Only Exclusions
    student_only_keywords = [
        "school student", "school students", "class 6", "class 7", "class 8", "class 9",
        "class 10", "class 11", "class 12", "class 8-12", "class 6-12", "high school",
        "primary school", "middle school",
        "college student", "college students", "undergraduate", "b.tech student", "b.tech students",
        "b.e student", "engineering student", "mba student", "campus student", "campus students",
        "students only", "for students only", "only for students", "enrolled students"
    ]

    has_student_keyword = any(kw in combined_text for kw in student_only_keywords)

    # Specific phrase checks on eligibility field
    if elig_lower in ["school students", "school student", "college students", "college student", "college students only", "students only", "class 8-12 students"]:
        has_student_keyword = True
        has_eligible_keyword = False

    # Decision Matrix
    if has_student_keyword and not has_eligible_keyword:
        if "school" in combined_text or "class" in combined_text:
            reason = "Restricted to school students only"
        elif "college" in combined_text or "campus" in combined_text or "b.tech" in combined_text:
            reason = "Restricted to college/university students only"
        else:
            reason = "Restricted to students only"
        return "not_eligible", reason

    if has_eligible_keyword:
        return "eligible", "Working professionals and company employees are eligible"

    # If eligibility string is completely empty or generic missing
    if not elig_str or elig_str.lower() in ["", "none", "n/a", "tbd", "undefined"]:
        return "uncertain", "Eligibility criteria missing or unspecified"

    # If eligibility string exists but doesn't mention student-only exclusions
    if not has_student_keyword:
        return "eligible", "No student-only restrictions specified"

    return "uncertain", "Eligibility criteria ambiguous"

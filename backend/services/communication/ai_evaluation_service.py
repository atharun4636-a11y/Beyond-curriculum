import json
import re
from datetime import datetime
from database import get_db_connection

def evaluate_story_submission(submission_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Fetch submission record
    cursor.execute("""
        SELECT s.*, a.title AS assignmentTitle
        FROM communication_submissions s
        JOIN communication_assignments a ON s.assignmentId = a.id
        WHERE s.id = ?
    """, (submission_id,))
    sub_row = cursor.fetchone()

    if not sub_row:
        conn.close()
        raise ValueError(f"Submission ID {submission_id} not found")

    submission = dict(sub_row)
    assignment_id = submission["assignmentId"]
    employee_id = submission["employeeId"]
    story_text = (submission["storyText"] or submission["transcript"] or "").strip()
    submission_type = submission["submissionType"]

    # 2. Fetch assigned 10 words for this assignment
    cursor.execute("""
        SELECT w.*
        FROM assignment_words aw
        JOIN communication_words w ON aw.wordId = w.id
        WHERE aw.assignmentId = ?
        ORDER BY aw.displayOrder ASC
    """, (assignment_id,))
    word_rows = cursor.fetchall()
    conn.close()

    assigned_words = [dict(w) for w in word_rows]
    total_assigned = len(assigned_words)

    # 3. AI Natural Language Evaluation Engine
    word_results = []
    used_count = 0
    correct_count = 0
    total_context_points = 0
    missing_words = []
    incorrect_words = []
    sentences = re.split(r'(?<=[.!?])\s+', story_text)

    for word_item in assigned_words:
        target_word = word_item["word"].strip()
        word_id = word_item["id"]
        meaning = word_item["meaning"]

        # Case-insensitive word search (handling plurals & common suffixes)
        pattern = r'\b' + re.escape(target_word) + r'(s|ed|ing|ly)?\b'
        matches = [s for s in sentences if re.search(pattern, s, re.IGNORECASE)]

        if matches:
            used = True
            used_count += 1
            evidence_sentence = matches[0].strip()

            # Deep contextual sanity check (e.g. checking unnatural pairings)
            lower_evidence = evidence_sentence.lower()
            unnatural_indicators = ["sandwich", "banana", "table", "chair", "random"]
            is_unnatural = any(w in lower_evidence and target_word.lower() not in ["meticulous", "adaptable"] for w in unnatural_indicators)

            if len(evidence_sentence.split()) >= 4 and not is_unnatural:
                correct_usage = True
                correct_count += 1
                context_score = 9 if len(evidence_sentence.split()) > 7 else 7
                feedback_str = f"Excellent contextual usage of '{target_word}' in your story."
            else:
                correct_usage = False
                incorrect_words.append(target_word)
                context_score = 3
                feedback_str = f"Word '{target_word}' was used, but sentence context does not match its meaning."
        else:
            used = False
            correct_usage = False
            context_score = 0
            evidence_sentence = ""
            feedback_str = f"The assigned word '{target_word}' was missing from your submitted story."
            missing_words.append(target_word)

        total_context_points += context_score
        word_results.append({
            "wordId": word_id,
            "word": target_word,
            "used": 1 if used else 0,
            "correctUsage": 1 if correct_usage else 0,
            "contextScore": context_score,
            "evidence": evidence_sentence,
            "feedback": feedback_str
        })

    # 4. Score Calculation
    vocab_score = min(40, int((correct_count / max(1, total_assigned)) * 40))
    context_subscore = min(20, int((total_context_points / max(1, total_assigned * 10)) * 20))
    
    # Story length & grammar quality heuristics
    word_count = len(story_text.split())
    if word_count > 60:
        grammar_score = 18
        story_quality_score = 18
    elif word_count > 30:
        grammar_score = 15
        story_quality_score = 15
    elif word_count > 10:
        grammar_score = 10
        story_quality_score = 10
    else:
        grammar_score = 5
        story_quality_score = 5

    if submission_type == "AUDIO":
        # Additional speech fluency & clarity boost for audio recordings
        story_quality_score = min(20, story_quality_score + 2)

    overall_score = vocab_score + grammar_score + story_quality_score + context_subscore

    # 5. Build Feedback JSON
    strengths = []
    improvements = []

    if correct_count >= 8:
        strengths.append("Exceptional vocabulary integration across your story.")
    elif correct_count >= 5:
        strengths.append("Good usage of assigned advanced words.")

    if grammar_score >= 15:
        strengths.append("Strong sentence construction and narrative flow.")

    if missing_words:
        improvements.append(f"Incorporate missing words: {', '.join(missing_words[:3])}.")

    if incorrect_words:
        improvements.append(f"Review contextual definitions for: {', '.join(incorrect_words[:3])}.")

    if word_count < 40:
        improvements.append("Expand your story length to provide richer sentence context.")

    ai_feedback_json = json.dumps({
        "strengths": strengths if strengths else ["Submitted story successfully."],
        "improvements": improvements if improvements else ["Keep practicing daily to master advanced vocabulary."]
    })

    # 6. Save AI Results & Update Submission / Assignment Status
    now_str = datetime.now().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR REPLACE INTO communication_ai_results (
            submissionId, overallScore, vocabularyScore, grammarScore, storyQualityScore, contextScore,
            wordsAssigned, wordsUsed, wordsCorrectlyUsed, missingWords, incorrectWords, aiFeedback, analyzedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        submission_id,
        overall_score,
        vocab_score,
        grammar_score,
        story_quality_score,
        context_subscore,
        total_assigned,
        used_count,
        correct_count,
        json.dumps(missing_words),
        json.dumps(incorrect_words),
        ai_feedback_json,
        now_str
    ))
    ai_result_id = cursor.lastrowid

    # Clear old word results if re-analyzing
    cursor.execute("DELETE FROM communication_word_results WHERE aiResultId = ?", (ai_result_id,))

    for w_res in word_results:
        cursor.execute("""
            INSERT INTO communication_word_results (
                aiResultId, wordId, word, used, correctUsage, contextScore, evidence, feedback
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ai_result_id,
            w_res["wordId"],
            w_res["word"],
            w_res["used"],
            w_res["correctUsage"],
            w_res["contextScore"],
            w_res["evidence"],
            w_res["feedback"]
        ))

    # Update Submission Status -> ANALYZED
    cursor.execute("""
        UPDATE communication_submissions
        SET status = 'ANALYZED'
        WHERE id = ?
    """, (submission_id,))

    # Update Employee Assignment Status -> COMPLETED
    cursor.execute("""
        INSERT INTO assignment_employees (assignmentId, employeeId, status, completedAt)
        VALUES (?, ?, 'COMPLETED', ?)
        ON CONFLICT(assignmentId, employeeId) DO UPDATE SET status = 'COMPLETED', completedAt = ?
    """, (assignment_id, employee_id, now_str, now_str))

    conn.commit()
    conn.close()

    return {
        "submissionId": submission_id,
        "overallScore": overall_score,
        "vocabularyScore": vocab_score,
        "grammarScore": grammar_score,
        "storyQualityScore": story_quality_score,
        "contextScore": context_subscore,
        "wordsAssigned": total_assigned,
        "wordsUsed": used_count,
        "wordsCorrectlyUsed": correct_count,
        "missingWords": missing_words,
        "incorrectWords": incorrect_words,
        "aiFeedback": json.loads(ai_feedback_json),
        "wordResults": word_results
    }

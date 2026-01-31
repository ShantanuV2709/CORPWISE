import asyncio
from datetime import datetime

from app.services.chat_orchestrator import process_chat
from app.db.mongodb import db
from app.evaluation.comparator import evaluate_result


async def run_evaluation():
    golden_questions = db.golden_questions
    evaluation_runs = db.evaluation_runs

    run_id = datetime.utcnow().isoformat()
    print(f"\n🧪 Starting evaluation run: {run_id}\n")

    cursor = golden_questions.find()

    async for q in cursor:
        question_id = q["question_id"]
        query = q["query"]

        print(f"▶ Evaluating: {question_id}")

        start_time = datetime.utcnow()

        result = await process_chat(
            user_id=f"eval_{run_id}",
            question=query
        )

        latency_ms = int(
            (datetime.utcnow() - start_time).total_seconds() * 1000
        )

        comparison = evaluate_result(
            expected_sources=q["expected_sources"],
            retrieved_sources=result.get("sources", []),
            confidence_score=(
                1.0 if result.get("confidence") == "high"
                else 0.5 if result.get("confidence") == "medium"
                else 0.0
            ),
            confidence_label=result.get("confidence"),
            min_confidence_score=q.get("min_confidence_score", 0.0),
            required_confidence=q["required_confidence"]
        )

        evaluation_doc = {
            "run_id": run_id,
            "question_id": question_id,
            "query": query,

            "passed": comparison["passed"],
            "missing_sources": comparison["missing_sources"],
            "unexpected_sources": comparison["unexpected_sources"],

            "confidence": result.get("confidence"),
            "sources": result.get("sources"),
            "cached": result.get("cached"),

            "latency_ms": latency_ms,
            "created_at": datetime.utcnow()
        }

        await evaluation_runs.insert_one(evaluation_doc)

    print("\n✅ Evaluation run completed.\n")


if __name__ == "__main__":
    asyncio.run(run_evaluation())

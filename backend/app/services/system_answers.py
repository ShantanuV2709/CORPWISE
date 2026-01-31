from app.db.mongodb import db

async def get_system_answer():
    doc = await db.system_info.find_one({})

    if not doc:
        return (
            "CORPWISE is an intelligent corporate AI platform designed to "
            "optimize workflows, automate decision-making, and provide "
            "secure, scalable AI-powered enterprise assistance."
        )

    return f"{doc['name']} is {doc['description']}"

# Conversation Memory Lifecycle
## How CORPWISE Manages Memory

CORPWISE manages conversation memory using session-based storage in MongoDB.
Each user session maintains recent conversational context, which is retrieved
during query processing to provide continuity.
CORPWISE manages user memory using a lifecycle-based approach. Short-term memory
is maintained per session for conversational continuity, while long-term memory
is stored in MongoDB as persisted conversation history. Memory retention policies
control how long data is stored and when it is expired or deleted.

Memory is managed through:
- Session-based storage
- Configurable expiration policies
- Automatic cleanup of stale conversations
- Controlled context injection into the LLM

## Storage
- Conversations are stored in MongoDB
- Each user has a conversation document

## Retrieval
- Recent messages are retrieved per session
- Used for short-term conversational context

## Expiration
- No automatic TTL by default
- Future support may include time-based cleanup

## Privacy & Security
- Memory is scoped per user
- No cross-user leakage

## Memory Management in CORPWISE

CORPWISE manages conversation memory by maintaining session-based chat histories
stored in MongoDB with configurable expiration policies.

Memory lifecycle management includes:
- Session creation
- Context retention
- Time-based expiration
- Cleanup of stale conversations


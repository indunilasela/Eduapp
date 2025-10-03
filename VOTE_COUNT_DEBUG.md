# 🐛 Vote Count Issue Analysis

## Problem Description
When a user votes, the count increases/decreases by **2 points** instead of **1 point**.

## Current Logic Analysis

### Comment Vote Change Logic (Lines 1158-1168):
```javascript
if (voteType === 'upvote') {
  upvotes += 1;                    // ❌ WRONG: Adding to existing count
  downvotes = Math.max(downvotes - 1, 0);
} else {
  downvotes += 1;                  // ❌ WRONG: Adding to existing count  
  upvotes = Math.max(upvotes - 1, 0);
}
```

## Problem Explanation

### Scenario: User changes from upvote to downvote
1. **Initial State**: upvotes=5, downvotes=1 (user's upvote already counted)
2. **Current Logic**:
   - `downvotes += 1` → downvotes = 2 ✅ (correct)
   - `upvotes = Math.max(upvotes - 1, 0)` → upvotes = 4 ✅ (correct)
3. **Net Change**: 5-4 + 2-1 = 1 + 1 = 2 points ❌

Wait, let me trace this again...

Actually, the logic looks correct. Let me check if there's a different issue - maybe the vote is being processed twice or there's an issue with how the counts are retrieved initially.

## Possible Causes:
1. **Double Processing**: Vote endpoint called twice
2. **Race Condition**: Multiple requests processing simultaneously
3. **Initial Count Issue**: Current counts not retrieved correctly
4. **Database Update Issue**: Multiple updates happening

Let me create a test to verify this.

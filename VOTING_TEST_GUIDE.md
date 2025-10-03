# 🧪 Vote Count Issue Test Guide

## Test the Vote Count Problem

Now that the server has debug logging enabled, you can test the voting issue and see exactly what's happening.

### **Test Steps:**

#### **1. Test Comment Voting:**
```bash
# First, add a comment (replace with real answerId and JWT token)
POST http://localhost:4000/api/answers/YOUR_ANSWER_ID/comments
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "content": "Test comment for voting"
}
```

#### **2. Vote on the comment (first vote):**
```bash
POST http://localhost:4000/api/comments/YOUR_COMMENT_ID/vote
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "voteType": "upvote"
}
```

**Expected Result:** upvotes should increase by 1

#### **3. Change the vote:**
```bash
POST http://localhost:4000/api/comments/YOUR_COMMENT_ID/vote
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "voteType": "downvote"
}
```

**Expected Result:** upvotes should decrease by 1, downvotes should increase by 1 (net change = 2 points)
**Problem:** If you're seeing a 2-point change when it should be 1-point

### **Debug Output to Watch:**

Look for these log messages in the server console:

```
🔍 VOTE DEBUG - Initial counts: upvotes=X, downvotes=Y
🔍 VOTE DEBUG - Existing vote: upvote, New vote: downvote
🔍 VOTE DEBUG - Vote change: upvote → downvote
🔍 VOTE DEBUG - Before change: upvotes=X, downvotes=Y
🔍 VOTE DEBUG - After change: upvotes=X, downvotes=Y
```

### **Suspected Issues:**

1. **Logic Error:** The vote change calculation might be wrong
2. **Double Processing:** The endpoint might be called twice
3. **Race Condition:** Multiple requests processing simultaneously
4. **Database Issue:** Counts not being updated correctly

### **Quick Manual Test:**

You can also test this by:
1. Going to your mobile app or frontend
2. Vote on any comment/answer
3. Watch the server console for debug logs
4. Check if the count changes match the expected 1-point change

The debug logs will show us exactly where the issue is occurring! 🔍

---

## **If You See the Issue:**

Please share the debug output from the server console, and I'll identify the exact cause and fix it immediately.

## **Expected Fix:**

Once we identify the issue, the fix will likely be one of these:
1. Correct the vote calculation logic
2. Prevent duplicate processing
3. Fix race conditions
4. Correct database update sequence

Your voting system will then work with proper 1-point changes! ✅
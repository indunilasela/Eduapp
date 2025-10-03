# 🎯 Vote System Behavior Options

## Current System (2-point swing)
When user changes upvote → downvote:
- Remove upvote: -1 point
- Add downvote: -1 point  
- **Total change: -2 points**

Example: 5 upvotes, 2 downvotes (total = +3)
→ User changes upvote to downvote
→ 4 upvotes, 3 downvotes (total = +1)
→ Change: +3 to +1 = **2-point decrease** ✅

## Alternative System (1-point change)
When user changes upvote → downvote:
- Remove upvote: -1 point
- Add downvote: +0 points (neutral)
- **Total change: -1 point**

OR

- Change upvote to neutral: -0.5 points
- Change neutral to downvote: -0.5 points
- **Total change: -1 point**

## Question for You:

**Which behavior do you want?**

1. **Current (like Stack Overflow)**: Vote change = 2-point swing
2. **Modified**: Vote change = 1-point change only

If you want option 2, I can modify the code to make vote changes only count as 1 point instead of 2.

Please let me know which system you prefer! 🤔
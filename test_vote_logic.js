// Simple vote logic test
function testVoteLogic() {
  console.log("=== VOTE LOGIC TEST ===");
  
  // Initial state
  let upvotes = 5;
  let downvotes = 2;
  let totalVotes = upvotes - downvotes; // = 3
  
  console.log(`Initial: upvotes=${upvotes}, downvotes=${downvotes}, total=${totalVotes}`);
  
  // User currently has an upvote (so their +1 is already in the upvotes=5)
  // User wants to change to downvote
  
  // Current logic:
  console.log("\n--- User changes from upvote to downvote ---");
  console.log("Current logic:");
  
  // Remove old upvote
  let newUpvotes = upvotes - 1; // 5 - 1 = 4
  console.log(`After removing upvote: upvotes=${newUpvotes}`);
  
  // Add new downvote  
  let newDownvotes = downvotes + 1; // 2 + 1 = 3
  console.log(`After adding downvote: downvotes=${newDownvotes}`);
  
  let newTotal = newUpvotes - newDownvotes; // 4 - 3 = 1
  console.log(`New total: ${newTotal}`);
  
  console.log(`\nChange: ${totalVotes} → ${newTotal} = ${newTotal - totalVotes} points`);
  console.log("Expected: -2 points (from +1 to -1)");
  
  if (newTotal - totalVotes === -2) {
    console.log("✅ Logic is CORRECT");
  } else {
    console.log("❌ Logic is WRONG");
  }
}

testVoteLogic();
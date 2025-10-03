# 🗳️ Answer Voting System - Complete Documentation

## ✅ **Answer Voting Endpoint**

Your Add Answer system includes a complete answer voting system that works exactly like the comment voting system.

### **POST** `/api/answers/:answerId/vote`

Vote on a specific answer (upvote or downvote).

**Authentication**: Required (JWT Token)

**Headers**:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**URL Parameters**:
- `answerId` (string): The ID of the answer to vote on

**Request Body**:
```json
{
  "voteType": "upvote"    // or "downvote"
}
```

**Vote Behavior**:
- **New Vote**: Adds vote and updates counts
- **Same Vote**: Ignored (no change, returns success with alreadyVoted flag)
- **Different Vote**: Changes vote type (upvote ↔ downvote)
- **Own Answer**: Not allowed

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Answer upvoted successfully",
  "data": {
    "voteType": "upvote",
    "upvotes": 15,
    "downvotes": 2,
    "totalVotes": 13
  }
}
```

**Duplicate Vote Response (200)**:
```json
{
  "success": true,
  "message": "Answer already upvoted",
  "data": {
    "voteType": "upvote",
    "upvotes": 15,
    "downvotes": 2,
    "totalVotes": 13,
    "alreadyVoted": true  // Indicates duplicate vote was ignored
  }
}
```

**Error Responses**:
```json
// Own answer
{
  "success": false,
  "message": "You cannot vote on your own answer"
}

// Invalid vote type
{
  "success": false,
  "message": "Vote type must be \"upvote\" or \"downvote\""
}

// Answer not found
{
  "success": false,
  "message": "Answer not found"
}
```

---

## 📱 **Mobile App Integration**

### **Answer Voting Service (React Native)**:

```javascript
const answerVotingService = {
  
  // Vote on answer
  voteOnAnswer: async (answerId, voteType, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/answers/${answerId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error voting on answer:', error);
      throw error;
    }
  },
  
  // Get answers with user vote status (existing function)
  getAnswers: async (paperId, page = 1, limit = 10, sortBy = 'votes', token = null) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Include token for user vote status
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/api/papers/${paperId}/answers?page=${page}&limit=${limit}&sortBy=${sortBy}`,
        { headers }
      );
      
      return await response.json();
    } catch (error) {
      console.error('Error getting answers:', error);
      throw error;
    }
  }
};
```

### **Answer Component with Voting (React Native)**:

```jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AnswerCard = ({ answer, onVoteUpdate, userToken }) => {
  const [userVote, setUserVote] = useState(answer.userVote); // From backend
  const [upvotes, setUpvotes] = useState(answer.upvotes);
  const [downvotes, setDownvotes] = useState(answer.downvotes);
  const [totalVotes, setTotalVotes] = useState(answer.totalVotes);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteType) => {
    if (isVoting) return; // Prevent double-voting
    
    setIsVoting(true);
    
    try {
      const result = await answerVotingService.voteOnAnswer(answer.id, voteType, userToken);
      
      if (result.success) {
        // Update local state based on backend response
        if (result.alreadyVoted) {
          // Duplicate vote - no change
          Alert.alert('Info', result.message);
        } else {
          // Vote recorded successfully
          setUserVote(voteType);
          setUpvotes(result.data.upvotes);
          setDownvotes(result.data.downvotes);
          setTotalVotes(result.data.totalVotes);
          
          // Notify parent component if needed
          if (onVoteUpdate) {
            onVoteUpdate(answer.id, result.data);
          }
        }
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to vote on answer');
      console.error('Vote error:', error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <View style={styles.answerCard}>
      <Text style={styles.title}>{answer.title}</Text>
      <Text style={styles.content}>{answer.content}</Text>
      <Text style={styles.author}>By: {answer.userName}</Text>
      
      <View style={styles.voteContainer}>
        {/* Upvote Button */}
        <TouchableOpacity 
          style={[
            styles.voteButton, 
            userVote === 'upvote' && styles.upvoteActive,
            isVoting && styles.disabledButton
          ]}
          onPress={() => handleVote('upvote')}
          disabled={isVoting}
        >
          <Icon 
            name="keyboard-arrow-up" 
            size={28} 
            color={userVote === 'upvote' ? '#4CAF50' : '#666'} 
          />
          <Text style={[
            styles.voteCount,
            userVote === 'upvote' && styles.upvoteText
          ]}>
            {upvotes}
          </Text>
        </TouchableOpacity>

        {/* Total Score */}
        <View style={styles.totalScore}>
          <Text style={[
            styles.totalScoreText,
            totalVotes > 0 && styles.positiveScore,
            totalVotes < 0 && styles.negativeScore
          ]}>
            {totalVotes > 0 ? `+${totalVotes}` : totalVotes}
          </Text>
        </View>

        {/* Downvote Button */}
        <TouchableOpacity 
          style={[
            styles.voteButton, 
            userVote === 'downvote' && styles.downvoteActive,
            isVoting && styles.disabledButton
          ]}
          onPress={() => handleVote('downvote')}
          disabled={isVoting}
        >
          <Icon 
            name="keyboard-arrow-down" 
            size={28} 
            color={userVote === 'downvote' ? '#F44336' : '#666'} 
          />
          <Text style={[
            styles.voteCount,
            userVote === 'downvote' && styles.downvoteText
          ]}>
            {downvotes}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Comments Count */}
      <View style={styles.statsContainer}>
        <Text style={styles.commentsCount}>
          💬 {answer.commentsCount} comments
        </Text>
        <Text style={styles.createdAt}>
          {new Date(answer.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  answerCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  content: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  author: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginVertical: 8,
  },
  voteButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  upvoteActive: {
    backgroundColor: '#E8F5E8',
  },
  downvoteActive: {
    backgroundColor: '#FFEBEE',
  },
  disabledButton: {
    opacity: 0.6,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#666',
  },
  upvoteText: {
    color: '#4CAF50',
  },
  downvoteText: {
    color: '#F44336',
  },
  totalScore: {
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  totalScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#666',
  },
  positiveScore: {
    color: '#4CAF50',
  },
  negativeScore: {
    color: '#F44336',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentsCount: {
    fontSize: 12,
    color: '#666',
  },
  createdAt: {
    fontSize: 12,
    color: '#999',
  },
});

export default AnswerCard;
```

### **Usage in Main Screen**:

```jsx
const AnswersScreen = ({ route }) => {
  const { paperId } = route.params;
  const [answers, setAnswers] = useState([]);
  const [userToken] = useContext(AuthContext);
  
  const handleVoteUpdate = (answerId, voteData) => {
    // Update the answer in the list
    setAnswers(prevAnswers => 
      prevAnswers.map(answer => 
        answer.id === answerId 
          ? { ...answer, ...voteData }
          : answer
      )
    );
  };

  const loadAnswers = async () => {
    try {
      const result = await answerVotingService.getAnswers(paperId, 1, 10, 'votes', userToken);
      
      if (result.success) {
        setAnswers(result.data.answers);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load answers');
    }
  };

  return (
    <FlatList
      data={answers}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <AnswerCard 
          answer={item} 
          onVoteUpdate={handleVoteUpdate}
          userToken={userToken}
        />
      )}
      onRefresh={loadAnswers}
      refreshing={loading}
    />
  );
};
```

---

## 🗄️ **Database Schema**

### **Collection: `answerVotes`**
```javascript
{
  id: "vote_answer123_user456",
  answerId: "answer123",
  userId: "user456",
  voteType: "upvote", // or "downvote"
  createdAt: "2025-10-04T12:00:00.000Z"
}
```

### **Answer Document Updates**
```javascript
{
  id: "answer123",
  title: "Solution to the problem",
  content: "Here's how to solve it...",
  upvotes: 15,      // Updated by voting
  downvotes: 2,     // Updated by voting
  totalVotes: 13,   // Calculated: upvotes - downvotes
  userVote: "upvote", // User's current vote (from API response)
  // ... other fields
}
```

---

## 🧪 **Testing the Answer Voting**

### **Test with Postman/Curl**:

```bash
# 1. Vote on answer
POST http://localhost:4000/api/answers/ANSWER_ID/vote
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body: {"voteType": "upvote"}

# 2. Try duplicate vote (should be ignored)
POST http://localhost:4000/api/answers/ANSWER_ID/vote
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body: {"voteType": "upvote"}

# 3. Change vote
POST http://localhost:4000/api/answers/ANSWER_ID/vote
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body: {"voteType": "downvote"}

# 4. Get answers to see updated counts
GET http://localhost:4000/api/papers/PAPER_ID/answers
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

---

## ✅ **Features Summary**

Your Answer Voting System now includes:

- ✅ **Upvote/Downvote**: Users can vote on answers
- ✅ **Duplicate Prevention**: Same vote ignored with success response
- ✅ **Vote Changes**: Users can switch between upvote/downvote
- ✅ **Self-Vote Prevention**: Users cannot vote on their own answers
- ✅ **User Vote Status**: API returns `userVote` property for button colors
- ✅ **Real-time Updates**: Vote counts update immediately
- ✅ **Mobile Ready**: Complete React Native integration
- ✅ **Authentication**: JWT token required for all voting operations

## 🚀 **Ready to Use**

Your complete answer voting system is now live and working! Users can vote on answers just like they vote on comments. 🎉

**Both comment voting and answer voting are now fully functional!** ✨
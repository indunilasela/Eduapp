# 🎨 Frontend User Vote Integration Guide

## ✅ **Backend Changes Completed**

The backend now returns the current user's vote status for both answers and comments. Here's what changed:

### **New Response Format**

#### **Answer Response** - `/api/papers/:paperId/answers`
```json
{
  "success": true,
  "data": {
    "answers": [
      {
        "id": "answer_123",
        "title": "How to solve this problem",
        "content": "Here's the solution...",
        "upvotes": 5,
        "downvotes": 1,
        "totalVotes": 4,
        "userVote": "upvote",  // ✨ NEW: null, "upvote", or "downvote"
        "userId": "user456",
        "userName": "John Doe",
        // ... other fields
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

#### **Comment Response** - `/api/answers/:answerId/comments`
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_123",
        "content": "Great explanation!",
        "upvotes": 3,
        "downvotes": 0,
        "totalVotes": 3,
        "userVote": "upvote",  // ✨ NEW: null, "upvote", or "downvote"
        "userId": "user456",
        "userName": "Jane Smith",
        // ... other fields
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

---

## 🎯 **Frontend Implementation Guide**

### **React Native/React Implementation**

#### **1. Answer Component with Vote Colors**

```jsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AnswerCard = ({ answer, onVote, userToken }) => {
  const [userVote, setUserVote] = useState(answer.userVote); // From backend
  const [upvotes, setUpvotes] = useState(answer.upvotes);
  const [downvotes, setDownvotes] = useState(answer.downvotes);

  const handleVote = async (voteType) => {
    try {
      const result = await onVote(answer.id, voteType, userToken);
      
      if (result.success) {
        // Update local state based on backend response
        setUserVote(result.data.alreadyVoted ? userVote : voteType);
        setUpvotes(result.data.upvotes);
        setDownvotes(result.data.downvotes);
      }
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  return (
    <View style={styles.answerCard}>
      <Text style={styles.title}>{answer.title}</Text>
      <Text style={styles.content}>{answer.content}</Text>
      
      <View style={styles.voteContainer}>
        {/* Upvote Button */}
        <TouchableOpacity 
          style={[
            styles.voteButton, 
            userVote === 'upvote' && styles.upvoteActive
          ]}
          onPress={() => handleVote('upvote')}
        >
          <Icon 
            name="keyboard-arrow-up" 
            size={24} 
            color={userVote === 'upvote' ? '#4CAF50' : '#666'} 
          />
          <Text style={[
            styles.voteCount,
            userVote === 'upvote' && styles.upvoteText
          ]}>
            {upvotes}
          </Text>
        </TouchableOpacity>

        {/* Downvote Button */}
        <TouchableOpacity 
          style={[
            styles.voteButton, 
            userVote === 'downvote' && styles.downvoteActive
          ]}
          onPress={() => handleVote('downvote')}
        >
          <Icon 
            name="keyboard-arrow-down" 
            size={24} 
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
    </View>
  );
};

const styles = StyleSheet.create({
  answerCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  voteButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 4,
  },
  upvoteActive: {
    backgroundColor: '#E8F5E8',
  },
  downvoteActive: {
    backgroundColor: '#FFEBEE',
  },
  voteCount: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  upvoteText: {
    color: '#4CAF50',
  },
  downvoteText: {
    color: '#F44336',
  },
});
```

#### **2. Comment Component with Vote Colors**

```jsx
const CommentItem = ({ comment, onVote, userToken }) => {
  const [userVote, setUserVote] = useState(comment.userVote); // From backend
  const [upvotes, setUpvotes] = useState(comment.upvotes);
  const [downvotes, setDownvotes] = useState(comment.downvotes);

  const handleVote = async (voteType) => {
    try {
      const result = await onVote(comment.id, voteType, userToken);
      
      if (result.success) {
        // Update local state based on backend response
        setUserVote(result.data.alreadyVoted ? userVote : voteType);
        setUpvotes(result.data.upvotes);
        setDownvotes(result.data.downvotes);
      }
    } catch (error) {
      console.error('Comment vote error:', error);
    }
  };

  return (
    <View style={styles.commentItem}>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <Text style={styles.commentAuthor}>- {comment.userName}</Text>
      
      <View style={styles.commentVotes}>
        <TouchableOpacity 
          style={[
            styles.miniVoteButton,
            userVote === 'upvote' && styles.miniUpvoteActive
          ]}
          onPress={() => handleVote('upvote')}
        >
          <Icon 
            name="thumb-up" 
            size={16} 
            color={userVote === 'upvote' ? '#4CAF50' : '#999'} 
          />
          <Text style={[
            styles.miniVoteText,
            userVote === 'upvote' && { color: '#4CAF50' }
          ]}>
            {upvotes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.miniVoteButton,
            userVote === 'downvote' && styles.miniDownvoteActive
          ]}
          onPress={() => handleVote('downvote')}
        >
          <Icon 
            name="thumb-down" 
            size={16} 
            color={userVote === 'downvote' ? '#F44336' : '#999'} 
          />
          <Text style={[
            styles.miniVoteText,
            userVote === 'downvote' && { color: '#F44336' }
          ]}>
            {downvotes}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

#### **3. Service Functions**

```javascript
// Update your existing vote service functions
const voteService = {
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
      
      return await response.json();
    } catch (error) {
      console.error('Error voting on answer:', error);
      throw error;
    }
  },

  // Vote on comment
  voteOnComment: async (commentId, voteType, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error voting on comment:', error);
      throw error;
    }
  },

  // Get answers with user vote status
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
  },

  // Get comments with user vote status
  getComments: async (answerId, page = 1, limit = 20, token = null) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Include token for user vote status
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/api/answers/${answerId}/comments?page=${page}&limit=${limit}`,
        { headers }
      );
      
      return await response.json();
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }
};
```

#### **4. Main Screen Implementation**

```jsx
const AnswersScreen = ({ route }) => {
  const { paperId } = route.params;
  const [answers, setAnswers] = useState([]);
  const [userToken] = useContext(AuthContext); // Your auth context
  
  useEffect(() => {
    loadAnswers();
  }, []);

  const loadAnswers = async () => {
    try {
      const result = await voteService.getAnswers(paperId, 1, 10, 'votes', userToken);
      
      if (result.success) {
        // Each answer now has userVote property
        setAnswers(result.data.answers);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load answers');
    }
  };

  const handleAnswerVote = async (answerId, voteType) => {
    return await voteService.voteOnAnswer(answerId, voteType, userToken);
  };

  return (
    <FlatList
      data={answers}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <AnswerCard 
          answer={item} 
          onVote={handleAnswerVote}
          userToken={userToken}
        />
      )}
    />
  );
};
```

---

## 🎨 **CSS Styles for Web (React)**

```css
/* Vote button styles */
.vote-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.vote-button:hover {
  background-color: #f5f5f5;
}

.vote-button.upvote-active {
  background-color: #e8f5e8;
  color: #4caf50;
}

.vote-button.downvote-active {
  background-color: #ffebee;
  color: #f44336;
}

.vote-count {
  font-size: 12px;
  font-weight: bold;
  margin-top: 4px;
}

.vote-count.upvote {
  color: #4caf50;
}

.vote-count.downvote {
  color: #f44336;
}
```

---

## 🔧 **Key Features**

### ✅ **What's Working Now:**

1. **User Vote Status**: Backend returns `userVote` field (null, "upvote", or "downvote")
2. **Color Persistence**: Frontend can maintain vote colors based on `userVote`
3. **Automatic Token Detection**: Works with or without authentication
4. **Duplicate Vote Prevention**: Same vote ignored, different vote changes
5. **Real-time Updates**: Vote counts update immediately

### 📱 **Mobile App Integration:**

1. **Pass Token in Headers**: For both GET and POST requests
2. **Use userVote Property**: To set initial button colors
3. **Handle Vote Response**: Update local state based on backend response
4. **Maintain State**: Use useState to keep track of current vote status

---

## 🚀 **Testing**

```javascript
// Test the new functionality
const testUserVoteStatus = async () => {
  // 1. Login and get token
  const loginResponse = await login('user@example.com', 'password');
  const token = loginResponse.token;
  
  // 2. Get answers with vote status
  const answersResponse = await voteService.getAnswers('paper123', 1, 10, 'votes', token);
  console.log('Answer userVote:', answersResponse.data.answers[0].userVote);
  
  // 3. Vote on answer
  const voteResponse = await voteService.voteOnAnswer('answer123', 'upvote', token);
  console.log('Vote result:', voteResponse);
  
  // 4. Get updated answers
  const updatedAnswers = await voteService.getAnswers('paper123', 1, 10, 'votes', token);
  console.log('Updated userVote:', updatedAnswers.data.answers[0].userVote); // Should be 'upvote'
};
```

The backend now provides all the data your frontend needs to maintain vote colors and state! 🎉
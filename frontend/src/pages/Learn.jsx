import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Chip,
  CircularProgress,
  useTheme,
  Paper,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion } from 'framer-motion';

const subjects = [
  { name: 'Mathematics', icon: '📐', topics: ['Calculus', 'Algebra', 'Geometry', 'Statistics'] },
  { name: 'Science', icon: '🔬', topics: ['Physics', 'Chemistry', 'Biology', 'Astronomy'] },
  { name: 'Computer Science', icon: '💻', topics: ['Programming', 'Data Structures', 'Algorithms', 'Web Development'] },
  { name: 'Languages', icon: '🌍', topics: ['English', 'Spanish', 'French', 'German'] },
];

const Learn = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [loading, setLoading] = useState(false);
  const [lessonContent, setLessonContent] = useState(null);

  const handleGenerateLesson = async () => {
    if (!selectedTopic) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/ai/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty: difficulty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error code: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      setLessonContent(data.content);
    } catch (error) {
      console.error('Error generating lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Learn Something New
      </Typography>
      
      <Grid container spacing={4}>
        {/* Subject Selection */}
        <Grid item xs={12} md={3}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Subjects
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {subjects.map((subject) => (
                <motion.div
                  key={subject.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    fullWidth
                    variant={selectedSubject === subject ? 'contained' : 'outlined'}
                    onClick={() => setSelectedSubject(subject)}
                    startIcon={<span>{subject.icon}</span>}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {subject.name}
                  </Button>
                </motion.div>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Topic and Difficulty Selection */}
        <Grid item xs={12} md={9}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {selectedSubject ? (
              <>
                <Typography variant="h6" gutterBottom>
                  {selectedSubject.name} Topics
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {selectedSubject.topics.map((topic) => (
                    <Chip
                      key={topic}
                      label={topic}
                      onClick={() => setSelectedTopic(topic)}
                      sx={{ m: 0.5 }}
                      color={selectedTopic === topic ? 'primary' : 'default'}
                    />
                  ))}
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  Difficulty
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <Chip
                      key={level}
                      label={level.charAt(0).toUpperCase() + level.slice(1)}
                      onClick={() => setDifficulty(level)}
                      sx={{ m: 0.5 }}
                      color={difficulty === level ? 'primary' : 'default'}
                    />
                  ))}
                </Box>

                <Button
                  variant="contained"
                  onClick={handleGenerateLesson}
                  disabled={!selectedTopic || loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Generate Lesson'}
                </Button>
              </>
            ) : (
              <Box sx={{ 
                p: 4, 
                textAlign: 'center',
                color: 'text.secondary'
              }}>
                <Typography variant="h6">
                  Select a subject to get started
                </Typography>
                <Typography variant="body2">
                  Choose from our wide range of subjects to begin your learning journey
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Lesson Content */}
          {lessonContent && (
            <Paper 
              elevation={0}
              sx={{ 
                mt: 4, 
                p: 3,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  h1: ({ node, ...props }) => (
                    <Typography variant="h4" gutterBottom {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <Typography variant="h5" gutterBottom {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <Typography variant="h6" gutterBottom {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <Typography variant="body1" paragraph {...props} />
                  ),
                  code: ({ node, inline, ...props }) => (
                    inline ? (
                      <code style={{ 
                        backgroundColor: theme.palette.grey[100],
                        padding: '2px 4px',
                        borderRadius: 4,
                      }} {...props} />
                    ) : (
                      <Paper sx={{ p: 2, my: 2, bgcolor: theme.palette.grey[100] }}>
                        <code style={{ display: 'block' }} {...props} />
                      </Paper>
                    )
                  ),
                }}
              >
                {lessonContent}
              </ReactMarkdown>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Learn;

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
  useTheme,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const subjects = [
  { name: 'Mathematics', icon: '📐', topics: ['Calculus', 'Algebra', 'Geometry', 'Statistics'] },
  { name: 'Science', icon: '🔬', topics: ['Physics', 'Chemistry', 'Biology', 'Astronomy'] },
  { name: 'Computer Science', icon: '💻', topics: ['Programming', 'Data Structures', 'Algorithms', 'Web Development'] },
  { name: 'Languages', icon: '🌍', topics: ['English', 'Spanish', 'French', 'German'] },
];

const Practice = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleGenerateQuiz = async () => {
    if (!selectedTopic) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty: difficulty,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate quiz');
      
      const data = await response.json();
      setQuiz(data.quiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowResults(false);
      setScore(0);
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateScore();
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const handleNewQuiz = () => {
    setQuiz(null);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Practice & Quiz
      </Typography>
      
      {!quiz ? (
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
                    onClick={handleGenerateQuiz}
                    disabled={!selectedTopic || loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Start Quiz'}
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
                    Choose a subject to test your knowledge with interactive quizzes
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Paper 
          elevation={0}
          sx={{ 
            p: 4,
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {!showResults ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </Typography>
                
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                  {quiz.questions[currentQuestionIndex].question}
                </Typography>

                <FormControl component="fieldset">
                  <RadioGroup
                    value={selectedAnswers[currentQuestionIndex] || ''}
                    onChange={(e) => handleAnswerSelect(e.target.value)}
                  >
                    {quiz.questions[currentQuestionIndex].options.map((option, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FormControlLabel
                          value={option}
                          control={<Radio />}
                          label={option}
                          sx={{
                            mb: 1,
                            p: 1,
                            borderRadius: 1,
                            width: '100%',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        />
                      </motion.div>
                    ))}
                  </RadioGroup>
                </FormControl>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!selectedAnswers[currentQuestionIndex]}
                  >
                    {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish' : 'Next'}
                  </Button>
                </Box>
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                  Quiz Results
                </Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  Score: {score} out of {quiz.questions.length}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {Math.round((score / quiz.questions.length) * 100)}% Correct
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {quiz.questions.map((question, index) => (
                <Box key={index} sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Question {index + 1}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {question.question}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1">
                      Your answer: {selectedAnswers[index]}
                    </Typography>
                    {selectedAnswers[index] === question.correct_answer ? (
                      <CheckCircleOutlineIcon color="success" sx={{ ml: 1 }} />
                    ) : (
                      <ErrorOutlineIcon color="error" sx={{ ml: 1 }} />
                    )}
                  </Box>
                  
                  {selectedAnswers[index] !== question.correct_answer && (
                    <Typography variant="body1" color="success.main">
                      Correct answer: {question.correct_answer}
                    </Typography>
                  )}
                  
                  {question.explanation && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      {question.explanation}
                    </Alert>
                  )}
                </Box>
              ))}

              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={handleRetry}>
                  Retry Quiz
                </Button>
                <Button variant="contained" onClick={handleNewQuiz}>
                  New Quiz
                </Button>
              </Box>
            </motion.div>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default Practice;

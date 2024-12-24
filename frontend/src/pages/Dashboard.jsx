import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import ReactMarkdown from 'react-markdown';
import { useLocation, useNavigate } from 'react-router-dom';
import { aiService } from '../services/api';

// MathJax configuration
const mathJaxConfig = {
  loader: { load: ["[tex]/html"] },
  tex: {
    packages: { "[+]": ["html"] },
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]],
    processEscapes: true,
    processEnvironments: true,
  },
  options: {
    skipHtmlTags: ["script", "noscript", "style", "textarea", "pre"],
  },
};

const renderLatexContent = (content) => {
  if (typeof content !== 'string') {
    return content;
  }

  // Fix common LaTeX formatting issues
  content = content
    // Fix escaped characters
    .replace(/\\\\([^\\])/g, '\\$1')
    // Fix missing backslashes before LaTeX commands
    .replace(/([^\\])(begin|end|frac|sqrt|int|sum|prod|lim|to|infty|left|right|quad|qquad|text|mathbf|mathrm|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)/g, '$1\\$2')
    // Fix spacing around math delimiters
    .replace(/\$\$/g, '\n\n$$\n\n')
    // Remove any remaining double backslashes
    .replace(/\\\\/g, '\\');

  return content;
};

const LessonContent = ({ content }) => {
  const theme = useTheme();
  
  if (!content) return null;

  // Pre-process content to fix any remaining slash issues
  const processContent = (text) => {
    return text
      // Remove any stray backslashes not part of LaTeX commands
      .replace(/\\(?![a-zA-Z{])/g, '')
      // Ensure proper spacing around math delimiters
      .replace(/\s*\$\s*/g, '$')
      .replace(/\s*\$\$\s*/g, '$$')
      // Fix any double backslashes not in LaTeX commands
      .replace(/\\\\(?![a-zA-Z{])/g, '\\');
  };

  return (
    <MathJaxContext config={mathJaxConfig}>
      <Box sx={{ 
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          color: theme.palette.primary.main,
          mt: 3,
          mb: 2,
        },
        '& strong': {
          color: theme.palette.primary.main,
          fontWeight: 600,
        },
        '& ul, & ol': {
          pl: 3,
          '& li': {
            mb: 1,
          },
        },
        '& p': {
          mb: 2,
          lineHeight: 1.6,
        },
        '& code': {
          backgroundColor: theme.palette.grey[100],
          padding: '2px 4px',
          borderRadius: 1,
          fontFamily: 'monospace',
        },
        '& pre': {
          backgroundColor: theme.palette.grey[100],
          padding: 2,
          borderRadius: 1,
          overflow: 'auto',
          '& code': {
            padding: 0,
            backgroundColor: 'transparent',
          },
        },
      }}>
        <MathJax>
          <ReactMarkdown>
            {processContent(content)}
          </ReactMarkdown>
        </MathJax>
      </Box>
    </MathJaxContext>
  );
};

const getSubjectIcon = (subjectType) => {
  switch (subjectType) {
    case 'math':
      return '📐';
    case 'science':
      return '🔬';
    case 'practical':
      return '🛠️';
    case 'technology':
      return '💻';
    case 'language':
      return '📚';
    case 'arts':
      return '🎨';
    case 'business':
      return '💼';
    default:
      return '📖';
  }
};

const Quiz = ({ quiz }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0, percentage: 0 });
  const theme = useTheme();

  const handleAnswerSelect = (questionIndex, answer) => {
    if (!submitted) {
      setSelectedAnswers({
        ...selectedAnswers,
        [questionIndex]: answer
      });
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correctCount++;
      }
    });

    const percentage = (correctCount / totalQuestions) * 100;
    setScore({
      correct: correctCount,
      total: totalQuestions,
      percentage: percentage.toFixed(1)
    });
    setSubmitted(true);
  };

  return (
    <Box>
      {quiz.questions.map((question, questionIndex) => (
        <Box 
          key={questionIndex} 
          sx={{ 
            mb: 4,
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: submitted ? 
              (selectedAnswers[questionIndex] === question.correct_answer ? 
                'success.main' : 'error.main') : 
              'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="h6" gutterBottom color="primary">
            Question {questionIndex + 1}
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <MathJax>
              {question.question}
            </MathJax>
          </Box>
          
          <RadioGroup
            value={selectedAnswers[questionIndex] || ''}
            onChange={(e) => handleAnswerSelect(questionIndex, e.target.value)}
          >
            {question.options.map((option, optionIndex) => (
              <FormControlLabel
                key={optionIndex}
                value={option}
                control={
                  <Radio 
                    sx={{
                      color: submitted ? 
                        (option === question.correct_answer ? 'success.main' :
                         selectedAnswers[questionIndex] === option ? 'error.main' : 
                         'action.active') : 
                        'action.active'
                    }}
                  />
                }
                label={
                  <Box sx={{ 
                    color: submitted ? 
                      (option === question.correct_answer ? 'success.main' :
                       selectedAnswers[questionIndex] === option ? 'error.main' : 
                       'text.primary') : 
                      'text.primary'
                  }}>
                    <MathJax>{option}</MathJax>
                  </Box>
                }
                disabled={submitted}
              />
            ))}
          </RadioGroup>
          
          {submitted && (
            <Box sx={{ mt: 2 }}>
              {selectedAnswers[questionIndex] !== question.correct_answer ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <AlertTitle>Incorrect</AlertTitle>
                  The correct answer is: <MathJax>{question.correct_answer}</MathJax>
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <AlertTitle>Correct!</AlertTitle>
                </Alert>
              )}
              {question.explanation && (
                <Alert severity="info">
                  <AlertTitle>Explanation</AlertTitle>
                  <MathJax>{question.explanation}</MathJax>
                </Alert>
              )}
            </Box>
          )}
        </Box>
      ))}

      {!submitted && Object.keys(selectedAnswers).length === quiz.questions.length && (
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          fullWidth
          sx={{ 
            mt: 3,
            py: 2,
            backgroundColor: 'success.main',
            '&:hover': {
              backgroundColor: 'success.dark',
            }
          }}
        >
          Submit Quiz
        </Button>
      )}

      {submitted && (
        <Paper 
          elevation={3}
          sx={{ 
            mt: 4, 
            p: 3, 
            textAlign: 'center',
            background: theme.palette.primary.main,
            color: 'white'
          }}
        >
          <Typography variant="h4" gutterBottom>
            Quiz Results
          </Typography>
          <Typography variant="h2" gutterBottom>
            {score.percentage}%
          </Typography>
          <Typography variant="h5" gutterBottom>
            {score.correct} out of {score.total} correct
          </Typography>
          <Typography variant="h6">
            {score.percentage >= 80 ? '🎉 Excellent work!' : 
             score.percentage >= 60 ? '👍 Good effort! Keep practicing.' : 
             '📚 Keep studying! You\'ll improve with practice.'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

const Dashboard = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [lesson, setLesson] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subjectType, setSubjectType] = useState('');
  const [historyId, setHistoryId] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    // Check if we have a history item to display
    if (location.state?.historyItem) {
      const { topic, difficulty, subject_type, lesson_content, quiz_content, id } = location.state.historyItem;
      setTopic(topic);
      setDifficulty(difficulty);
      setSubjectType(subject_type);
      setHistoryId(id);
      if (lesson_content) setLesson(lesson_content);
      if (quiz_content) setQuiz(JSON.parse(quiz_content));
      
      // Clear the location state to avoid reloading on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state]);

  const handleGenerateLesson = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/ai/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ topic, difficulty })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate lesson');
      }

      setLesson(data.lesson);
      setSubjectType(data.subject_type);
      setHistoryId(data.history_id);
      setQuiz(null);
    } catch (error) {
      console.error('Error generating lesson:', error);
      setError(error.message || 'Failed to generate lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/ai/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          topic, 
          difficulty,
          history_id: historyId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate quiz');
      }

      setQuiz(data);
      setHistoryId(data.history_id);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError(error.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchVideo = async () => {
    setLoading(true);
    setError('');
    setVideoData(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/ai/search-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ topic, difficulty })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to find video');
      }

      setVideoData(data);
    } catch (error) {
      console.error('Error searching video:', error);
      setError(error.message || 'Failed to find video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MathJaxContext config={mathJaxConfig}>
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: { xs: 10, sm: 12 },
          mb: 4,
          pt: 3,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              color: theme => theme.palette.primary.main,
              fontWeight: 500,
            }}
          >
            {getSubjectIcon(subjectType)}
            Learning Dashboard
          </Typography>
        </Box>
        <Grid container spacing={3} sx={{ flex: 1, mb: 4 }}>
          {/* Input Section */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, background: theme.palette.background.paper, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" color="primary" sx={{ flexGrow: 1 }}>
                  Learn Anything {getSubjectIcon(subjectType)}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="What would you like to learn?"
                    placeholder="Enter any topic (e.g., Calculus, Cooking, Photography)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Difficulty Level"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    variant="outlined"
                  >
                    <MenuItem value="beginner">Beginner (New to the topic)</MenuItem>
                    <MenuItem value="intermediate">Intermediate (Some knowledge)</MenuItem>
                    <MenuItem value="advanced">Advanced (Deep understanding)</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={handleGenerateLesson}
                  disabled={loading || !topic}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  sx={{ 
                    minWidth: 200,
                    background: theme.palette.primary.main,
                    '&:hover': { background: theme.palette.primary.dark }
                  }}
                >
                  {loading ? 'Generating...' : 'Generate Lesson'}
                </Button>
                
                <Button
                  variant="contained"
                  onClick={handleGenerateQuiz}
                  disabled={loading || !topic}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  sx={{ 
                    minWidth: 200,
                    background: theme.palette.secondary.main,
                    '&:hover': { background: theme.palette.secondary.dark }
                  }}
                >
                  {loading ? 'Creating Quiz...' : 'Practice Quiz'}
                </Button>
                
                <Button
                  variant="contained"
                  onClick={searchVideo}
                  disabled={loading || !topic}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  sx={{ 
                    minWidth: 200,
                    background: theme.palette.error.main,
                    '&:hover': { background: theme.palette.error.dark }
                  }}
                >
                  {loading ? 'Searching...' : 'Find Video Tutorial'}
                </Button>
              </Box>
              
              {error && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* Video Section */}
          {videoData && (
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3, background: theme.palette.background.paper, borderRadius: 2 }}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Video Tutorial
                </Typography>
                <Box sx={{ position: 'relative', paddingTop: '56.25%', width: '100%', mb: 2 }}>
                  <iframe
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 0
                    }}
                    src={`https://www.youtube.com/embed/${videoData.videoId}`}
                    title={videoData.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  {videoData.title}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {videoData.description}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Lesson Content */}
          {lesson && (
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3, background: theme.palette.background.paper, borderRadius: 2 }}>
                <Typography variant="h4" color="primary" gutterBottom>
                  Lesson Content
                </Typography>
                <LessonContent content={lesson} />
                
                {/* Quiz Prompt */}
                <Box sx={{ 
                  mt: 4, 
                  p: 3, 
                  backgroundColor: theme.palette.grey[50], 
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.primary.light}`,
                  textAlign: 'center'
                }}>
                  <Typography variant="h5" color="primary" gutterBottom>
                    Ready to Test Your Knowledge?
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Take a quiz to reinforce your understanding of this topic.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleGenerateQuiz}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                    sx={{ 
                      minWidth: 200,
                      background: theme.palette.secondary.main,
                      '&:hover': { background: theme.palette.secondary.dark }
                    }}
                  >
                    {loading ? 'Creating Quiz...' : 'Take Quiz'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Quiz Section */}
          {quiz && (
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3, background: theme.palette.background.paper, borderRadius: 2 }}>
                <Typography variant="h4" color="primary" gutterBottom>
                  Quiz
                </Typography>
                <Quiz quiz={quiz} />
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </MathJaxContext>
  );
};

export default Dashboard;

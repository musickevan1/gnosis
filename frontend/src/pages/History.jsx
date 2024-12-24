import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  useTheme,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import { 
  History as HistoryIcon, 
  School, 
  Quiz, 
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MathJax } from 'better-react-mathjax';
import { useAsync } from '../hooks/useAsync';
import { aiService } from '../services/api';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const History = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [history, setHistory] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [confirmError, setConfirmError] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const { loading, error, execute: fetchHistory } = useAsync(async () => {
    const result = await aiService.getHistory(searchTerm, subjectFilter);
    setHistory(result.history);
  });

  useEffect(() => {
    let isMounted = true;
    
    const loadHistory = async () => {
      try {
        if (isMounted) {
          await fetchHistory();
        }
      } catch (error) {
        console.error('Error loading history:', error);
      }
    };

    loadHistory();
    
    return () => {
      isMounted = false;
    };
  }, [searchTerm, subjectFilter, fetchHistory]);

  const handleHistoryItemClick = async (historyId) => {
    try {
      const data = await aiService.getHistoryItem(historyId);
      navigate('/dashboard', { state: { historyItem: data } });
    } catch (error) {
      console.error('Error fetching history item:', error);
    }
  };

  const handleDeleteClick = (e, item) => {
    e.stopPropagation();
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await aiService.deleteHistoryItem(selectedItem.id);
      setHistory(history.filter(item => item.id !== selectedItem.id));
      setDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting history item:', error);
    }
  };

  const handleClearAllClick = () => {
    setConfirmText('');
    setConfirmError(false);
    setClearAllDialogOpen(true);
  };

  const handleClearAllConfirm = async () => {
    if (confirmText !== 'CONFIRM') {
      setConfirmError(true);
      return;
    }

    try {
      await aiService.clearAllHistory();
      setHistory([]);
      setClearAllDialogOpen(false);
      setConfirmText('');
      setConfirmError(false);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  return (
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
            color: theme => theme.palette.primary.main
          }}
        >
          <HistoryIcon fontSize="large" color="primary" />
          Learning History
        </Typography>
        {history.length > 0 && (
          <Tooltip title="Clear All History">
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={handleClearAllClick}
            >
              Clear All History
            </Button>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Topics"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Subject</InputLabel>
              <Select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                label="Filter by Subject"
              >
                <MenuItem value="">All Subjects</MenuItem>
                <MenuItem value="math">Mathematics</MenuItem>
                <MenuItem value="science">Science</MenuItem>
                <MenuItem value="history">History</MenuItem>
                <MenuItem value="language">Language</MenuItem>
                <MenuItem value="programming">Programming</MenuItem>
                <MenuItem value="arts">Arts</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {history.map((item) => (
          <Grid item xs={12} key={item.id}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  {item.topic}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="View Content">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleHistoryItemClick(item.id)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={(e) => handleDeleteClick(e, item)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={item.subject_type}
                  color="primary"
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
                <Chip
                  label={item.difficulty}
                  color="secondary"
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  {formatDate(item.created_at)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {item.lesson_content && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <School fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Lesson Available
                    </Typography>
                  </Box>
                )}
                {item.quiz_content && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Quiz fontSize="small" color="secondary" />
                    <Typography variant="body2" color="text.secondary">
                      Quiz Available
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}

        {history.length === 0 && (
          <Grid item xs={12}>
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                bgcolor: 'background.paper',
                borderRadius: 2,
              }}
            >
              <HistoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No History Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start learning new topics to build your history!
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete History Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this history item?
            {selectedItem && (
              <Box sx={{ mt: 1, fontWeight: 'bold' }}>
                Topic: {selectedItem.topic}
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog 
        open={clearAllDialogOpen} 
        onClose={() => {
          setClearAllDialogOpen(false);
          setConfirmText('');
          setConfirmError(false);
        }}
      >
        <DialogTitle>Clear All History</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to clear your entire learning history? This action cannot be undone.
          </Typography>
          <Typography gutterBottom color="error" sx={{ mt: 2 }}>
            Type 'CONFIRM' to proceed:
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              setConfirmError(false);
            }}
            error={confirmError}
            helperText={confirmError ? "Please type 'CONFIRM' to proceed" : ''}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setClearAllDialogOpen(false);
              setConfirmText('');
              setConfirmError(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleClearAllConfirm} 
            color="error"
            disabled={confirmText !== 'CONFIRM'}
          >
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default History;

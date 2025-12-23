import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button,
  Paper, Avatar
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import HomeIcon from '@mui/icons-material/Home';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 6, width: '100%', textAlign: 'center' }}>
          <Avatar sx={{ m: 'auto', mb: 3, bgcolor: 'error.main', width: 80, height: 80 }}>
            <ErrorIcon sx={{ fontSize: 40 }} />
          </Avatar>
          
          <Typography component="h1" variant="h2" gutterBottom>
            404
          </Typography>
          
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Страница не найдена
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            Страница, которую вы ищете, не существует или была перемещена.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              size="large"
            >
              На главную
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              size="large"
            >
              Назад
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound;
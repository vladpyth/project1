import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, TextField, Button,
  Alert, Paper, Avatar, Grid, Card, CardContent
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';

const AccountSettings = () => {
  const [userData, setUserData] = useState(null);
  const [accountForm, setAccountForm] = useState({
    fullName: '',
    phone: '',
    address: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/account');
      if (!response.ok) throw new Error('Ошибка загрузки данных');
      
      const data = await response.json();
      setUserData(data);
      setAccountForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        address: data.address || ''
      });
    } catch (err) {
      setError('Не удалось загрузить данные аккаунта');
    }
  };

  const handleAccountChange = (e) => {
    setAccountForm({
      ...accountForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveAccount = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch('http://localhost:8080/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm)
      });
      
      const result = await response.text();
      if (result.startsWith('1.')) {
        setSuccess(result);
        fetchUserData();
      } else {
        setError(result);
      }
    } catch (err) {
      setError('Ошибка сохранения данных');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Валидация
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('Заполните все поля');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch('http://localhost:8080/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm)
      });
      
      const result = await response.text();
      if (result.startsWith('1.')) {
        setSuccess(result);
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else if (result.startsWith('2.')) {
        setError(result);
      } else if (result.startsWith('3.')) {
        setError(result);
      } else {
        setError('Ошибка изменения пароля');
      }
    } catch (err) {
      setError('Ошибка изменения пароля');
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <Container sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h6">Загрузка данных аккаунта...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            <SettingsIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Настройки аккаунта
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Информация об аккаунте */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Информация об аккаунте</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Логин"
                    value={userData.login}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={userData.email}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ФИО"
                    name="fullName"
                    value={accountForm.fullName}
                    onChange={handleAccountChange}
                    variant="outlined"
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Телефон"
                    name="phone"
                    value={accountForm.phone}
                    onChange={handleAccountChange}
                    variant="outlined"
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Адрес доставки"
                    name="address"
                    value={accountForm.address}
                    onChange={handleAccountChange}
                    variant="outlined"
                    multiline
                    rows={2}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleSaveAccount}
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : 'Сохранить данные'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Изменение пароля */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LockIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Изменение пароля</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Текущий пароль"
                    type="password"
                    name="oldPassword"
                    value={passwordForm.oldPassword}
                    onChange={handlePasswordChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Новый пароль"
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Подтверждение нового пароля"
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? 'Изменение...' : 'Изменить пароль'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AccountSettings;
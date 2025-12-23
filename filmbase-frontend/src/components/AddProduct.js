import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, TextField, Button, Typography,
  Alert, Paper, Avatar, Grid, FormControl, InputLabel,
  Select, MenuItem
} from '@mui/material';
import AddBoxIcon from '@mui/icons-material/AddBox';
import StoreIcon from '@mui/icons-material/Store';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryId: '',
    stockQuantity: ''
  });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    const required = ['name', 'price', 'categoryId', 'stockQuantity'];
    for (const field of required) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        setError(`Поле "${getFieldLabel(field)}" обязательно для заполнения`);
        return false;
      }
    }
    
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setError('Введите корректную цену');
      return false;
    }
    
    const stockQuantity = parseInt(formData.stockQuantity);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      setError('Введите корректное количество на складе');
      return false;
    }
    
    return true;
  };

  const getFieldLabel = (field) => {
    const labels = {
      name: 'Название товара',
      description: 'Описание',
      price: 'Цена',
      imageUrl: 'URL изображения',
      categoryId: 'Категория',
      stockQuantity: 'Количество на складе'
    };
    return labels[field] || field;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const category = categories.find(c => c.id === parseInt(formData.categoryId));
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl.trim(),
        category: category,
        stockQuantity: parseInt(formData.stockQuantity)
      };
      
      const response = await fetch('http://localhost:8080/api/products/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.text();
      
      if (result.startsWith('1.')) {
        setSuccess(result);
        setTimeout(() => navigate('/products'), 1500);
      } else {
        setError(result);
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              <AddBoxIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Добавление нового товара
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="name"
                  label="Название товара"
                  name="name"
                  autoComplete="off"
                  autoFocus
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="description"
                  label="Описание товара"
                  name="description"
                  autoComplete="off"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Подробное описание товара..."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="price"
                  label="Цена"
                  name="price"
                  type="number"
                  autoComplete="off"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={loading}
                  inputProps={{ step: "0.01", min: "0" }}
                  helperText="В рублях"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="stockQuantity"
                  label="Количество на складе"
                  name="stockQuantity"
                  type="number"
                  autoComplete="off"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  disabled={loading}
                  inputProps={{ min: "0" }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Категория</InputLabel>
                  <Select
                    value={formData.categoryId}
                    label="Категория"
                    name="categoryId"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="imageUrl"
                  label="URL изображения"
                  name="imageUrl"
                  autoComplete="off"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="https://example.com/image.jpg"
                  helperText="Оставьте пустым, если нет изображения"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/products')}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={<StoreIcon />}
              >
                {loading ? 'Добавление...' : 'Добавить товар'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AddProduct;



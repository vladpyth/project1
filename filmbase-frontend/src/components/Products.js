import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Card, CardContent, CardMedia,
  Typography, Button, TextField, Box,
  Alert, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StoreIcon from '@mui/icons-material/Store';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userRole, setUserRole] = useState('NULL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryId: '',
    stockQuantity: ''
  });
  const navigate = useNavigate();

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const getImageUrl = (product) => {
    if (imageErrors[product.id]) {
      return 'https://via.placeholder.com/300x250?text=Ошибка+загрузки';
    }
    if (!product.imageUrl || product.imageUrl.trim() === '') {
      return 'https://via.placeholder.com/300x250?text=Нет+изображения';
    }
    return product.imageUrl;
  };

  useEffect(() => {
    checkUser();
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, products]);

  const checkUser = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/current-user');
      const role = await response.text();
      setUserRole(role);
    } catch (error) {
      console.error('Ошибка при проверке пользователя:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/products');
      if (!response.ok) throw new Error('Ошибка загрузки товаров');
      
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      setError('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category && p.category.id === parseInt(selectedCategory));
    }

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  };

  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      filterProducts();
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/products/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: searchTerm })
      });
      
      const data = await response.json();
      setFilteredProducts(data);
    } catch (err) {
      setError('Ошибка поиска');
    }
  };

  const handleAddToCart = async (product, quantity = 1) => {
    if (userRole === 'NULL') {
      navigate('/login');
      return;
    }

    if (product.stockQuantity < quantity) {
      setError(`Недостаточно товара на складе. Доступно: ${product.stockQuantity} шт.`);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity })
      });
      
      const result = await response.text();
      if (result === 'GOOD') {
        setSuccess(`Товар "${product.name}" добавлен в корзину`);
        setTimeout(() => setSuccess(''), 3000);
      } else if (result === 'ERRORAUTH') {
        setError('Необходимо войти в систему');
      } else if (result === 'ERRORSTOCK') {
        setError('Недостаточно товара на складе');
      } else {
        setError('Ошибка добавления товара в корзину');
      }
    } catch (err) {
      setError('Ошибка добавления товара в корзину');
    }
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      imageUrl: product.imageUrl || '',
      categoryId: product.category ? product.category.id : '',
      stockQuantity: product.stockQuantity
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const category = categories.find(c => c.id === parseInt(editForm.categoryId));
      const productData = {
        id: selectedProduct.id,
        name: editForm.name,
        description: editForm.description,
        price: parseFloat(editForm.price),
        imageUrl: editForm.imageUrl,
        category: category,
        stockQuantity: parseInt(editForm.stockQuantity)
      };
      
      const response = await fetch('http://localhost:8080/api/products/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      const result = await response.text();
      if (result.startsWith('1.')) {
        setSuccess(result);
        setEditDialogOpen(false);
        fetchProducts();
      } else {
        setError(result);
      }
    } catch (err) {
      setError('Ошибка редактирования товара');
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Удалить товар "${product.name}"?`)) {
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id })
      });
      
      const result = await response.text();
      if (result.startsWith('1.')) {
        setSuccess(result);
        fetchProducts();
      } else {
        setError(result);
      }
    } catch (err) {
      setError('Ошибка удаления товара');
    }
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h6">Загрузка товаров...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Каталог товаров
        </Typography>
        
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
        
        {/* Фильтры и поиск */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Категория</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Категория"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="all">Все категории</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Поиск по названию или описанию..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                >
                  Поиск
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Сетка товаров */}
      <Grid container spacing={3}>
        {filteredProducts.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="250"
                image={getImageUrl(product)}
                alt={product.name}
                sx={{ objectFit: 'cover', bgcolor: 'grey.200' }}
                onError={() => handleImageError(product.id)}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Typography variant="h6" component="h3" sx={{ flex: 1 }}>
                    {product.name}
                  </Typography>
                  {userRole === 'ADMIN' && (
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(product)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(product)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                
                {product.category && (
                  <Chip
                    label={product.category.name}
                    size="small"
                    sx={{ mb: 1 }}
                    color="primary"
                    variant="outlined"
                  />
                )}
                
                <Typography variant="h6" color="primary" paragraph>
                  {product.price.toFixed(2)} ₽
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph sx={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mb: 1
                }}>
                  {product.description || 'Нет описания'}
                </Typography>
                
                <Typography variant="body2" color={product.stockQuantity > 0 ? 'success.main' : 'error.main'} sx={{ mb: 2 }}>
                  {product.stockQuantity > 0 
                    ? `В наличии: ${product.stockQuantity} шт.`
                    : 'Нет в наличии'}
                </Typography>
                
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddShoppingCartIcon />}
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stockQuantity === 0 || userRole === 'NULL'}
                >
                  {product.stockQuantity === 0 
                    ? 'Нет в наличии'
                    : userRole === 'NULL'
                    ? 'Войдите для покупки'
                    : 'В корзину'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredProducts.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <StoreIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Товары не найдены
          </Typography>
        </Box>
      )}

      {/* Диалог редактирования */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Редактирование товара</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Название товара"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Описание"
                multiline
                rows={4}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Цена"
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                inputProps={{ step: "0.01", min: "0" }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Количество на складе"
                type="number"
                value={editForm.stockQuantity}
                onChange={(e) => setEditForm({ ...editForm, stockQuantity: e.target.value })}
                inputProps={{ min: "0" }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="URL изображения"
                value={editForm.imageUrl}
                onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Категория</InputLabel>
                <Select
                  value={editForm.categoryId}
                  label="Категория"
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleEditSubmit} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Products;


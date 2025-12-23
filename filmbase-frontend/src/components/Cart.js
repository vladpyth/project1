import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Card, CardContent, CardMedia,
  Typography, Button, TextField, Box,
  Alert, IconButton, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const navigate = useNavigate();

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const getImageUrl = (product) => {
    if (imageErrors[product.id]) {
      return 'https://via.placeholder.com/120?text=Ошибка';
    }
    if (!product.imageUrl || product.imageUrl.trim() === '') {
      return 'https://via.placeholder.com/120?text=Нет+изображения';
    }
    return product.imageUrl;
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/cart');
      if (!response.ok) throw new Error('Ошибка загрузки корзины');
      
      const data = await response.json();
      setCartItems(data);
    } catch (err) {
      setError('Не удалось загрузить корзину');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartItem, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }

    if (cartItem.product.stockQuantity < newQuantity) {
      setError(`Недостаточно товара на складе. Доступно: ${cartItem.product.stockQuantity} шт.`);
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cartItem.id, quantity: newQuantity })
      });
      
      const result = await response.text();
      if (result === 'GOOD') {
        fetchCart();
      } else if (result === 'ERRORSTOCK') {
        setError('Недостаточно товара на складе');
      } else {
        setError('Ошибка обновления количества');
      }
    } catch (err) {
      setError('Ошибка обновления количества');
    }
  };

  const handleDelete = async (cartItem) => {
    try {
      const response = await fetch('http://localhost:8080/api/cart/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cartItem.id })
      });
      
      const result = await response.text();
      if (result === 'GOOD') {
        setSuccess(`Товар "${cartItem.product.name}" удален из корзины`);
        fetchCart();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Ошибка удаления товара');
      }
    } catch (err) {
      setError('Ошибка удаления товара');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const handleCreateOrder = async () => {
    if (!deliveryAddress.trim()) {
      setError('Укажите адрес доставки');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryAddress })
      });
      
      const result = await response.text();
      if (result === 'GOOD') {
        setSuccess('Заказ успешно оформлен!');
        setOrderDialogOpen(false);
        setDeliveryAddress('');
        fetchCart();
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      } else if (result === 'ERRORAUTH') {
        setError('Необходимо войти в систему');
      } else if (result === 'ERROREMPTY') {
        setError('Корзина пуста');
      } else if (result.startsWith('ERRORSTOCK_')) {
        const productName = result.replace('ERRORSTOCK_', '');
        setError(`Недостаточно товара "${productName}" на складе`);
      } else {
        setError('Ошибка оформления заказа');
      }
    } catch (err) {
      setError('Ошибка оформления заказа');
    }
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h6">Загрузка корзины...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Корзина
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
      </Box>

      {cartItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <ShoppingCartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Ваша корзина пуста
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/products')}
            sx={{ mt: 2 }}
          >
            Перейти к каталогу
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {/* Список товаров */}
            <Grid item xs={12} md={8}>
              {cartItems.map((item) => (
                <Card key={item.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <CardMedia
                          component="img"
                          height="120"
                          image={getImageUrl(item.product)}
                          alt={item.product.name}
                          sx={{ objectFit: 'cover', borderRadius: 1, bgcolor: 'grey.200' }}
                          onError={() => handleImageError(item.product.id)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" gutterBottom>
                          {item.product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {item.product.description && item.product.description.length > 100
                            ? item.product.description.substring(0, 100) + '...'
                            : item.product.description || 'Нет описания'}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {item.product.price.toFixed(2)} ₽
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          В наличии: {item.product.stockQuantity} шт.
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <TextField
                              size="small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = parseInt(e.target.value) || 1;
                                handleUpdateQuantity(item, newQty);
                              }}
                              inputProps={{ min: 1, max: item.product.stockQuantity }}
                              sx={{ width: 60 }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stockQuantity}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                          <Typography variant="h6" color="primary">
                            {(item.product.price * item.quantity).toFixed(2)} ₽
                          </Typography>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(item)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Grid>

            {/* Итого */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20 }}>
                <Typography variant="h5" gutterBottom>
                  Итого
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Товаров:</Typography>
                    <Typography>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} шт.</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Сумма:</Typography>
                    <Typography variant="h6" color="primary">
                      {calculateTotal().toFixed(2)} ₽
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<ShoppingBagIcon />}
                  onClick={() => setOrderDialogOpen(true)}
                >
                  Оформить заказ
                </Button>
              </Paper>
            </Grid>
          </Grid>

          {/* Диалог оформления заказа */}
          <Dialog open={orderDialogOpen} onClose={() => setOrderDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Оформление заказа</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Итого к оплате: {calculateTotal().toFixed(2)} ₽
                </Typography>
                <TextField
                  fullWidth
                  label="Адрес доставки"
                  multiline
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Введите адрес доставки..."
                  sx={{ mt: 2 }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOrderDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleCreateOrder} variant="contained">
                Оформить заказ
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  );
};

export default Cart;


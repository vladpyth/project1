import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Grid, Card, CardContent,
  CardMedia, Button, Alert, Chip
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SecurityIcon from '@mui/icons-material/Security';
import StoreIcon from '@mui/icons-material/Store';

const HomePage = () => {
  const [userRole, setUserRole] = useState('NULL');
  const [products, setProducts] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const navigate = useNavigate();

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const getImageUrl = (product) => {
    if (imageErrors[product.id]) {
      return 'https://via.placeholder.com/300x200?text=Ошибка+загрузки';
    }
    if (!product.imageUrl || product.imageUrl.trim() === '') {
      return 'https://via.placeholder.com/300x200?text=Нет+изображения';
    }
    return product.imageUrl;
  };

  useEffect(() => {
    checkUser();
    fetchProducts();
  }, []);

  const checkUser = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/current-user');
      const role = await response.text();
      setUserRole(role);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/products');
      const data = await response.json();
      // Берем только 4 товара для главной страницы
      setProducts(data.slice(0, 4));
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    }
  };

  const features = [
    {
      icon: <StoreIcon sx={{ fontSize: 60 }} color="primary" />,
      title: 'Широкий ассортимент',
      description: 'Большой выбор товаров различных категорий по выгодным ценам'
    },
    {
      icon: <LocalShippingIcon sx={{ fontSize: 60 }} color="secondary" />,
      title: 'Быстрая доставка',
      description: 'Доставка заказов в кратчайшие сроки по всей стране'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 60 }} color="success" />,
      title: 'Безопасные покупки',
      description: 'Гарантия качества и безопасная оплата всех покупок'
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', my: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Добро пожаловать в наш магазин
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Лучшие товары по лучшим ценам
        </Typography>
        
        {userRole === 'NULL' && (
          <Box sx={{ mt: 4 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Для оформления заказов войдите в систему или зарегистрируйтесь
            </Alert>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ mr: 2 }}
            >
              Войти
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/register')}
            >
              Зарегистрироваться
            </Button>
          </Box>
        )}
      </Box>

      {/* Особенности */}
      <Box sx={{ my: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Преимущества нашего магазина
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                {feature.icon}
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Популярные товары */}
      <Box sx={{ my: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Популярные товары
        </Typography>
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={3} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                    onClick={() => navigate('/products')}>
                <CardMedia
                  component="img"
                  height="200"
                  image={getImageUrl(product)}
                  alt={product.name}
                  sx={{ objectFit: 'cover', bgcolor: 'grey.200' }}
                  onError={() => handleImageError(product.id)}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h3">
                    {product.name}
                  </Typography>
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
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {product.stockQuantity > 0 
                      ? `В наличии: ${product.stockQuantity} шт.`
                      : 'Нет в наличии'}
                  </Typography>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/products');
                    }}
                    fullWidth
                    variant="contained"
                    startIcon={<ShoppingCartIcon />}
                    disabled={product.stockQuantity === 0}
                  >
                    Подробнее
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        {products.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Товары загружаются...
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default HomePage;
import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent,
  Typography, Button, Box, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Accordion, AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CancelIcon from '@mui/icons-material/Cancel';
import ReceiptIcon from '@mui/icons-material/Receipt';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/orders');
      if (!response.ok) throw new Error('Ошибка загрузки заказов');
      
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId) => {
    if (orderItems[orderId]) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/orders/${orderId}/items`);
      if (!response.ok) throw new Error('Ошибка загрузки позиций заказа');
      
      const data = await response.json();
      setOrderItems({ ...orderItems, [orderId]: data });
    } catch (err) {
      console.error('Ошибка загрузки позиций заказа:', err);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Отменить заказ №${order.id}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.text();
      if (result === 'GOOD') {
        setSuccess('Заказ успешно отменен');
        fetchOrders();
        setTimeout(() => setSuccess(''), 3000);
      } else if (result === 'ERRORSTATUS') {
        setError('Невозможно отменить заказ с текущим статусом');
      } else {
        setError('Ошибка отмены заказа');
      }
    } catch (err) {
      setError('Ошибка отмены заказа');
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
    setDetailsDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'В обработке':
        return 'warning';
      case 'Отправлен':
        return 'info';
      case 'Доставлен':
        return 'success';
      case 'Отменен':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h6">Загрузка заказов...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Мои заказы
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

      {orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <ShoppingBagIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            У вас пока нет заказов
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Оформите первый заказ в корзине
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Заказ №{order.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Дата: {formatDate(order.orderDate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Адрес доставки: {order.deliveryAddress}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                      <Typography variant="h6" color="primary">
                        {order.totalAmount.toFixed(2)} ₽
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<ReceiptIcon />}
                      onClick={() => handleViewDetails(order)}
                    >
                      Детали заказа
                    </Button>
                    {order.status === 'В обработке' && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleCancelOrder(order)}
                      >
                        Отменить заказ
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Диалог деталей заказа */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Детали заказа №{selectedOrder?.id}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Статус:</Typography>
                  <Chip
                    label={selectedOrder.status}
                    color={getStatusColor(selectedOrder.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Дата заказа:</Typography>
                  <Typography variant="body1">{formatDate(selectedOrder.orderDate)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Адрес доставки:</Typography>
                  <Typography variant="body1">{selectedOrder.deliveryAddress}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Товары в заказе:
              </Typography>
              
              {orderItems[selectedOrder.id] ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Товар</TableCell>
                        <TableCell align="right">Цена</TableCell>
                        <TableCell align="right">Количество</TableCell>
                        <TableCell align="right">Сумма</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderItems[selectedOrder.id].map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product.name}</TableCell>
                          <TableCell align="right">{item.price.toFixed(2)} ₽</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            {(item.price * item.quantity).toFixed(2)} ₽
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <Typography variant="h6">Итого:</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary">
                            {selectedOrder.totalAmount.toFixed(2)} ₽
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>Загрузка товаров...</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Orders;



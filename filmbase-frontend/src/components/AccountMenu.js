import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Box, Toolbar, Typography, Button,
  Container, Avatar, IconButton, Tooltip, Menu, MenuItem, Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const AccountMenu = () => {
  const [userRole, setUserRole] = useState('NULL');
  const [cartCount, setCartCount] = useState(0);
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (userRole !== 'NULL') {
      fetchCartCount();
    }
  }, [userRole]);

  const checkUser = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/current-user');
      const role = await response.text();
      setUserRole(role);
    } catch (error) {
      console.error('Ошибка при проверке пользователя:', error);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/cart');
      if (response.ok) {
        const data = await response.json();
        const count = data.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      }
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
    }
  };

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    await fetch('http://localhost:8080/api/logout');
    setUserRole('NULL');
    setCartCount(0);
    navigate('/');
    window.location.reload();
  };

  const pages = userRole !== 'NULL' ? [
    { name: 'ТОВАРЫ', path: '/products' },
    { name: 'ЗАКАЗЫ', path: '/orders' },
  ] : [
    { name: 'ТОВАРЫ', path: '/products' },
  ];

  const settings = userRole !== 'NULL' ? [
    ...(userRole === 'ADMIN' ? [{ name: 'ДОБАВИТЬ ТОВАР', path: '/add-product' }] : []),
    { name: 'НАСТРОЙКИ', path: '/account-settings' },
    { name: 'ВЫХОД', action: handleLogout },
  ] : [
    { name: 'ВХОД', path: '/login' },
    { name: 'РЕГИСТРАЦИЯ', path: '/register' },
  ];

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <StoreIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            МАГАЗИН
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {pages.map((page) => (
                <MenuItem key={page.name} onClick={() => { navigate(page.path); handleCloseNavMenu(); }}>
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <StoreIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            МАГАЗИН
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                onClick={() => navigate(page.path)}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page.name}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {userRole !== 'NULL' && (
              <IconButton
                color="inherit"
                onClick={() => navigate('/cart')}
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={cartCount} color="secondary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            )}
            <Tooltip title="Открыть настройки">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={userRole} src="/static/images/avatar/2.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting.name} onClick={() => {
                  if (setting.path) {
                    navigate(setting.path);
                  } else if (setting.action) {
                    setting.action();
                  }
                  handleCloseUserMenu();
                }}>
                  <Typography textAlign="center">{setting.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default AccountMenu;
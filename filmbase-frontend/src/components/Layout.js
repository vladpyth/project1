import React from 'react';
import { Outlet } from 'react-router-dom';
import AccountMenu from './AccountMenu';
import { Container, Box } from '@mui/material';

const Layout = () => {
  return (
    <>
      <AccountMenu />
      <Container maxWidth="xl">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Outlet />
        </Box>
      </Container>
    </>
  );
};

export default Layout;
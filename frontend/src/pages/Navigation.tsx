import * as React from 'react';
import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
  Person,
  ShoppingCart,
  WarningAmberOutlined,
} from '@mui/icons-material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DoneIcon from '@mui/icons-material/Done';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import { DateTimePicker } from '@mui/lab';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import {
  AppBar,
  Autocomplete,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { logout, NotificationType, Role } from '../api/BasilApi';
import { ApiException } from '../api/createHttpClient';
import Basket from '../components/Basket';
import { Logo } from '../components/Logo';
import { useBasket } from '../hooks/useBasket';
import { useCategories } from '../hooks/useCategories';
import { useNotifications } from '../hooks/useNotifications';
import { usePendingState } from '../hooks/usePendingState';
import { useProducts } from '../hooks/useProducts';
import { useProfile } from '../hooks/useProfile';
import { useUsers } from '../hooks/useUsers';
import { useVirtualClock } from '../hooks/useVirtualClock';

interface LinkTabProps {
  label: string;
  slug?: string;
  handleFilter?: any;
}

function LinkTab({ slug, label, ...rest }: LinkTabProps) {
  return (
    <Tab
      component={Link}
      to={`/products${slug ? `?category=${slug}` : ''}`}
      label={label}
      {...rest}
    />
  );
}

function NavTabs(props: any) {
  const [value, setValue] = useState(0);
  const [queryParams] = useSearchParams();
  const { categories } = useCategories();

  useEffect(() => {
    const categoryIndex = categories.findIndex(
      c => c.slug === queryParams.get('category'),
    );
    setValue(categoryIndex !== -1 ? categoryIndex + 1 : 0);
  }, [queryParams, categories]);

  return (
    <Toolbar
      sx={{ width: '100%', minHeight: '0!important', px: '0!important' }}
    >
      <Tabs
        value={value}
        variant="scrollable"
        scrollButtons="auto"
        onChange={props.setCategory(value)}
      >
        <LinkTab key="all" label="all" />
        {categories?.map(c => (
          <LinkTab key={c.id} label={c.name} slug={c.slug} />
        ))}
      </Tabs>
    </Toolbar>
  );
}

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  color: 'inherit',
  '& .MuiFormControl-root': {
    border: 'none !important',
    borderRadius: '16px',
    backgroundColor: '#f7f7f7',
    '&:hover': {
      backgroundColor: '#eaeaea',
      alpha: '0.75',
    },
    marginRight: theme.spacing(3),
    marginLeft: 0,
    width: '100%',
  },
  '& .MuiAutocomplete-inputRoot': {
    padding: theme.spacing(0, 0, 0, 0),
    // vertical padding + font size from searchIcon
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '35ch',
    },
  },

  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
}));

function NavBar(props: any) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] =
    React.useState<null | HTMLElement>(null);
  const [anchorVC, setAnchorVC] = React.useState<null | HTMLElement>(null);

  const [list, setList] = useState([]);
  const { profile, load } = useProfile();
  const { setPending } = usePendingState();
  const [showBasket, setShowBasket] = React.useState(false);
  const navigate = useNavigate();
  const { products } = useProducts();
  const { users } = useUsers();
  const { basket } = useBasket();
  const { notifications } = useNotifications();
  const [date, setDate] = useVirtualClock();

  useEffect(() => {
    const u = users
      .filter(u => u.role === Role.FARMER)
      .map(user => ({
        ...user,
        type: 'Farmers',
      }));
    const p = products
      .filter(product => product.available > 0)
      .map(product => ({
        ...product,
        type: 'Products',
      }));
    setList([...u, ...p]);
  }, [products, users]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCloseNotifications = () => {
    setAnchorElNotifications(null);
  };

  const handleVC = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorVC(event.currentTarget);
  };

  const handleCloseVC = () => {
    setAnchorVC(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setPending(true);
      load();
      navigate('/');
    } catch (e) {
      toast.error((e as ApiException).message);
    }
  };

  const from = date.set({
    weekday: 6,
    hour: 9,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const to = from.plus({ hour: 38 });

  return (
    <>
      <AppBar position="fixed" sx={{ borderBottom: '1px solid #f3f4f6' }}>
        <Container>
          <Toolbar sx={{ px: '0!important' }}>
            <Menu
              id="menu-appbar"
              anchorEl={anchorVC}
              keepMounted
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              open={Boolean(anchorVC)}
              onClose={handleCloseVC}
            >
              <MenuItem>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    renderInput={props => <TextField {...props} />}
                    value={date.toJSDate()}
                    label="Virtual clock"
                    onChange={newDate => setDate(DateTime.fromJSDate(newDate))}
                  />
                </LocalizationProvider>
              </MenuItem>
            </Menu>
            <IconButton onClick={() => navigate('/products')}>
              <Logo />
            </IconButton>
            <Typography
              variant="h6"
              component="div"
              sx={{ ml: 1, mr: 'auto' }}
              onClick={handleVC}
            >
              Basil
            </Typography>
            <Box display={props.onProducts ? 'block' : 'none'}>
              <StyledAutocomplete
                id="free-solo-2-demo"
                disableClearable
                freeSolo
                options={
                  props.farmer
                    ? list.filter(
                        option => option.farmer?.email === props.farmer?.email,
                      )
                    : list
                }
                groupBy={(option: any) => option?.type}
                getOptionLabel={(option: any) =>
                  option?.type === 'Farmers'
                    ? option?.name + ' ' + option?.surname
                    : option?.name
                }
                onChange={(event, value: any) => {
                  if (value.type === 'Farmers') {
                    props.setFarmer(value);
                  } else {
                    props.handleSearch(value.name);
                  }
                }}
                renderOption={(props, option: any) => (
                  <Box
                    key={option.id}
                    component="li"
                    sx={{
                      '& > img': { mr: 2, flexShrink: 0 },
                    }}
                    {...props}
                  >
                    <Avatar
                      sx={{ m: 1 }}
                      src={
                        option?.type === 'Farmers'
                          ? option?.avatar
                          : option?.image
                      }
                    />
                    {option?.type === 'Farmers'
                      ? option?.name + ' ' + option?.surname
                      : option?.name}
                  </Box>
                )}
                autoHighlight
                renderInput={params => (
                  <TextField
                    onChange={e => props.handleSearch(e.target.value)}
                    placeholder="Search..."
                    sx={{ padding: 0 }}
                    {...params}
                    InputProps={{
                      ...params.InputProps,
                      autoComplete: 'new-password',
                      startAdornment: (
                        <InputAdornment position="start" sx={{ marginLeft: 1 }}>
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Box>
            {!profile ? (
              <Box
                sx={{
                  display: { md: 'flex' },
                  ml: 'auto',
                  alignItems: 'center',
                }}
              >
                <Button
                  component={Link}
                  to={'/login'}
                  sx={{ px: 3, marginRight: '16px' }}
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  to={'/signup'}
                  variant="contained"
                  sx={{ px: 3 }}
                >
                  Sign Up
                </Button>
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    display: { md: 'flex' },
                    ml: 'auto',
                    alignItems: 'center',
                  }}
                >
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    keepMounted
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                          width: 32,
                          height: 32,
                          ml: -0.5,
                          mr: 1,
                        },
                        '&:before': {
                          content: '""',
                          display: 'block',
                          position: 'absolute',
                          top: 0,
                          right: 14,
                          width: 10,
                          height: 10,
                          bgcolor: 'background.paper',
                          transform: 'translateY(-50%) rotate(45deg)',
                          zIndex: 0,
                        },
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    {profile && profile.role !== Role.CUSTOMER && (
                      <MenuItem onClick={() => navigate('/admin')}>
                        <AdminPanelSettingsIcon sx={{ mr: 2 }} /> Admin
                      </MenuItem>
                    )}
                    <MenuItem onClick={() => navigate('/account')}>
                      <Person sx={{ mr: 2 }} /> Account
                    </MenuItem>
                    <MenuItem>
                      <AccountBalanceWalletIcon sx={{ mr: 2 }} />{' '}
                      {profile && profile.balance} €
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 2 }} /> Logout
                    </MenuItem>
                  </Menu>
                  <IconButton
                    sx={{ display: !profile && 'none' }}
                    size="large"
                    aria-label="show notifications"
                    onClick={handleMenuNotifications}
                  >
                    <Badge badgeContent={notifications?.length}>
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                  <Menu
                    id="menu-appbar-notifications"
                    anchorEl={anchorElNotifications}
                    keepMounted
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 3,
                        '&:before': {
                          content: '""',
                          display: 'block',
                          position: 'absolute',
                          top: 0,
                          right: 14,
                          width: 10,
                          height: 10,
                          color: 'background.paper',
                          transform: 'translateY(-50%) rotate(45deg)',
                          zIndex: 0,
                        },
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    open={Boolean(anchorElNotifications)}
                    onClose={handleCloseNotifications}
                  >
                    <List
                      sx={{
                        width: 300,
                        maxWidth: 360,
                        bgcolor: 'background.paper',
                        position: 'relative',
                        overflow: 'auto',
                        maxHeight: 200,
                        '& ul': { padding: 0 },
                      }}
                    >
                      {!notifications.length ? (
                        <ListItem alignItems="center">
                          <ListItemIcon>
                            {' '}
                            <WarningAmberOutlined sx={{ color: '#ff9800' }} />
                          </ListItemIcon>
                          <ListItemText secondary="You have no notifications!" />
                        </ListItem>
                      ) : (
                        notifications.map(n => (
                          <Fragment key={n.id}>
                            <ListItem alignItems="flex-start">
                              <ListItemIcon>
                                {n.type === NotificationType.INFO && (
                                  <InfoOutlinedIcon
                                    sx={{ color: 'cornflowerblue' }}
                                  />
                                )}
                                {n.type === NotificationType.ERROR && (
                                  <ErrorOutlineIcon color="error" />
                                )}
                                {n.type === NotificationType.SUCCESS && (
                                  <DoneIcon color="primary" />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={n.title}
                                secondary={
                                  <React.Fragment>{n.message}</React.Fragment>
                                }
                              />
                            </ListItem>
                            <Divider variant="inset" component="li" />
                          </Fragment>
                        ))
                      )}
                    </List>
                  </Menu>
                  {date >= from && date <= to ? (
                    <IconButton
                      sx={{ display: !profile && 'none' }}
                      size="large"
                      aria-label="show cart"
                      onClick={() => setShowBasket(true)}
                    >
                      <Badge badgeContent={basket?.entries?.length}>
                        <ShoppingCart />
                      </Badge>
                    </IconButton>
                  ) : (
                    ''
                  )}
                  <IconButton
                    sx={{ display: !profile && 'none' }}
                    size="large"
                    onClick={handleMenu}
                  >
                    <Avatar src={profile && profile.avatar} />
                  </IconButton>
                </Box>
              </>
            )}
          </Toolbar>
          {props.products && <NavTabs {...props} />}
        </Container>
      </AppBar>

      <Drawer
        sx={{ width: '400px' }}
        anchor="right"
        open={showBasket}
        onClose={() => {
          setShowBasket(false);
          if (props.setBasketListener) props.setBasketListener(true);
        }}
      >
        <Box>
          <Grid container direction="row" spacing={1}>
            <Grid item xs={1}>
              <IconButton
                sx={{ margin: 1.5 }}
                onClick={() => {
                  setShowBasket(false);
                  if (props.setBasketListener) props.setBasketListener(true);
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Grid>
            <Grid item xs={11}>
              <Typography
                variant="h5"
                color="primary.main"
                fontWeight="bold"
                m={2}
              >
                Basket
              </Typography>
            </Grid>
          </Grid>
          <Basket
            balanceWarning={props.balanceWarning}
            setShowBasket={setShowBasket}
          />
        </Box>
      </Drawer>
    </>
  );
}

const NavigationBox = { NavTabs, NavBar };
export default NavigationBox;

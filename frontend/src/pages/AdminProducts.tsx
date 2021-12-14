import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Add } from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  InputBase,
  MenuItem,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { styled } from '@mui/material/styles';
import { Product, Role, User } from '../api/BasilApi';
import { AdminAppBar } from '../components/AdminAppBar';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { useProfile } from '../hooks/useProfile';
import { useUsers } from '../hooks/useUsers';
import { useVirtualClock } from '../hooks/useVirtualClock';

const columns: {
  key: keyof Product;
  title: string;
  sortable: boolean;
  width: number;
}[] = [
  {
    key: 'image',
    title: 'Image',
    sortable: false,
    width: 50,
  },
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    width: 300,
  },
  {
    key: 'description',
    title: 'Description',
    sortable: true,
    width: 400,
  },
  {
    key: 'price',
    title: 'Price',
    sortable: true,
    width: 100,
  },
  {
    key: 'category',
    title: 'Category',
    sortable: true,
    width: 100,
  },
  {
    key: 'farmer',
    title: 'Farmer',
    sortable: true,
    width: 100,
  },
];

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '16px',
  backgroundColor: '#ffffff',
  '&:hover': {
    backgroundColor: '#f7f7f7',
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const Description = styled(Box)({
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  maxWidth: 300,
});

export const AdminProducts = (props: {
  handleDrawerToggle: () => void;
  profile: User;
}) => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [dto, setDto] = useState<Partial<User>>(profile as User);
  const { products } = useProducts(true);
  const [sortedProducts, setSortedProducts] = useState<Product[]>([]);
  const [sorting, setSorting] = useState<{
    by: keyof Product;
    dir: 'asc' | 'desc';
  }>({ by: null, dir: 'asc' });

  useEffect(() => {
    if (products?.length) {
      const { by, dir } = sorting;
      if (by != null) {
        const mul = dir === 'asc' ? -1 : 1;
        const sorted = [...products].sort((a, b) =>
          a[by] < b[by] ? mul : -mul,
        );
        setSortedProducts(sorted);
      } else {
        setSortedProducts(products);
      }
    }
  }, [products, sorting]);

  useEffect(() => {
    setDto(profile as User);
  }, [profile]);

  const toggleSorting = (byKey: keyof Product) => () => {
    const { by, dir } = sorting;
    setSorting({
      by: by === byKey && dir === 'desc' ? null : byKey,
      dir: by == null ? 'asc' : dir === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleChange = (value: any) => {
    setSortedProducts(
      products.filter(
        p =>
          p.name.toLocaleLowerCase().includes(value.toLocaleLowerCase()) ||
          p.category.name
            .toLocaleLowerCase()
            .includes(value.toLocaleLowerCase()) ||
          p.category.slug
            .toLocaleLowerCase()
            .includes(value.toLocaleLowerCase()),
      ),
    );
  };
  const [searchParams, setSearchParams] = useSearchParams({
    category: 'all',
    farmer: 'all',
  });
  const [farmers, setFarmers] = useState(null);
  const { users } = useUsers();
  const sort = useCategories();
  const [date] = useVirtualClock();

  useEffect(() => {
    if (users) {
      setFarmers(users.filter(u => u.role === Role.FARMER));
    }
  }, [users]);

  const handleCategorySearchParams = (category: string) => {
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      category: category,
    });
  };

  const handleFarmerSearchParams = (f: string) => {
    if (f === 'all') {
      setSearchParams({
        ...Object.fromEntries(searchParams.entries()),
        farmer: f,
      });
    } else {
      const farmer = farmers.find((fa: User) => fa.email === f);
      setSearchParams({
        ...Object.fromEntries(searchParams.entries()),
        farmer: farmer.name + ' ' + farmer.surname,
      });
    }
  };

  const fromAvailability = date.set({
    weekday: 1,
    hour: 18,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const toAvailability = date.set({
    weekday: 6,
    hour: 9,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  const fromReserved =
    date.weekday === 1 && date.hour <= 9
      ? date
          .set({
            weekday: 7,
            hour: 23,
            minute: 0,
            second: 0,
            millisecond: 0,
          })
          .minus({ weeks: 1 })
      : date.set({
          weekday: 7,
          hour: 23,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
  const toReserved = fromReserved.plus({ hours: 10 });

  return (
    <>
      <AdminAppBar handleDrawerToggle={props.handleDrawerToggle}>
        <Typography
          variant="h6"
          noWrap
          component="h1"
          color="primary.main"
          fontWeight="bold"
          sx={{ minWidth: '6rem', fontSize: { sm: 28 }, mr: 'auto' }}
        >
          Products
        </Typography>
        <Search sx={{ mr: 'auto', maxWidth: '250px' }}>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search…"
            inputProps={{ 'aria-label': 'search' }}
            onChange={e => handleChange(e.target.value)}
          />
        </Search>
        <IconButton
          sx={{ ml: 1, display: { xs: 'flex', md: 'none' } }}
          className="add-icon-button"
          href="/admin/products/new"
        >
          <Add />
        </IconButton>
        <Button
          sx={{
            display: { xs: 'none', md: 'flex' },
          }}
          variant="contained"
          href="/admin/products/new"
          startIcon={<Add />}
        >
          <Typography display="inline" sx={{ textTransform: 'none' }}>
            Create product
          </Typography>
        </Button>
      </AdminAppBar>
      <Box sx={{ p: { xs: 1, sm: 2 }, pt: { sm: 0 }, flexGrow: 1 }}>
        <TableContainer
          component={Paper}
          sx={{ width: '100%', height: '100%' }}
        >
          <Table aria-label="Products table" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map(c =>
                  c.key === 'farmer' && !(props.profile.role === 'farmer') ? (
                    <TableCell
                      key={c.key}
                      sortDirection={sorting.by === c.key ? sorting.dir : false}
                      sx={{ width: c.width }}
                    >
                      <Grid container direction="column" spacing={1}>
                        <Grid item>
                          {c.sortable ? (
                            <TableSortLabel
                              active={sorting.by === c.key}
                              direction={
                                sorting.by === c.key ? sorting.dir : 'asc'
                              }
                              onClick={toggleSorting(c.key)}
                            >
                              {c.title}
                            </TableSortLabel>
                          ) : (
                            c.title
                          )}
                        </Grid>
                        <Grid item>
                          {c.key === 'farmer' ? (
                            <TextField
                              id="outlined-select-farmer"
                              select
                              value={searchParams.get('farmer')}
                              label="Filter by farmer"
                              size="small"
                              sx={{ width: '175px' }}
                              onChange={e =>
                                handleFarmerSearchParams(e.target.value)
                              }
                            >
                              <MenuItem key="all" value="all">
                                {'All'}
                              </MenuItem>
                              {farmers?.map((option: User) => (
                                <MenuItem key={option.id} value={option.email}>
                                  {option.name} {option.surname}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : (
                            <></>
                          )}
                        </Grid>
                      </Grid>
                    </TableCell>
                  ) : (c.key === 'farmer' && props.profile.role === 'farmer') ||
                    (c.key === 'description' &&
                      props.profile.role === 'warehouse_manager') ? (
                    <></>
                  ) : (
                    <TableCell
                      key={c.key}
                      sortDirection={sorting.by === c.key ? sorting.dir : false}
                      sx={{ width: c.width }}
                    >
                      <Grid container direction="column" spacing={1}>
                        <Grid item>
                          {c.sortable ? (
                            <TableSortLabel
                              active={sorting.by === c.key}
                              direction={
                                sorting.by === c.key ? sorting.dir : 'asc'
                              }
                              onClick={toggleSorting(c.key)}
                            >
                              {c.title}
                            </TableSortLabel>
                          ) : (
                            c.title
                          )}
                        </Grid>
                        <Grid item>
                          {c.key === 'category' ? (
                            <TextField
                              id="outlined-select-category"
                              select
                              value={searchParams.get('category')}
                              label="Filter by category"
                              size="small"
                              sx={{ width: '175px' }}
                              onChange={e =>
                                handleCategorySearchParams(e.target.value)
                              }
                            >
                              <MenuItem key="all" value="all">
                                All
                              </MenuItem>
                              {sort.categories.map(option => (
                                <MenuItem key={option.id} value={option.slug}>
                                  {option.name}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : (
                            <></>
                          )}
                        </Grid>
                      </Grid>
                    </TableCell>
                  ),
                )}
                {props.profile.role === 'farmer' ? (
                  <TableCell>{'Notes'}</TableCell>
                ) : (
                  <></>
                )}
                {props.profile.role === 'warehouse_manager' ? (
                  <TableCell>{'Actions'}</TableCell>
                ) : (
                  <></>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProducts
                ?.filter(
                  p =>
                    !searchParams.get('category') ||
                    searchParams.get('category') === 'all' ||
                    p.category.slug === searchParams.get('category'),
                )
                ?.filter(
                  p =>
                    !searchParams.get('farmer') ||
                    searchParams.get('farmer') === 'all' ||
                    p.farmer.name + ' ' + p.farmer.surname ===
                      searchParams.get('farmer'),
                )
                ?.map(product => (
                  <TableRow
                    hover
                    key={product.id}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/admin/products/${product.id}`)}
                  >
                    <TableCell sx={{ py: 0 }}>
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    </TableCell>
                    <TableCell
                      component="th"
                      scope="row"
                      align="left"
                      sx={{ pr: 0 }}
                    >
                      {product.name}
                    </TableCell>
                    {!(props.profile.role === 'warehouse_manager') && (
                      <TableCell sx={{ pr: 0 }}>
                        <Description>{product.description}</Description>
                      </TableCell>
                    )}
                    <TableCell>{product.price}</TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    {props.profile.role === 'farmer' ? (
                      <>
                        <TableCell>
                          {product.available === 0 &&
                            date >= fromAvailability &&
                            date <= toAvailability && (
                              <Alert severity="warning">
                                {'Remember to update the availability field'}
                              </Alert>
                            )}
                          {date >= fromReserved && date <= toReserved && (
                            <Alert severity="warning">
                              {"Remember to confirm orders' booking"}
                            </Alert>
                          )}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          {product.farmer.name + ' ' + product.farmer.surname}
                        </TableCell>

                        {props.profile.role === 'warehouse_manager' && (
                          <TableCell>azioni da implementare</TableCell>
                        )}
                      </>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

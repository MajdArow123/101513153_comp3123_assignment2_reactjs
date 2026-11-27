// Department / position search controls for the employee list.
// The page owns the values (they live in the URL), this component only shows them.
// - onChange(name, value): a field changed (the page debounces the actual search)
// - onSubmit():            Enter or the Search button -> search now, without waiting
// - onClear():             empty both fields and go back to the full list
import { Box, Button, InputAdornment, Paper, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

// Same limit as the backend validator, so a long paste can't cause a 400.
const MAX_LENGTH = 100;

function SearchBar({ department, position, onChange, onSubmit, onClear }) {
  const hasText = Boolean(department || position);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  const fieldProps = (name, label, placeholder) => ({
    id: `search-${name}`,
    name,
    label,
    placeholder,
    value: name === 'department' ? department : position,
    onChange: (event) => onChange(name, event.target.value),
    size: 'small',
    autoComplete: 'off',
    sx: { flex: '1 1 200px' },
    slotProps: {
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      },
      htmlInput: { maxLength: MAX_LENGTH },
    },
  });

  return (
    // role="search" marks this form as the page's search area for screen readers.
    <Paper variant="outlined" component="form" role="search" onSubmit={handleSubmit} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField {...fieldProps('department', 'Department', 'e.g. Engineering')} />
        <TextField {...fieldProps('position', 'Position', 'e.g. Developer')} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
            Search
          </Button>
          <Button variant="outlined" color="inherit" startIcon={<ClearIcon />} onClick={onClear} disabled={!hasText}>
            Clear
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

export default SearchBar;

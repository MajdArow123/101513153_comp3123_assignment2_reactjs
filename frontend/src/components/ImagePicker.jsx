// Lets the user choose a profile picture, checks it, and shows a preview before saving.
// The chosen File itself is kept in the parent form (it goes into the FormData).
// - onChange(file):    called with a valid File, or null when the choice is removed
// - onReject(message): called when the chosen file breaks the type/size rules
// - currentPictureUrl: the saved picture when editing (shown until a new one is chosen)
// - error:             message to show (client rejection or the backend's 400 message)
import { useEffect, useRef, useState } from 'react';
import { Avatar, Box, Button, Typography } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';

import { PICTURE_MAX_MB, PICTURE_TYPES, validatePictureFile } from '../utils/validation';
import { PLACEHOLDER_AVATAR } from '../utils/imageUrl';

function ImagePicker({ onChange, onReject, currentPictureUrl, error, disabled }) {
  const inputRef = useRef(null);

  // URL.createObjectURL gives a temporary local URL for the chosen file, so we can show
  // it before uploading. The browser keeps the file in memory until that URL is revoked,
  // so we revoke the old URL whenever the choice changes, and the last one on unmount.
  const [previewUrl, setPreviewUrl] = useState(null);
  const previewRef = useRef(null); // the same URL, readable from the unmount cleanup below

  const showPreview = (file) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    previewRef.current = url;
    setPreviewUrl(url);
  };

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const handleRemove = () => {
    showPreview(null);
    onChange(null);
  };

  const handleFileSelected = (event) => {
    const chosen = event.target.files?.[0];
    // Clear the input so choosing the SAME file again still triggers onChange.
    event.target.value = '';
    if (!chosen) return;

    // Client-side check for quick feedback; the backend checks again (incl. file content).
    const message = validatePictureFile(chosen);
    if (message) {
      onReject(message);
      return;
    }
    showPreview(chosen);
    onChange(chosen);
  };

  const shownUrl = previewUrl || currentPictureUrl || PLACEHOLDER_AVATAR;
  const hasPicture = Boolean(previewUrl || currentPictureUrl);

  let caption = 'No picture yet';
  if (previewUrl) caption = 'New picture (saved when you click Save)';
  else if (currentPictureUrl) caption = 'Current picture';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
      <Avatar
        src={shownUrl}
        alt={hasPicture ? 'Profile picture preview' : 'No profile picture'}
        sx={{ width: 112, height: 112, bgcolor: 'grey.200', border: 3, borderColor: previewUrl ? 'secondary.main' : 'grey.100' }}
      />

      <Box>
        <Typography sx={{ fontWeight: 600 }}>Profile picture</Typography>
        <Typography variant="body2" color="text.secondary">
          {caption}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          {/* The real file input is hidden; this button opens it (works with the keyboard too). */}
          <Button
            variant="outlined"
            startIcon={<PhotoCameraIcon />}
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            aria-describedby="picture-help picture-error"
          >
            {hasPicture ? 'Replace picture' : 'Choose picture'}
          </Button>
          {previewUrl && (
            <Button color="inherit" startIcon={<CloseIcon />} onClick={handleRemove} disabled={disabled}>
              Remove new picture
            </Button>
          )}
        </Box>

        <input
          ref={inputRef}
          type="file"
          accept={PICTURE_TYPES.join(',')}
          onChange={handleFileSelected}
          hidden
          aria-hidden="true"
          tabIndex={-1}
        />

        <Typography id="picture-help" variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
          JPEG, PNG or WebP, up to {PICTURE_MAX_MB} MB.
        </Typography>
        {/* role="alert": the rejection message is announced to screen readers. */}
        <Typography id="picture-error" variant="body2" color="error" role="alert" sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      </Box>
    </Box>
  );
}

export default ImagePicker;

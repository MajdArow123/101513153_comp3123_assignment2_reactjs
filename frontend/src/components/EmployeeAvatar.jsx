// An employee's profile picture, or the placeholder image when there is none
// (or when the picture fails to load, e.g. the file was removed).
import { useState } from 'react';
import { Avatar } from '@mui/material';
import { getImageUrl, PLACEHOLDER_AVATAR } from '../utils/imageUrl';
import { fullName } from '../utils/format';

function EmployeeAvatar({ employee, size = 40, sx }) {
  const url = getImageUrl(employee?.profile_picture);
  // Remember which URL failed, so a NEW picture (after an edit) is tried again.
  const [failedUrl, setFailedUrl] = useState(null);
  const src = url && url !== failedUrl ? url : PLACEHOLDER_AVATAR;

  const name = fullName(employee);

  return (
    <Avatar
      src={src}
      alt={url ? `Profile picture of ${name}` : `No profile picture for ${name}`}
      sx={{ width: size, height: size, bgcolor: 'grey.200', ...sx }}
      slotProps={{ img: { onError: () => setFailedUrl(url), loading: 'lazy' } }}
    />
  );
}

export default EmployeeAvatar;

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Paper,
  Stack,
  Collapse
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  VisibilityOff as HideIcon,
  Visibility as ShowIcon
} from '@mui/icons-material';

const ProfileSectionEditor = ({
  title,
  content,
  isEditable,
  isVisible = true,
  onSave,
  onToggleVisibility,
  multiline = false,
  privacyKey
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = async () => {
    try {
      await onSave(editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving section:', error);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <Paper sx={{ p: 3, mb: 2, position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Stack direction="row" spacing={1}>
          {isEditable && (
            <IconButton 
              size="small" 
              onClick={() => setIsEditing(!isEditing)}
              color={isEditing ? 'primary' : 'default'}
            >
              <EditIcon />
            </IconButton>
          )}
          {onToggleVisibility && (
            <IconButton
              size="small"
              onClick={() => onToggleVisibility(privacyKey)}
              color={isVisible ? 'default' : 'primary'}
              title={isVisible ? 'Make Private' : 'Make Public'}
            >
              {isVisible ? <HideIcon /> : <ShowIcon />}
            </IconButton>
          )}
        </Stack>
      </Box>

      <Collapse in={isEditing}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline={multiline}
            rows={multiline ? 4 : 1}
            value={editedContent || ''}
            onChange={(e) => setEditedContent(e.target.value)}
            variant="outlined"
            size="small"
            placeholder={`Enter your ${title.toLowerCase()}`}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      </Collapse>

      <Collapse in={!isEditing}>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: multiline ? 'pre-wrap' : 'normal',
            opacity: isVisible ? 1 : 0.5
          }}
        >
          {content || `No ${title.toLowerCase()} added yet`}
        </Typography>
      </Collapse>
    </Paper>
  );
};

export default ProfileSectionEditor; 
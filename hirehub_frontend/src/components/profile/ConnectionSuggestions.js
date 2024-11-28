import React from 'react';
import {
  Paper,
  Box,
  Avatar,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const demoConnections = [
  {
    id: 1,
    name: 'Frances Guerrero',
    title: 'News anchor',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg'
  },
  {
    id: 2,
    name: 'Lori Ferguson',
    title: 'Web Developer',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
  },
  {
    id: 3,
    name: 'Samuel Bishop',
    title: 'News anchor',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
  },
  {
    id: 4,
    name: 'Dennis Barrett',
    title: 'Web Developer at Stackbros',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg'
  },
  {
    id: 5,
    name: 'Judy Nguyen',
    title: 'News anchor',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg'
  },
];

const ConnectionSuggestions = () => {
  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Who to connect with
        </Typography>
      </Box>
      {demoConnections.map((connection, index) => (
        <Box key={connection.id} sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={connection.avatar} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {connection.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {connection.title}
              </Typography>
            </Box>
            <Button 
              size="small" 
              variant="outlined"
              sx={{ 
                borderRadius: 5,
                minWidth: 32,
                width: 32,
                height: 32,
                p: 0
              }}
            >
              <AddIcon />
            </Button>
          </Box>
          {index < demoConnections.length - 1 && <Divider sx={{ mt: 2 }} />}
        </Box>
      ))}
      <Button fullWidth sx={{ mt: 1 }} color="primary">
        View more
      </Button>
    </Paper>
  );
};

export default ConnectionSuggestions; 
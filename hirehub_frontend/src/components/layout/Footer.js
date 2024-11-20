import React from 'react';
import { Box, Container, Grid, Typography, Link, useTheme, useMediaQuery } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { isCompanyUser, isNormalUser } from '../../utils/permissions';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();

  const getFooterSections = () => {
    const sections = [];

    // Sections for employers (company users)
    if (!user || isCompanyUser(user.userType)) {
      sections.push({
        title: 'Company',
        links: [
          { label: 'About Us', href: '/about' },
          { label: 'Contact', href: '/contact' },
          { label: 'Privacy Policy', href: '/privacy' },
        ],
      });
    }

    // Sections for job seekers (normal users)
    if (!user || isNormalUser(user.userType)) {
      sections.unshift({
        title: 'For Job Seekers',
        links: [
          { label: 'Browse Jobs', href: '/jobs' },
          { label: 'Career Resources', href: '/resources' },
          { label: 'Skill Assessments', href: '/assessments' },
        ],
      });
    }

    // Sections for employers (company users)
    if (!user || isCompanyUser(user.userType)) {
      sections.unshift({
        title: 'For Employers',
        links: [
          { label: 'Post a Job', href: '/post-job' },
          { label: 'Talent Search', href: '/talent-search' },
          { label: 'Hiring Solutions', href: '/solutions' },
        ],
      });
    }

    return sections;
  };

  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {getFooterSections().map((section) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={3}
              key={section.title}
              sx={{
                textAlign: isMobile ? 'center' : 'left',
              }}
            >
              <Typography
                variant="h6"
                color="text.primary"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                {section.title}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    color="text.secondary"
                    sx={{
                      textDecoration: 'none',
                      '&:hover': {
                        color: 'primary.main',
                        textDecoration: 'none',
                      },
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>
        <Box
          sx={{
            mt: 4,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} HireHub. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 
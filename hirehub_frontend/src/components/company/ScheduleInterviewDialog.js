import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Grid,
    FormHelperText,
    CircularProgress
} from '@mui/material';
import moment from 'moment';
import { ThreeDots } from 'react-loader-spinner';

// Platform icons
import GoogleIcon from '@mui/icons-material/Google';
import VideocamIcon from '@mui/icons-material/Videocam';

// Make sure you have the correct import path for ThreeDot
// import { ThreeDot } from 'path-to-your-loader-library-or-component';

const ScheduleInterviewDialog = ({ open, onClose, onSchedule, applicant, isScheduling }) => {
    const [date, setDate] = useState(moment().add(1, 'days').format('YYYY-MM-DD'));
    const [time, setTime] = useState('10:00');
    const [platform, setPlatform] = useState('google_meet');
    const [interviewer, setInterviewer] = useState('');
    const [duration, setDuration] = useState(30);
    const [errors, setErrors] = useState({});

    const handleSubmit = () => {
        // Validate form
        const newErrors = {};
        
        if (!date) {
            newErrors.date = 'Please select a valid date';
        } else if (moment(date).isBefore(moment().startOf('day'))) {
            newErrors.date = 'Date cannot be in the past';
        }
        
        if (!time) {
            newErrors.time = 'Please select a valid time';
        }
        
        if (!interviewer.trim()) {
            newErrors.interviewer = 'Please enter interviewer name';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        // Combine date and time into a single datetime
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledDateTime = moment(date).set({
            hour: hours,
            minute: minutes,
            second: 0
        });
        
        // Prepare interview data
        const interviewData = {
            scheduled_date: scheduledDateTime.toISOString(),
            platform: platform,
            duration_minutes: duration,
            interviewer_name: interviewer
        };
        
        onSchedule(interviewData);
    };

    const handleClose = () => {
        // Reset form
        setDate(moment().add(1, 'days').format('YYYY-MM-DD'));
        setTime('10:00');
        setPlatform('google_meet');
        setInterviewer('');
        setDuration(30);
        setErrors({});
        onClose();
    };

    // Platform options with icons
    const platformOptions = [
        { value: 'google_meet', label: 'Google Meet', icon: <GoogleIcon /> },
        { value: 'zoom', label: 'Zoom', icon: <VideocamIcon /> }
    ];

    // Duration options
    const durationOptions = [
        { value: 15, label: '15 minutes' },
        { value: 30, label: '30 minutes' },
        { value: 45, label: '45 minutes' },
        { value: 60, label: '1 hour' },
        { value: 90, label: '1.5 hours' },
        { value: 120, label: '2 hours' }
    ];

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    {applicant && (
                        <Typography variant="subtitle1" gutterBottom>
                            Schedule an interview with {applicant.full_name}
                        </Typography>
                    )}

                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Interview Date"
                                type="date"
                                value={date}
                                onChange={(e) => {
                                    setDate(e.target.value);
                                    setErrors({ ...errors, date: null });
                                }}
                                error={!!errors.date}
                                helperText={errors.date}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                inputProps={{
                                    min: moment().format('YYYY-MM-DD')
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Interview Time"
                                type="time"
                                value={time}
                                onChange={(e) => {
                                    setTime(e.target.value);
                                    setErrors({ ...errors, time: null });
                                }}
                                error={!!errors.time}
                                helperText={errors.time}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="platform-select-label">Platform</InputLabel>
                                <Select
                                    labelId="platform-select-label"
                                    id="platform-select"
                                    value={platform}
                                    label="Platform"
                                    onChange={(e) => setPlatform(e.target.value)}
                                >
                                    {platformOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {option.icon}
                                                <Typography sx={{ ml: 1 }}>{option.label}</Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="duration-select-label">Duration</InputLabel>
                                <Select
                                    labelId="duration-select-label"
                                    id="duration-select"
                                    value={duration}
                                    label="Duration"
                                    onChange={(e) => setDuration(e.target.value)}
                                >
                                    {durationOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Interviewer Name"
                                value={interviewer}
                                onChange={(e) => {
                                    setInterviewer(e.target.value);
                                    setErrors({ ...errors, interviewer: null });
                                }}
                                placeholder="e.g. HR. Ali Alaswad"
                                error={!!errors.interviewer}
                                helperText={errors.interviewer || "Enter the name of the person conducting the interview"}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="inherit" disabled={isScheduling}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary" 
                    disabled={isScheduling}
                    sx={{ minWidth: 200 }}
                >
                    {isScheduling ? (
                        <ThreeDots
                            height="24"
                            width="24"
                            radius="9"
                            color="#32cd32"
                            ariaLabel="three-dots-loading"
                            wrapperStyle={{display: 'flex', justifyContent: 'center'}}
                            visible={true}
                        />
                    ) : (
                        'Schedule & Send Notification'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ScheduleInterviewDialog; 
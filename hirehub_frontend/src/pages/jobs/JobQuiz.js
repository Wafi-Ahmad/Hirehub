import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
} from '@mui/material';
import QuizUI from '../../components/quiz/_QuizUI';

const JobQuiz = () => {
    const { jobId } = useParams();
    
    return (
        <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
            <QuizUI jobId={jobId} />
        </Container>
    );
};

export default JobQuiz;
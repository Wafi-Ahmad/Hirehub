<TextField
    label="Skills"
    name="skills"
    value={filters.skills || ''}
    onChange={(e) => {
        const value = e.target.value;
        if (value.length <= 255) {
            const skills = value.split(',')
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0);
            if (skills.length <= 10) {
                // Send as comma-separated string, will be processed in JobList
                handleFilterChange('skills', value);
            }
        }
    }}
    helperText="Separate skills with commas (max 10 skills)"
    fullWidth
    margin="normal"
    variant="outlined"
/> 